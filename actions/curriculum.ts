"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  AddSubjectPrerequisiteSchema,
  AssignCurriculumToStudentSchema,
  AssignSubjectToCurriculumSchema,
  CreateCurriculumSubjectSchema,
  CreateCurriculumSchema,
  CreateSubjectSchema,
  ImportCurriculumSheetsPayloadSchema,
  UpdateCurriculumSchema,
  UpdateCurriculumSubjectOfferingSchema,
  UpdateSubjectSchema,
} from "@/schemas";
import {
  buildPrerequisiteNote,
  meetsYearStanding,
} from "@/lib/curriculum-prerequisites";
import {
  applyStudentCurriculumShift,
  studentCurriculumFields,
} from "@/lib/student-curriculum";
import {
  detectCurriculumVersionTag,
  detectProgramCodeFromSheet,
  parseCurriculumExcelSheets,
  resolveSubjectCodeInCatalog,
  type ParsedCurriculumExcel,
} from "@/lib/curriculum-excel";
import { ApproveEvaluationSchema, EvaluateStudentSchema, SaveStudentGradesSchema, SubmitEvaluationSchema } from '@/schemas';
import { applyStudentProgression, getMaxYearLevel, getNextEnrollmentTerm } from '@/lib/student-progression';
import { listConfirmedRetakeOfferings } from '@/lib/subject-retakes';
import { Prisma } from '@/app/generated/prisma/client';
import { deriveStatusFromGrade, parseNumericGrade } from '@/lib/grade-evaluation';
import { canApproveTerm, canEvaluateTerm, requireStudentRecordAccess } from '@/lib/staff-access';
import {
  getTermEvaluationRecord,
  getPassedSubjectIdsForCurriculum,
  markTermEvaluationPending,
  saveTermEvaluationApproved,
  saveTermEvaluationEvaluated,
} from '@/lib/evaluation-service';
import {
  formatCompletedByPosition,
  isEvaluationApproved,
  parseDateInputValue,
} from '@/lib/evaluation';
import { getGradePassSettings } from '@/lib/grade-settings';
import { findCourseByCode, listCourses } from '@/lib/courses';
import type { GradeStatus } from '@/app/generated/prisma/enums';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

type OfferingWithSubject = {
  id: string;
  subjectId: string;
  minYearStanding?: number | null;
  minCurriculumUnitsPercent?: number | null;
  prerequisiteNote?: string | null;
  subject: { id: string; code: string; description: string; units: number };
};

function classifyTermOfferings(
  offerings: OfferingWithSubject[],
  passedSubjects: Set<string>,
  prereqMap: Map<string, string[]>,
  mode: 'current-passed' | 'next-enrollment',
  studentYearLevel?: number,
  curriculumUnitsPercent?: number
) {
  const passed: { id: string; code: string; description: string }[] = [];
  const eligible: { id: string; code: string; description: string; percent?: number; missing?: string[] }[] = [];
  const blocked: { id: string; code: string; description: string; percent: number; missing: string[] }[] = [];

  for (const offering of offerings) {
    const subjectId = offering.subject.id;
    const alreadyPassed = passedSubjects.has(subjectId);

    if (mode === 'current-passed') {
      if (alreadyPassed) {
        passed.push({
          id: offering.id,
          code: offering.subject.code,
          description: offering.subject.description,
        });
      }
      continue;
    }

    if (alreadyPassed) {
      continue;
    }

    const prereqs = prereqMap.get(subjectId) || [];
    const standingMet = meetsYearStanding(
      studentYearLevel ?? 0,
      offering.minYearStanding
    );
    const standingMissing =
      offering.minYearStanding != null && !standingMet
        ? [offering.prerequisiteNote || `${offering.minYearStanding}rd Year Standing`]
        : [];

    const unitsThreshold = offering.minCurriculumUnitsPercent;
    const unitsMet =
      unitsThreshold == null ||
      (curriculumUnitsPercent ?? 0) >= unitsThreshold;
    const unitsMissing =
      unitsThreshold != null && !unitsMet
        ? [
            offering.prerequisiteNote ||
              `${unitsThreshold}% Curriculum units`,
          ]
        : [];

    const subjectMissing = prereqs.filter(
      (prerequisiteId) => !passedSubjects.has(prerequisiteId)
    );
    const missing = [...subjectMissing, ...standingMissing, ...unitsMissing];
    const totalRequirements =
      prereqs.length +
      (offering.minYearStanding != null ? 1 : 0) +
      (unitsThreshold != null ? 1 : 0);

    if (totalRequirements === 0 && missing.length === 0) {
      eligible.push({
        id: offering.id,
        code: offering.subject.code,
        description: offering.subject.description,
        missing: [],
      });
      continue;
    }

    const satisfiedCount =
      prereqs.length -
      subjectMissing.length +
      (offering.minYearStanding != null && standingMet ? 1 : 0) +
      (unitsThreshold != null && unitsMet ? 1 : 0);
    const percent = Math.round((satisfiedCount / totalRequirements) * 100);

    if (missing.length === 0) {
      eligible.push({
        id: offering.id,
        code: offering.subject.code,
        description: offering.subject.description,
        percent,
      });
    } else {
      blocked.push({
        id: offering.id,
        code: offering.subject.code,
        description: offering.subject.description,
        percent,
        missing,
      });
    }
  }

  return { passed, eligible, blocked };
}

const offeringInclude = {
  subject: { select: { id: true, code: true, description: true, units: true } },
} as const;

