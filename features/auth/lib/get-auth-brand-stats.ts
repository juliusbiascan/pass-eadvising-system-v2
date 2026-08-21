import { db } from "@/lib/db";
import {
  formatSemesterLabel,
  isSemesterTerm,
  type SemesterTermValue,
} from "@/lib/semester-terms";

import type { AuthBrandStats, AuthBrandSubject } from "./auth-brand-stats";

const PREVIEW_LIMIT = 4;

function uniqueSubjects(
  rows: { subject: AuthBrandSubject }[]
): AuthBrandSubject[] {
  const seen = new Set<string>();
  const subjects: AuthBrandSubject[] = [];

  for (const row of rows) {
    if (seen.has(row.subject.code)) continue;
    seen.add(row.subject.code);
    subjects.push(row.subject);
  }

  return subjects;
}

async function resolveActiveSemester(): Promise<SemesterTermValue> {
  const setting = await db.systemSetting.findUnique({
    where: { key: "activeSemester" },
    select: { value: true },
  });

  const value = setting?.value ?? "";
  return isSemesterTerm(value) ? value : "FIRST";
}

export async function getAuthBrandStats(): Promise<AuthBrandStats> {
  try {
    const semester = await resolveActiveSemester();

    const termLabel = formatSemesterLabel(semester);

    const [offerings, passedGrades, recordedGrades, catalogSubjects, catalogCount] =
      await Promise.all([
        db.curriculumSubject.findMany({
          where: {
            semester,
            curriculum: { isActive: true },
          },
          select: {
            subject: {
              select: {
                code: true,
                description: true,
              },
            },
          },
          orderBy: [{ yearLevel: "asc" }, { displayOrder: "asc" }],
        }),
        db.studentGrade.count({ where: { status: "PASSED" } }),
        db.studentGrade.count(),
        db.subject.findMany({
          select: { code: true, description: true },
          orderBy: { code: "asc" },
          take: PREVIEW_LIMIT,
        }),
        db.subject.count(),
      ]);

    const unique = uniqueSubjects(offerings);
    const fromTermOfferings = unique.length > 0;
    const subjects = (fromTermOfferings ? unique : catalogSubjects).slice(
      0,
      PREVIEW_LIMIT
    );
    const subjectCount = fromTermOfferings ? unique.length : catalogCount;
    const progressPct =
      recordedGrades > 0
        ? Math.min(100, Math.round((passedGrades / recordedGrades) * 100))
        : 0;

    const readyLabel =
      subjectCount === 0
        ? `No subjects offered for ${termLabel} yet`
        : fromTermOfferings
          ? `${subjectCount} subject${subjectCount === 1 ? "" : "s"} ready to take this ${termLabel}`
          : `${subjectCount} subject${subjectCount === 1 ? "" : "s"} in the catalog`;

    return {
      progressPct,
      termLabel,
      subjectCount,
      readyLabel,
      subjects,
    };
  } catch (error) {
    console.error("Failed to load auth brand stats:", error);
    return {
      progressPct: 0,
      termLabel: formatSemesterLabel("FIRST"),
      subjectCount: 0,
      readyLabel: "No subjects offered for 1st Semester yet",
      subjects: [],
    };
  }
}
