import { auth } from '@/auth';
import { evaluateStudent } from '@/actions/curriculum';
import { db } from '@/lib/db';
import { resolveEvaluationDisplay, isEvaluationApproved } from '@/lib/evaluation';
import { getTermEvaluationRecord } from '@/lib/evaluation-service';
import { getGradePassSettings } from '@/lib/grade-settings';
import { getMaxYearLevel } from '@/lib/student-progression';

import { listConfirmedRetakeOfferings } from '@/lib/subject-retakes';
import { compareTerms, formatTermRef, isMakeupStanding } from '@/lib/subject-retake-helpers';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

import { detectPriorTermGaps } from './detect-prior-term-gaps';
import { isCurriculumProgramComplete } from './program-complete';
import type {
  CurriculumItem,
  EvaluationSubject,
  ExistingGrade,
  StudentPortalData,
  StudentPortalError,
} from './types';

function scheduleKindFromStatus(
  status: ExistingGrade['status'] | undefined
): NonNullable<CurriculumItem['scheduleKind']> {
  if (status === 'FAILED' || status === 'INCOMPLETE') {
    return status;
  }
  return 'PENDING';
}

type EvaluationResult =
  | { error: string }
  | {
      eligible: EvaluationSubject[];
      blocked: EvaluationSubject[];
      passed: EvaluationSubject[];
      nextEnrollmentTerm?: { yearLevel: number; semester: string } | null;
    };

export async function getStudentPortalData(): Promise<
  StudentPortalData | StudentPortalError
> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const student = await db.student.findFirst({
    where: { userId: session.user.id },
    include: {
      grades: true,
      curriculumRef: true,
      user: { select: { email: true } },
    },
  });

  if (!student) {
    return { type: 'no-student' };
  }

  const curriculumId = student.curriculumId || student.curriculumRef?.id;

  if (!curriculumId) {
    return { type: 'no-curriculum' };
  }

  const activeSemester = student.currentSemester;
  const termKey = {
    studentId: student.id,
    curriculumId,
    yearLevel: student.yearLevel,
    semester: activeSemester,
  };

  const gradePassSettings = await getGradePassSettings();
  const maxYearLevel = await getMaxYearLevel(curriculumId);
  const makeupStanding = isMakeupStanding(student.yearLevel, maxYearLevel);
  const curriculumYearCeiling = makeupStanding ? maxYearLevel : student.yearLevel;

  const allCurriculumSubjects = await db.curriculumSubject.findMany({
    where: {
      curriculumId,
      yearLevel: { lte: curriculumYearCeiling },
    },
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
    orderBy: [{ semester: 'asc' }, { displayOrder: 'asc' }],
  });

  const activeSemesterOfferings = await db.curriculumSubject.findMany({
    where: {
      curriculumId,
      yearLevel: student.yearLevel,
      semester: activeSemester,
    },
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
    orderBy: [{ semester: 'asc' }, { displayOrder: 'asc' }],
  });

  const [evaluation, storedEvaluation, termEvaluations, confirmedRetakes] = await Promise.all([
    evaluateStudent({
      studentId: student.id,
      curriculumId,
      yearLevel: student.yearLevel,
      semester: activeSemester,
    }) as Promise<EvaluationResult>,
    getTermEvaluationRecord(termKey),
    db.evaluationResult.findMany({
      where: { studentId: student.id, curriculumId },
      select: { yearLevel: true, semester: true, status: true },
    }),
    listConfirmedRetakeOfferings(student.id, student.yearLevel, activeSemester),
  ]);

  const currentTermLabel = formatTermRef(
    { yearLevel: student.yearLevel, semester: activeSemester },
    maxYearLevel
  );
  const nextEnrollmentLabel =
    !('error' in evaluation) && evaluation.nextEnrollmentTerm
      ? formatTermRef(
          {
            yearLevel: evaluation.nextEnrollmentTerm.yearLevel,
            semester: evaluation.nextEnrollmentTerm.semester as SemesterTerm,
          },
          maxYearLevel
        )
      : null;

  const liveEvaluation =
    'error' in evaluation
      ? { passed: [], eligible: [], blocked: [] }
      : {
          passed: evaluation.passed,
          eligible: evaluation.eligible,
          blocked: evaluation.blocked,
        };

  const displayEvaluation = resolveEvaluationDisplay(storedEvaluation, liveEvaluation);

  const termEvaluationLists = {
    passed: displayEvaluation.passed,
    eligible: displayEvaluation.eligible,
    blocked: displayEvaluation.blocked,
  };

  const mapCurriculumItem = (item: (typeof allCurriculumSubjects)[number]): CurriculumItem => ({
    id: item.id,
    code: item.subject.code,
    description: item.subject.description,
    units: item.subject.units,
    yearLevel: item.yearLevel,
    semester: item.semester,
    displayOrder: item.displayOrder,
  });

  const curriculumData = allCurriculumSubjects.map(mapCurriculumItem);
  const activeOfferingData = activeSemesterOfferings.map(mapCurriculumItem);
  const currentTermOfferingIds = new Set(activeOfferingData.map((item) => item.id));

  const existingGrades: Record<string, ExistingGrade> = {};
  for (const grade of student.grades) {
    existingGrades[grade.curriculumSubjectId] = {
      grade: grade.grade ? String(grade.grade) : null,
      status: grade.status,
    };
  }

  const retakeOfferingData: CurriculumItem[] = confirmedRetakes
    .filter((item) => !currentTermOfferingIds.has(item.id))
    .map((item) => {
      const status = existingGrades[item.id]?.status;
      const scheduleKind = scheduleKindFromStatus(status);

      return {
        id: item.id,
        code: item.code,
        description: item.description,
        units: item.units,
        yearLevel: item.yearLevel,
        semester: item.semester,
        displayOrder: item.displayOrder,
        isRetake: true,
        scheduleKind,
        previousGrade: item.originalGrade ?? existingGrades[item.id]?.grade ?? null,
      };
    });

  const currentTerm = {
    yearLevel: student.yearLevel,
    semester: activeSemester,
  };

  const currentTermClosed = isEvaluationApproved(storedEvaluation?.status);

  const deferredSubjects = curriculumData
    .filter((item) => {
      const status = existingGrades[item.id]?.status;
      if (status === 'PASSED') {
        return false;
      }

      if (status === 'FAILED') {
        return true;
      }

      const originalTerm = {
        yearLevel: item.yearLevel,
        semester: item.semester as SemesterTerm,
      };
      const isPrior = compareTerms(originalTerm, currentTerm) < 0;
      const fromClosedStanding =
        currentTermClosed && compareTerms(originalTerm, currentTerm) <= 0;

      return (
        (isPrior || fromClosedStanding) &&
        (status === 'INCOMPLETE' || status === 'PENDING' || !status)
      );
    })
    .map((item) => {
      const scheduleKind = scheduleKindFromStatus(existingGrades[item.id]?.status);
      return { ...item, scheduleKind };
    });

  const passed = curriculumData.filter((s) => existingGrades[s.id]?.status === 'PASSED');
  const failed = curriculumData.filter((s) => existingGrades[s.id]?.status === 'FAILED');
  const incomplete = curriculumData.filter(
    (s) => existingGrades[s.id]?.status === 'INCOMPLETE'
  );
  const pending = curriculumData.filter(
    (s) => !existingGrades[s.id] || existingGrades[s.id]?.status === 'PENDING'
  );
  const totalSubjects = curriculumData.length || 1;
  const progressPct = Math.round((passed.length / totalSubjects) * 100);

  const priorTermGaps = detectPriorTermGaps(
    student.yearLevel,
    activeSemester,
    curriculumData,
    existingGrades,
    termEvaluations.map((e) => ({
      yearLevel: e.yearLevel,
      semester: e.semester,
      status: e.status,
    }))
  );

  const isProgramComplete = isCurriculumProgramComplete({
    maxYearLevel,
    yearLevel: student.yearLevel,
    semester: activeSemester,
    subjects: curriculumData,
    grades: existingGrades,
    evaluations: termEvaluations,
  });

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      studentId: student.studentId,
      course: student.course,
      yearLevel: student.yearLevel,
      currentSemester: activeSemester,
      email: student.email || student.user.email || session.user.email || null,
      isMakeupStanding: makeupStanding && !isProgramComplete,
      isProgramComplete,
    },
    curriculumId,
    gradePassSettings,
    activeSemester,
    currentTermLabel,
    nextEnrollmentLabel,
    curriculumData,
    activeOfferingData,
    retakeOfferingData,
    deferredSubjects,
    maxYearLevel,
    isMakeupStanding: makeupStanding,
    isProgramComplete,
    priorTermGaps,
    existingGrades,
    hasSubmittedTermGrades: storedEvaluation !== null,
    displayEvaluation: {
      status: displayEvaluation.status,
      submittedAt: displayEvaluation.submittedAt,
      submittedBy: displayEvaluation.submittedBy,
      completedByName: displayEvaluation.completedByName,
      completedByPosition: displayEvaluation.completedByPosition,
      remarks: displayEvaluation.remarks,
      approvedAt: displayEvaluation.approvedAt,
      approvedByName: displayEvaluation.approvedByName,
      approvedByPosition: displayEvaluation.approvedByPosition,
      approvalRemarks: displayEvaluation.approvalRemarks,
      isStoredResult: displayEvaluation.isStoredResult,
    },
    termEvaluationLists,
    gradeStats: {
      passed,
      failed,
      incomplete,
      pending,
      progressPct,
    },
  };
}