function mergeOfferings(
  base: OfferingWithSubject[],
  extra: OfferingWithSubject[]
): OfferingWithSubject[] {
  const seen = new Set(base.map((offering) => offering.id));
  return [...base, ...extra.filter((offering) => !seen.has(offering.id))];
}

function toOfferingWithSubject(
  item: Awaited<ReturnType<typeof listConfirmedRetakeOfferings>>[number]
): OfferingWithSubject {
  return {
    id: item.id,
    subjectId: item.subjectId,
    minYearStanding: item.minYearStanding,
    minCurriculumUnitsPercent: item.minCurriculumUnitsPercent,
    prerequisiteNote: item.prerequisiteNote,
    subject: {
      id: item.subjectId,
      code: item.code,
      description: item.description,
      units: item.units,
    },
  };
}

const ensureAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return false;
  }
  return true;
};

const resolveCourseByProgramCode = async (programCode: string) => {
  const course = await findCourseByCode(programCode);
  if (!course) {
    return {
      error: `Course ${programCode} was not found. Add it under Dashboard → Courses first.`,
    };
  }
  return { course };
};

export const updateCurriculum = async (
  values: z.infer<typeof UpdateCurriculumSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateCurriculumSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid curriculum fields" };
  }

  const { id, ...rest } = validated.data;
  const programCode = rest.programCode.trim().toUpperCase();
  const resolved = await resolveCourseByProgramCode(programCode);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const payload = {
    courseId: resolved.course.id,
    programCode,
    title: rest.title.trim(),
    batchLabel: rest.batchLabel.trim(),
    batchYear: rest.batchYear,
    versionTag: rest.versionTag,
    isActive: rest.isActive,
    notes: rest.notes?.trim() || null,
  };

  const existing = await db.curriculum.findUnique({
    where: { id },
    select: { programCode: true, batchLabel: true, versionTag: true },
  });

  if (!existing) {
    return { error: "Curriculum not found" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.curriculum.update({ where: { id }, data: payload });

      const label = `${payload.programCode} - ${payload.batchLabel} (${payload.versionTag})`;
      await tx.student.updateMany({
        where: { curriculumId: id },
        data: { curriculum: label },
      });
    });

    revalidatePath("/dashboard/curriculum");
    revalidatePath(`/dashboard/curriculum/${id}/edit`);
    revalidatePath("/dashboard/students");
    return { success: "Curriculum updated" };
  } catch (error) {
    console.error("Update curriculum error:", error);
    return { error: "Curriculum for this program and batch already exists" };
  }
};

export type CurriculumImportSheetPreview = {
  sheetName: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  subjectsCount: number;
  offeringsCount: number;
  suggestedProgramCode: string | null;
  suggestedVersionTag: "OLD" | "NEW";
  versionReason: string;
  parseError?: string;
};

export type ExistingCurriculumSummary = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: "OLD" | "NEW";
  subjectsCount: number;
};

export type CurriculumImportSheetResult = {
  sheetName: string;
  programCode: string;
  success?: string;
  error?: string;
  curriculumId?: string;
};

const IMPORT_TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 } as const;
const UPSERT_BATCH_SIZE = 25;

function formatImportedSheetMessage(result: {
  subjectsCount: number;
  offeringsCount: number;
  prerequisitesCount: number;
  standingCount: number;
  curriculumUnitsRuleCount: number;
  unresolvedPrereqs: string[];
  demotedCount: number;
}) {
  const unresolvedNote =
    result.unresolvedPrereqs.length > 0
      ? ` ${result.unresolvedPrereqs.length} prerequisite(s) could not be matched to a subject code in the file.`
      : "";
  const demotedNote =
    result.demotedCount > 0
      ? ` Marked ${result.demotedCount} older curriculum${result.demotedCount === 1 ? "" : "a"} as Old.`
      : "";

  return `Imported ${result.subjectsCount} subjects (${result.offeringsCount} offerings, ${result.prerequisitesCount} subject prerequisites, ${result.standingCount} year-standing rules, ${result.curriculumUnitsRuleCount} curriculum-units rules).${unresolvedNote}${demotedNote}`;
}

