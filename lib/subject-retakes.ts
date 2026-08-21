import 'server-only';

import { db } from '@/lib/db';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

import {
  isPriorTerm,
  type FailedSubjectRetakeRow,
  type RetakeScheduleValue,
  type SubjectScheduleReason,
} from './subject-retake-helpers';

export type {
  FailedSubjectRetakeRow,
  RetakeScheduleValue,
  RetakeStatusValue,
  SubjectScheduleReason,
  TermRef,
} from './subject-retake-helpers';
export {
  compareTerms,
  formatRetakeScheduleLabel,
  formatSubjectScheduleReason,
  formatTermRef,
  isPriorTerm,
  resolveRetakeTargetTerm,
} from './subject-retake-helpers';

export type RetakeOffering = {
  id: string;
  subjectId: string;
  code: string;
  description: string;
  units: number;
  yearLevel: number;
  semester: SemesterTerm;
  displayOrder: number;
  originalGrade: string | null;
  schedule: RetakeScheduleValue;
  minYearStanding: number | null;
  minCurriculumUnitsPercent: number | null;
  prerequisiteNote: string | null;
};

export async function listConfirmedRetakeOfferings(
  studentId: string,
  yearLevel: number,
  semester: SemesterTerm
): Promise<RetakeOffering[]> {
  const retakes = await db.subjectRetake.findMany({
    where: {
      studentId,
      status: 'CONFIRMED',
      targetYearLevel: yearLevel,
      targetSemester: semester,
    },
    include: {
      curriculumSubject: {
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              description: true,
              units: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return retakes.map((retake) => ({
    id: retake.curriculumSubject.id,
    subjectId: retake.curriculumSubject.subject.id,
    code: retake.curriculumSubject.subject.code,
    description: retake.curriculumSubject.subject.description,
    units: retake.curriculumSubject.subject.units,
    yearLevel: retake.curriculumSubject.yearLevel,
    semester: retake.curriculumSubject.semester,
    displayOrder: retake.curriculumSubject.displayOrder,
    originalGrade: retake.originalGrade ? String(retake.originalGrade) : null,
    schedule: retake.schedule,
    minYearStanding: retake.curriculumSubject.minYearStanding,
    minCurriculumUnitsPercent: retake.curriculumSubject.minCurriculumUnitsPercent,
    prerequisiteNote: retake.curriculumSubject.prerequisiteNote,
  }));
}

export async function listFailedSubjectsForRetake(
  studentId: string
): Promise<FailedSubjectRetakeRow[]> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      curriculumId: true,
      yearLevel: true,
      currentSemester: true,
    },
  });

  if (!student?.curriculumId) {
    return [];
  }

  const current = {
    yearLevel: student.yearLevel,
    semester: student.currentSemester,
  };

  const [offerings, grades, retakes] = await Promise.all([
    db.curriculumSubject.findMany({
      where: { curriculumId: student.curriculumId },
      include: {
        subject: {
          select: { code: true, description: true, units: true },
        },
      },
      orderBy: [
        { yearLevel: 'asc' },
        { semester: 'asc' },
        { displayOrder: 'asc' },
      ],
    }),
    db.studentGrade.findMany({
      where: {
        studentId,
        curriculumSubject: { curriculumId: student.curriculumId },
      },
      select: {
        curriculumSubjectId: true,
        grade: true,
        status: true,
      },
    }),
    db.subjectRetake.findMany({
      where: { studentId },
    }),
  ]);

  const gradeByOffering = new Map(
    grades.map((grade) => [grade.curriculumSubjectId, grade])
  );
  const retakeBySubject = new Map(
    retakes.map((retake) => [retake.curriculumSubjectId, retake])
  );

  const rows: FailedSubjectRetakeRow[] = [];

  for (const offering of offerings) {
    const grade = gradeByOffering.get(offering.id);
    const status = grade?.status ?? 'PENDING';
    if (status === 'PASSED') {
      continue;
    }

    const originalTerm = {
      yearLevel: offering.yearLevel,
      semester: offering.semester,
    };
    const isPrior = isPriorTerm(originalTerm, current);
    const reason: SubjectScheduleReason | null =
      status === 'FAILED'
        ? 'FAILED'
        : isPrior && (status === 'INCOMPLETE' || status === 'PENDING')
          ? status
          : null;

    if (!reason) {
      continue;
    }

    const retake = retakeBySubject.get(offering.id);

    rows.push({
      curriculumSubjectId: offering.id,
      code: offering.subject.code,
      description: offering.subject.description,
      units: offering.subject.units,
      failedYearLevel: offering.yearLevel,
      failedSemester: offering.semester,
      grade: grade?.grade ? String(grade.grade) : null,
      reason,
      retake: retake
        ? {
            status: retake.status,
            schedule: retake.schedule,
            targetYearLevel: retake.targetYearLevel,
            targetSemester: retake.targetSemester,
            confirmedAt: retake.confirmedAt.toISOString(),
          }
        : null,
    });
  }

  return rows;
}