async function importParsedCurriculum(
  parsed: ParsedCurriculumExcel,
  options: {
    programCode: string;
    versionTag: "OLD" | "NEW";
    replaceExisting: boolean;
    batchYear: number;
    batchLabel: string;
  }
) {
  const programCode = options.programCode.trim().toUpperCase();
  const resolved = await resolveCourseByProgramCode(programCode);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  if (parsed.subjects.size === 0 || parsed.offerings.length === 0) {
    return { error: "No subjects found in this sheet" };
  }

  const { versionTag, replaceExisting, batchYear, batchLabel } = options;
  const courseId = resolved.course.id;

  const existing = await db.curriculum.findUnique({
    where: {
      programCode_batchYear: {
        programCode,
        batchYear,
      },
    },
    select: { id: true },
  });

  if (existing && !replaceExisting) {
    return {
      error: `Curriculum for ${programCode} (${batchLabel}) already exists. Confirm replace or change the program code / batch year.`,
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      if (existing && replaceExisting) {
        await tx.curriculumSubject.deleteMany({
          where: { curriculumId: existing.id },
        });
      }

      const curriculum = await tx.curriculum.upsert({
        where: {
          programCode_batchYear: {
            programCode,
            batchYear,
          },
        },
        update: {
          courseId,
          title: parsed.title,
          batchLabel,
          versionTag,
          isActive: true,
        },
        create: {
          courseId,
          programCode,
          title: parsed.title,
          batchLabel,
          batchYear,
          versionTag,
          isActive: true,
        },
      });

      const subjectMap = new Map<string, string>();
      const subjectList = [...parsed.subjects.values()];

      for (let i = 0; i < subjectList.length; i += UPSERT_BATCH_SIZE) {
        const batch = subjectList.slice(i, i + UPSERT_BATCH_SIZE);
        const upserted = await Promise.all(
          batch.map((subject) =>
            tx.subject.upsert({
              where: { code: subject.code },
              update: {
                description: subject.description,
                units: subject.units,
              },
              create: {
                code: subject.code,
                description: subject.description,
                units: subject.units,
              },
            })
          )
        );
        batch.forEach((subject, index) => {
          subjectMap.set(subject.code, upserted[index].id);
        });
      }

      const offeringRows = parsed.offerings.flatMap((offering) => {
        const subjectId = subjectMap.get(offering.code);
        if (!subjectId) return [];

        return [
          {
            curriculumId: curriculum.id,
            subjectId,
            yearLevel: offering.yearLevel,
            semester: offering.semester,
            displayOrder: offering.displayOrder,
            prerequisiteNote: buildPrerequisiteNote({
              standing: offering.standing,
              curriculumUnits: offering.curriculumUnits,
            }),
            minYearStanding: offering.standing?.minYearLevel ?? null,
            minCurriculumUnitsPercent:
              offering.curriculumUnits?.minPercent ?? null,
          },
        ];
      });

      if (offeringRows.length > 0) {
        await tx.curriculumSubject.createMany({
          data: offeringRows,
          skipDuplicates: true,
        });
      }

      const catalogCodes = new Set(subjectMap.keys());
      const prereqRows: { subjectId: string; prerequisiteId: string }[] = [];
      const prereqPairs = new Set<string>();
      const unresolvedPrereqs: string[] = [];
      let standingCount = 0;
      let curriculumUnitsRuleCount = 0;

      for (const offering of parsed.offerings) {
        const subjectId = subjectMap.get(offering.code);
        if (!subjectId) continue;

        if (offering.standing) standingCount += 1;
        if (offering.curriculumUnits) curriculumUnitsRuleCount += 1;

        for (const prereqCode of offering.subjectPrerequisiteCodes) {
          const resolvedCode = resolveSubjectCodeInCatalog(
            prereqCode,
            catalogCodes
          );
          const prerequisiteId = resolvedCode
            ? subjectMap.get(resolvedCode)
            : undefined;

          if (!resolvedCode || !prerequisiteId) {
            unresolvedPrereqs.push(`${offering.code} → ${prereqCode}`);
            continue;
          }

          if (prerequisiteId === subjectId) continue;

          const key = `${subjectId}:${prerequisiteId}`;
          if (prereqPairs.has(key)) continue;
          prereqPairs.add(key);
          prereqRows.push({ subjectId, prerequisiteId });
        }
      }

      if (prereqRows.length > 0) {
        await tx.subjectPrerequisite.createMany({
          data: prereqRows,
          skipDuplicates: true,
        });
      }

      let demotedCount = 0;
      if (versionTag === "NEW") {
        const olderNew = await tx.curriculum.findMany({
          where: {
            programCode,
            batchYear: { lt: batchYear },
            versionTag: "NEW",
            id: { not: curriculum.id },
          },
          select: { id: true, batchLabel: true },
        });

        if (olderNew.length > 0) {
          await tx.curriculum.updateMany({
            where: { id: { in: olderNew.map((item) => item.id) } },
            data: { versionTag: "OLD" },
          });

          for (const item of olderNew) {
            await tx.student.updateMany({
              where: { curriculumId: item.id },
              data: {
                curriculum: `${programCode} - ${item.batchLabel} (OLD)`,
              },
            });
          }

          demotedCount = olderNew.length;
        }
      }

      return {
        curriculumId: curriculum.id,
        subjectsCount: parsed.subjects.size,
        offeringsCount: offeringRows.length,
        prerequisitesCount: prereqPairs.size,
        standingCount,
        curriculumUnitsRuleCount,
        unresolvedPrereqs,
        demotedCount,
      };
    }, IMPORT_TX_OPTIONS);

    return {
      success: formatImportedSheetMessage(result),
      curriculumId: result.curriculumId,
      unresolvedPrereqs: result.unresolvedPrereqs,
    };
  } catch (error) {
    console.error("Import curriculum sheet error:", error);
    return { error: "Failed to import this curriculum sheet" };
  }
}

export const previewCurriculumImport = async (formData: FormData) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please upload a valid Excel file (.xlsx)" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedSheets = parseCurriculumExcelSheets(buffer);
    const courses = await listCourses({ activeOnly: true });

    const existing = await db.curriculum.findMany({
      select: {
        id: true,
        programCode: true,
        title: true,
        batchLabel: true,
        batchYear: true,
        versionTag: true,
        _count: { select: { subjects: true } },
      },
    });

    const existingSummaries = existing.map((curriculum) => ({
      id: curriculum.id,
      programCode: curriculum.programCode,
      title: curriculum.title,
      batchLabel: curriculum.batchLabel,
      batchYear: curriculum.batchYear,
      versionTag: curriculum.versionTag,
      subjectsCount: curriculum._count.subjects,
    }));

    const sheetPreviews = parsedSheets.map((sheet) => ({
      sheetName: sheet.sheetName,
      title: sheet.title,
      batchLabel: sheet.batchLabel,
      batchYear: sheet.batchYear,
      subjectsCount: sheet.subjects.size,
      offeringsCount: sheet.offerings.length,
      suggestedProgramCode: detectProgramCodeFromSheet(
        sheet.sheetName,
        sheet.title,
        courses
      ),
      parseError: sheet.error,
    }));

    return {
      sheets: sheetPreviews.map((sheet) => {
        const detected = detectCurriculumVersionTag(
          {
            programCode: sheet.suggestedProgramCode ?? "",
            batchYear: sheet.batchYear,
          },
          [
            ...existingSummaries,
            ...sheetPreviews
              .filter((other) => other.sheetName !== sheet.sheetName)
              .map((other) => ({
                programCode: other.suggestedProgramCode ?? "",
                batchYear: other.batchYear,
              })),
          ]
        );

        return {
          ...sheet,
          suggestedVersionTag: detected.versionTag,
          versionReason: detected.reason,
        };
      }),
      existingCurricula: existingSummaries,
    };
  } catch (error) {
    console.error("Preview curriculum import error:", error);
    return { error: "Failed to read the Excel workbook" };
  }
};

export const importCurriculaFromExcel = async (formData: FormData) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please upload a valid Excel file (.xlsx)" };
  }

  const sheetsRaw = formData.get("sheets");
  if (typeof sheetsRaw !== "string") {
    return { error: "Invalid import options" };
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(sheetsRaw);
  } catch {
    return { error: "Invalid import options" };
  }

  const validated = ImportCurriculumSheetsPayloadSchema.safeParse(parsedPayload);
  if (!validated.success) {
    return { error: "Invalid import options" };
  }

  const decisions = validated.data.sheets.filter((sheet) => sheet.mode !== "skip");
  if (decisions.length === 0) {
    return { error: "Select at least one sheet to import" };
  }

  const seenKeys = new Set<string>();
  for (const decision of decisions) {
    const key = `${decision.programCode.trim().toUpperCase()}:${decision.batchYear}`;
    if (seenKeys.has(key)) {
      return {
        error: `Two sheets are mapped to ${decision.programCode} (${decision.batchYear}). Change one program code or batch year first.`,
      };
    }
    seenKeys.add(key);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedSheets = parseCurriculumExcelSheets(buffer);
    const sheetsByName = new Map(
      parsedSheets.map((sheet) => [sheet.sheetName, sheet])
    );

    const results: CurriculumImportSheetResult[] = [];

    for (const decision of decisions) {
      const parsed = sheetsByName.get(decision.sheetName);
      if (!parsed) {
        results.push({
          sheetName: decision.sheetName,
          programCode: decision.programCode,
          error: "Sheet was not found in the uploaded workbook",
        });
        continue;
      }

      const imported = await importParsedCurriculum(parsed, {
        programCode: decision.programCode,
        versionTag: decision.versionTag,
        replaceExisting: decision.mode === "replace",
        batchYear: decision.batchYear,
        batchLabel: decision.batchLabel,
      });

      results.push({
        sheetName: decision.sheetName,
        programCode: decision.programCode.trim().toUpperCase(),
        ...imported,
      });
    }

    const importedIds = results
      .map((result) => result.curriculumId)
      .filter((id): id is string => Boolean(id));
    const successCount = results.filter((result) => result.success).length;
    const errorCount = results.filter((result) => result.error).length;

    if (importedIds.length > 0) {
      revalidatePath("/dashboard/curriculum");
      revalidatePath("/dashboard/reports");
      revalidatePath("/dashboard/students");
      for (const curriculumId of importedIds) {
        revalidatePath(`/dashboard/curriculum/${curriculumId}/subjects`);
      }
    }

    if (successCount === 0) {
      return {
        error:
          results.find((result) => result.error)?.error ||
          "Failed to import curricula from Excel",
        results,
      };
    }

    const skippedCount = validated.data.sheets.length - decisions.length;
    const skippedNote =
      skippedCount > 0 ? ` ${skippedCount} sheet(s) skipped.` : "";
    const errorNote =
      errorCount > 0 ? ` ${errorCount} sheet(s) failed.` : "";

    return {
      success: `Imported ${successCount} curriculum${successCount === 1 ? "" : "a"}.${skippedNote}${errorNote}`,
      results,
      curriculumId: importedIds.length === 1 ? importedIds[0] : undefined,
    };
  } catch (error) {
    console.error("Import curricula error:", error);
    return { error: "Failed to import curricula from Excel" };
  }
};

export const createCurriculum = async (
  values: z.infer<typeof CreateCurriculumSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = CreateCurriculumSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid curriculum fields" };
  }

  const programCode = validated.data.programCode.trim().toUpperCase();
  const resolved = await resolveCourseByProgramCode(programCode);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const payload = {
    courseId: resolved.course.id,
    programCode,
    title: validated.data.title.trim(),
    batchLabel: validated.data.batchLabel.trim(),
    batchYear: validated.data.batchYear,
    versionTag: validated.data.versionTag,
    isActive: validated.data.isActive,
    notes: validated.data.notes?.trim() || null,
  };

  try {
    await db.curriculum.create({ data: payload });
    revalidatePath("/dashboard/curriculum");
    return { success: "Curriculum version created" };
  } catch (error) {
    console.error("Create curriculum error:", error);
    return { error: "Curriculum for this program and batch already exists" };
  }
};

export const updateSubject = async (values: z.infer<typeof UpdateSubjectSchema>) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateSubjectSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid subject fields" };
  }

  const { id, ...rest } = validated.data;
  const payload = {
    code: rest.code.trim().toUpperCase(),
    description: rest.description.trim(),
    units: rest.units,
  };

  const existing = await db.subject.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Subject not found" };
  }

  const codeConflict = await db.subject.findFirst({
    where: { code: payload.code, NOT: { id } },
    select: { id: true },
  });

  if (codeConflict) {
    return { error: "Subject code already exists" };
  }

  try {
    await db.subject.update({ where: { id }, data: payload });
    revalidatePath("/dashboard/curriculum");
    revalidatePath("/dashboard/curriculum/subjects");
    revalidatePath("/dashboard/reports");
    return { success: "Subject updated" };
  } catch (error) {
    console.error("Update subject error:", error);
    return { error: "Failed to update subject" };
  }
};

export const updateCurriculumSubjectOffering = async (
  values: z.infer<typeof UpdateCurriculumSubjectOfferingSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateCurriculumSubjectOfferingSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid offering fields" };
  }

  const { id, yearLevel, semester, displayOrder } = validated.data;

  const offering = await db.curriculumSubject.findUnique({
    where: { id },
    select: { id: true, curriculumId: true },
  });

  if (!offering) {
    return { error: "Curriculum subject offering not found" };
  }

  try {
    await db.curriculumSubject.update({
      where: { id },
      data: { yearLevel, semester, displayOrder },
    });

    revalidatePath("/dashboard/curriculum");
    revalidatePath(`/dashboard/curriculum/${offering.curriculumId}/subjects`);
    revalidatePath(`/dashboard/curriculum/${offering.curriculumId}/subjects/prerequisites`);
    revalidatePath("/dashboard/reports");
    revalidatePath("/default");

    return { success: "Offering updated" };
  } catch (error) {
    console.error("Update curriculum subject offering error:", error);
    return { error: "Failed to update offering" };
  }
};

export const createSubject = async (
  values: z.infer<typeof CreateSubjectSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = CreateSubjectSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid subject fields" };
  }

  const payload = {
    code: validated.data.code.trim().toUpperCase(),
    description: validated.data.description.trim(),
    units: validated.data.units,
  };

  try {
    await db.subject.create({ data: payload });
    revalidatePath("/dashboard/curriculum");
    return { success: "Subject created" };
  } catch (error) {
    console.error("Create subject error:", error);
    return { error: "Subject code already exists" };
  }
};

export const createCurriculumSubject = async (
  values: z.infer<typeof CreateCurriculumSubjectSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = CreateCurriculumSubjectSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid subject fields" };
  }

  const payload = {
    curriculumId: validated.data.curriculumId,
    code: validated.data.code.trim().toUpperCase(),
    description: validated.data.description.trim(),
    units: validated.data.units,
    yearLevel: validated.data.yearLevel,
    semester: validated.data.semester,
    displayOrder: validated.data.displayOrder,
    prerequisiteIds: [...new Set(validated.data.prerequisiteIds)],
  };

  const existingSubject = await db.subject.findUnique({
    where: { code: payload.code },
    select: { id: true },
  });

  if (existingSubject) {
    return { error: "Subject code already exists. Use assign existing subject flow." };
  }

  try {
    await db.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          code: payload.code,
          description: payload.description,
          units: payload.units,
        },
      });

      await tx.curriculumSubject.create({
        data: {
          curriculumId: payload.curriculumId,
          subjectId: subject.id,
          yearLevel: payload.yearLevel,
          semester: payload.semester,
          displayOrder: payload.displayOrder,
        },
      });

      if (payload.prerequisiteIds.length > 0) {
        await Promise.all(
          payload.prerequisiteIds.map((prerequisiteId) =>
            tx.subjectPrerequisite.create({
              data: {
                subjectId: subject.id,
                prerequisiteId,
              },
            })
          )
        );
      }
    });

    revalidatePath("/dashboard/curriculum");
    return { success: "Subject created and assigned to curriculum" };
  } catch (error) {
    console.error("Create curriculum subject error:", error);
    return { error: "Failed to create subject for curriculum" };
  }
};

export const assignSubjectToCurriculum = async (
  values: z.infer<typeof AssignSubjectToCurriculumSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = AssignSubjectToCurriculumSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid curriculum subject assignment" };
  }

  try {
    await db.curriculumSubject.create({
      data: {
        curriculumId: validated.data.curriculumId,
        subjectId: validated.data.subjectId,
        yearLevel: validated.data.yearLevel,
        semester: validated.data.semester,
        displayOrder: validated.data.displayOrder,
      },
    });

    revalidatePath("/dashboard/curriculum");
    return { success: "Subject assigned to curriculum" };
  } catch (error) {
    console.error("Assign subject to curriculum error:", error);
    return { error: "This subject is already assigned to the selected curriculum" };
  }
};

export const addSubjectPrerequisite = async (
  values: z.infer<typeof AddSubjectPrerequisiteSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = AddSubjectPrerequisiteSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid prerequisite mapping" };
  }

  try {
    await db.subjectPrerequisite.create({
      data: {
        subjectId: validated.data.subjectId,
        prerequisiteId: validated.data.prerequisiteId,
      },
    });

    revalidatePath("/dashboard/curriculum");
    return { success: "Prerequisite linked successfully" };
  } catch (error) {
    console.error("Add prerequisite error:", error);
    return { error: "Prerequisite mapping already exists" };
  }
};

export const removeSubjectPrerequisite = async (id: string) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  if (!id?.trim()) {
    return { error: "Invalid prerequisite link" };
  }

  try {
    await db.subjectPrerequisite.delete({ where: { id } });
    revalidatePath("/dashboard/curriculum");
    return { success: "Prerequisite removed" };
  } catch (error) {
    console.error("Remove prerequisite error:", error);
    return { error: "Failed to remove prerequisite" };
  }
};

export const removeSubjectFromCurriculum = async (curriculumSubjectId: string) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  if (!curriculumSubjectId?.trim()) {
    return { error: "Invalid curriculum subject" };
  }

  const gradeCount = await db.studentGrade.count({
    where: { curriculumSubjectId },
  });

  if (gradeCount > 0) {
    return { error: "Cannot remove subject: grades already exist for this offering" };
  }

  try {
    await db.curriculumSubject.delete({ where: { id: curriculumSubjectId } });
    revalidatePath("/dashboard/curriculum");
    return { success: "Subject removed from curriculum" };
  } catch (error) {
    console.error("Remove subject from curriculum error:", error);
    return { error: "Failed to remove subject from curriculum" };
  }
};

export const assignCurriculumToStudent = async (
  values: z.infer<typeof AssignCurriculumToStudentSchema>
) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = AssignCurriculumToStudentSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid student curriculum assignment" };
  }

  const selectedCurriculum = await db.curriculum.findUnique({
    where: { id: validated.data.curriculumId },
    select: {
      id: true,
      programCode: true,
      batchLabel: true,
      versionTag: true,
    },
  });

  if (!selectedCurriculum) {
    return { error: "Selected curriculum not found" };
  }

  try {
    const existing = await db.student.findUnique({
      where: { id: validated.data.studentId },
      select: {
        id: true,
        course: true,
        curriculum: true,
        curriculumId: true,
      },
    });

    if (!existing) {
      return { error: "Student not found" };
    }

    const didShift = existing.curriculumId !== selectedCurriculum.id;

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: validated.data.studentId },
        data: studentCurriculumFields(selectedCurriculum),
      });

      if (didShift) {
        await applyStudentCurriculumShift(tx, {
          studentId: validated.data.studentId,
          from: {
            curriculumId: existing.curriculumId,
            programCode: existing.course,
            curriculumLabel: existing.curriculum,
          },
          toCurriculum: selectedCurriculum,
        });
      }
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/curriculum");
    revalidatePath(`/dashboard/students/${validated.data.studentId}/evaluate`);
    revalidatePath(`/dashboard/records/${validated.data.studentId}`);

    return {
      success: didShift
        ? "Student shifted to this curriculum"
        : "Curriculum assigned to student",
    };
  } catch (error) {
    console.error("Assign curriculum to student error:", error);
    return { error: "Failed to assign curriculum to student" };
  }
};

export const unassignCurriculumFromStudent = async (studentId: string) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  if (!studentId?.trim()) {
    return { error: "Invalid student" };
  }

  try {
    await db.student.update({
      where: { id: studentId },
      data: {
        curriculumId: null,
        curriculum: "Not Assigned",
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/curriculum");

    return { success: "Curriculum unassigned from student" };
  } catch (error) {
    console.error("Unassign curriculum from student error:", error);
    return { error: "Failed to unassign curriculum from student" };
  }
};

export const saveStudentGrades = async (
  values: z.infer<typeof SaveStudentGradesSchema>
) => {
  const validated = SaveStudentGradesSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid grades payload' };

  const { studentId, grades, yearLevel: saveYearLevel, semester: saveSemester } = validated.data;
  const authz = await requireStudentRecordAccess(studentId);
  if ('error' in authz) return { error: authz.error };

  const isStaff = authz.access === 'staff';

  try {
    const gradePassSettings = await getGradePassSettings();
    const subjectIds = [...new Set(grades.map((g) => g.curriculumSubjectId))];

    const existingRows = subjectIds.length
      ? await db.studentGrade.findMany({
          where: { studentId, curriculumSubjectId: { in: subjectIds } },
          select: { curriculumSubjectId: true, status: true },
        })
      : [];
    const existingBySubject = new Map(
      existingRows.map((row) => [row.curriculumSubjectId, row])
    );

    const upserts: Array<{
      curriculumSubjectId: string;
      status: GradeStatus;
      grade: number | null;
    }> = [];
    const passedSubjectIds: string[] = [];

    for (const g of grades) {
      const existing = existingBySubject.get(g.curriculumSubjectId);
      const numericGrade = parseNumericGrade(g.grade);
      const derivedStatus = deriveStatusFromGrade(g.grade, gradePassSettings);
      let status: GradeStatus;

      if (derivedStatus) {
        status = derivedStatus;
      } else if (isStaff) {
        status = g.status;
      } else {
        status = existing?.status || 'PENDING';
      }

      if (!isStaff && numericGrade === null && existing?.status === 'FAILED') {
        continue;
      }

      upserts.push({
        curriculumSubjectId: g.curriculumSubjectId,
        status,
        grade: numericGrade,
      });

      if (status === 'PASSED') {
        passedSubjectIds.push(g.curriculumSubjectId);
      }
    }

    // Avoid interactive $transaction: Neon pooler + Vercel latency times out the old N+1 loop.
    if (upserts.length > 0) {
      await Promise.all(
        upserts.map((row) =>
          db.studentGrade.upsert({
            where: {
              studentId_curriculumSubjectId: {
                studentId,
                curriculumSubjectId: row.curriculumSubjectId,
              },
            },
            create: {
              studentId,
              curriculumSubjectId: row.curriculumSubjectId,
              status: row.status,
              grade: row.grade,
            },
            update: {
              status: row.status,
              grade: row.grade,
            },
          })
        )
      );
    }

    if (passedSubjectIds.length > 0) {
      await db.subjectRetake.updateMany({
        where: {
          studentId,
          curriculumSubjectId: { in: passedSubjectIds },
          status: 'CONFIRMED',
        },
        data: { status: 'COMPLETED' },
      });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { curriculumId: true, yearLevel: true, currentSemester: true },
    });

    if (student?.curriculumId) {
      await markTermEvaluationPending({
        studentId,
        curriculumId: student.curriculumId,
        yearLevel: saveYearLevel ?? student.yearLevel,
        semester: saveSemester ?? student.currentSemester,
      });
    }

    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/records');
    revalidatePath(`/dashboard/records/${studentId}`);
    revalidatePath('/default');
    return { success: 'Grades saved' };
  } catch (error) {
    console.error('Save student grades error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      return { error: 'Failed to save grades: the database timed out. Please try again.' };
    }
    return { error: 'Failed to save grades' };
  }
};

export const evaluateStudent = async (values: z.infer<typeof EvaluateStudentSchema>) => {
  const validated = EvaluateStudentSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid input' };

  const { studentId, curriculumId: overrideCurriculumId, yearLevel: overrideYearLevel, semester: overrideSemester } = validated.data;

  const authz = await requireStudentRecordAccess(studentId);
  if ('error' in authz) return { error: authz.error };

  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, curriculumId: true, yearLevel: true },
    });
    const studentYearLevel = student?.yearLevel ?? 0;
    if (!student) return { error: 'Student not found' };

    const targetCurriculumId = overrideCurriculumId || student.curriculumId;
    if (!targetCurriculumId) return { error: 'Student or curriculum not found' };

    const maxYearLevel = await getMaxYearLevel(targetCurriculumId);
    const passedSubjects = await getPassedSubjectIdsForCurriculum(studentId, targetCurriculumId);

    const hasCurrentTerm =
      overrideYearLevel !== undefined && overrideSemester !== undefined;

    let currentOfferings: OfferingWithSubject[] = [];
    let nextOfferings: OfferingWithSubject[] = [];
    let nextEnrollmentTerm: { yearLevel: number; semester: SemesterTerm } | null = null;

    if (hasCurrentTerm) {
      currentOfferings = await db.curriculumSubject.findMany({
        where: {
          curriculumId: targetCurriculumId,
          yearLevel: overrideYearLevel,
          semester: overrideSemester,
        },
        include: offeringInclude,
        orderBy: [{ displayOrder: 'asc' }],
      });

      nextEnrollmentTerm = getNextEnrollmentTerm(
        overrideYearLevel!,
        overrideSemester!,
        maxYearLevel
      );

      if (nextEnrollmentTerm) {
        nextOfferings = await db.curriculumSubject.findMany({
          where: {
            curriculumId: targetCurriculumId,
            yearLevel: nextEnrollmentTerm.yearLevel,
            semester: nextEnrollmentTerm.semester,
          },
          include: offeringInclude,
          orderBy: [{ displayOrder: 'asc' }],
        });
      }

      const [currentRetakes, nextRetakes] = await Promise.all([
        listConfirmedRetakeOfferings(studentId, overrideYearLevel!, overrideSemester!),
        nextEnrollmentTerm
          ? listConfirmedRetakeOfferings(
              studentId,
              nextEnrollmentTerm.yearLevel,
              nextEnrollmentTerm.semester
            )
          : Promise.resolve([]),
      ]);

      currentOfferings = mergeOfferings(
        currentOfferings,
        currentRetakes.map(toOfferingWithSubject)
      );
      nextOfferings = mergeOfferings(
        nextOfferings,
        nextRetakes.map(toOfferingWithSubject)
      );
    } else {
      currentOfferings = await db.curriculumSubject.findMany({
        where: { curriculumId: targetCurriculumId },
        include: offeringInclude,
        orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }, { displayOrder: 'asc' }],
      });
      nextOfferings = currentOfferings;
    }

    const subjectIdsForPrereqs = [
      ...new Set([
        ...currentOfferings.map((o) => o.subjectId),
        ...nextOfferings.map((o) => o.subjectId),
      ]),
    ];

    const prerequisites = await db.subjectPrerequisite.findMany({
      where: { subjectId: { in: subjectIdsForPrereqs } },
    });

    const prereqMap = new Map<string, string[]>();
    for (const p of prerequisites) {
      if (!prereqMap.has(p.subjectId)) prereqMap.set(p.subjectId, []);
      prereqMap.get(p.subjectId)!.push(p.prerequisiteId);
    }

    const allCurriculumOfferings = await db.curriculumSubject.findMany({
      where: { curriculumId: targetCurriculumId },
      include: { subject: { select: { id: true, units: true } } },
    });
    const totalCurriculumUnits = allCurriculumOfferings.reduce(
      (sum, offering) => sum + offering.subject.units,
      0
    );
    const passedCurriculumUnits = allCurriculumOfferings
      .filter((offering) => passedSubjects.has(offering.subjectId))
      .reduce((sum, offering) => sum + offering.subject.units, 0);
    const curriculumUnitsPercent =
      totalCurriculumUnits > 0
        ? Math.round((passedCurriculumUnits / totalCurriculumUnits) * 100)
        : 100;

    const currentResult = classifyTermOfferings(
      hasCurrentTerm ? currentOfferings : [],
      passedSubjects,
      prereqMap,
      'current-passed',
      studentYearLevel,
      curriculumUnitsPercent
    );

    const nextResult = classifyTermOfferings(
      nextOfferings,
      passedSubjects,
      prereqMap,
      'next-enrollment',
      studentYearLevel,
      curriculumUnitsPercent
    );

    const passed = hasCurrentTerm
      ? currentResult.passed
      : classifyTermOfferings(
          currentOfferings,
          passedSubjects,
          prereqMap,
          'current-passed',
          studentYearLevel,
          curriculumUnitsPercent
        ).passed;

    return {
      passed,
      eligible: nextResult.eligible,
      blocked: nextResult.blocked,
      nextEnrollmentTerm: hasCurrentTerm ? nextEnrollmentTerm : null,
    };
  } catch (error) {
    console.error('Evaluate student error:', error);
    return { error: 'Failed to evaluate student' };
  }
};

export const submitStudentEvaluation = async (
  values: z.infer<typeof SubmitEvaluationSchema>
) => {
  const validated = SubmitEvaluationSchema.safeParse(values);
  if (!validated.success) {
    const firstIssue = validated.error.issues[0];
    return { error: firstIssue?.message || 'Invalid input' };
  }

  const authz = await requireStudentRecordAccess(validated.data.studentId);
  if ('error' in authz || authz.access !== 'staff') {
    return { error: 'Only department heads can complete evaluations' };
  }

  if (!canEvaluateTerm(authz.session.user.role)) {
    return { error: 'Only department heads can complete evaluations' };
  }

  const evaluatedAt = parseDateInputValue(validated.data.actionDate);
  if (!evaluatedAt) {
    return { error: 'Select a valid evaluation date' };
  }

  const student = authz.student;
  if (!student.curriculumId) {
    return { error: 'Student has no curriculum assigned' };
  }

  const curriculumId = validated.data.curriculumId || student.curriculumId;
  const course = await findCourseByCode(student.course);
  const completedByPosition = formatCompletedByPosition('HEAD', course);

  const termKey = {
    studentId: validated.data.studentId,
    curriculumId,
    yearLevel: student.yearLevel,
    semester: validated.data.semester ?? student.currentSemester,
  };

  const existing = await getTermEvaluationRecord(termKey);
  if (isEvaluationApproved(existing?.status)) {
    return {
      error:
        'This term is already approved. Save grades again if you need to reopen evaluation.',
    };
  }

  const evaluation = await evaluateStudent({
    studentId: validated.data.studentId,
    curriculumId,
    yearLevel: student.yearLevel,
    semester: termKey.semester,
  });
  if ('error' in evaluation) {
    return { error: evaluation.error };
  }

  const remarks = validated.data.remarks?.trim() || undefined;

  try {
    await saveTermEvaluationEvaluated(
      termKey,
      evaluation,
      'HEAD',
      {
        completedByName: validated.data.completedByName.trim(),
        completedByPosition,
        remarks,
      },
      evaluatedAt
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/students/${validated.data.studentId}/evaluate`);
    revalidatePath(`/dashboard/records/${validated.data.studentId}`);
    revalidatePath('/default');

    return {
      success: 'Evaluation recorded. Waiting for registrar or admin approval.',
      ...evaluation,
    };
  } catch (error) {
    console.error('Submit evaluation error:', error);
    return { error: 'Failed to submit evaluation' };
  }
};

export const approveStudentEvaluation = async (
  values: z.infer<typeof ApproveEvaluationSchema>
) => {
  const validated = ApproveEvaluationSchema.safeParse(values);
  if (!validated.success) {
    const firstIssue = validated.error.issues[0];
    return { error: firstIssue?.message || 'Invalid input' };
  }

  const authz = await requireStudentRecordAccess(validated.data.studentId);
  if ('error' in authz || authz.access !== 'staff') {
    return { error: 'Only the registrar or admin can approve evaluations' };
  }

  if (!canApproveTerm(authz.session.user.role)) {
    return { error: 'Only the registrar or admin can approve evaluations' };
  }

  const approvedAt = parseDateInputValue(validated.data.actionDate);
  if (!approvedAt) {
    return { error: 'Select a valid approval date' };
  }

  const student = authz.student;
  if (!student.curriculumId) {
    return { error: 'Student has no curriculum assigned' };
  }

  const curriculumId = validated.data.curriculumId || student.curriculumId;
  const termKey = {
    studentId: validated.data.studentId,
    curriculumId,
    yearLevel: student.yearLevel,
    semester: validated.data.semester ?? student.currentSemester,
  };

  const existing = await getTermEvaluationRecord(termKey);
  if (!existing || existing.status !== 'EVALUATED') {
    return {
      error: 'The department head must evaluate this term before it can be approved.',
    };
  }

  const remarks = validated.data.remarks?.trim() || undefined;

  try {
    await saveTermEvaluationApproved(
      termKey,
      'ADMIN',
      {
        approvedByName: validated.data.approvedByName.trim(),
        approvedByPosition: formatCompletedByPosition('ADMIN'),
        remarks,
      },
      approvedAt
    );

    const progression = await applyStudentProgression(
      validated.data.studentId,
      curriculumId,
      termKey
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/students/${validated.data.studentId}/evaluate`);
    revalidatePath(`/dashboard/records/${validated.data.studentId}`);
    revalidatePath('/default');

    const baseSuccess = 'Evaluation checked and approved';
    const successMessage =
      progression.progressed && progression.message
        ? `${baseSuccess}. ${progression.message}`
        : baseSuccess;

    return {
      success: successMessage,
      progression,
    };
  } catch (error) {
    console.error('Approve evaluation error:', error);
    return { error: 'Failed to approve evaluation' };
  }
};
