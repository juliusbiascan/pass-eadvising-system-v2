import { formatSemesterLabel } from '@/lib/semester-terms';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

export type RetakeScheduleValue = 'NEXT_SEMESTER' | 'NEXT_YEAR';
export type RetakeStatusValue = 'CONFIRMED' | 'COMPLETED';

export type TermRef = {
  yearLevel: number;
  semester: SemesterTerm;
};

export type SubjectScheduleReason = 'FAILED' | 'PENDING' | 'INCOMPLETE';

export type FailedSubjectRetakeRow = {
  curriculumSubjectId: string;
  code: string;
  description: string;
  units: number;
  failedYearLevel: number;
  failedSemester: SemesterTerm;
  grade: string | null;
  reason: SubjectScheduleReason;
  retake: {
    status: RetakeStatusValue;
    schedule: RetakeScheduleValue;
    targetYearLevel: number;
    targetSemester: SemesterTerm;
    confirmedAt: string;
  } | null;
};

export function compareTerms(a: TermRef, b: TermRef): number {
  if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
  if (a.semester === b.semester) return 0;
  return a.semester === 'FIRST' ? -1 : 1;
}

export function formatRetakeScheduleLabel(schedule: RetakeScheduleValue): string {
  return schedule === 'NEXT_SEMESTER' ? 'Next semester' : 'Next year';
}

export function formatSubjectScheduleReason(reason: SubjectScheduleReason): string {
  if (reason === 'FAILED') return 'Failed';
  if (reason === 'INCOMPLETE') return 'Incomplete';
  return 'Pending';
}

export function isPriorTerm(term: TermRef, current: TermRef): boolean {
  return compareTerms(term, current) < 0;
}

export function isMakeupStanding(yearLevel: number, maxYearLevel: number): boolean {
  return yearLevel > maxYearLevel;
}

/** Next term with no curriculum ceiling — used to open a makeup term after the last approved year. */
export function nextTermUnbounded(yearLevel: number, semester: SemesterTerm): TermRef {
  if (semester === 'FIRST') {
    return { yearLevel, semester: 'SECOND' };
  }

  return { yearLevel: yearLevel + 1, semester: 'FIRST' };
}

export function formatTermRef(term: TermRef, maxYearLevel?: number): string {
  const base = `${formatYearLevelLabel(term.yearLevel)} • ${formatSemesterLabel(term.semester)}`;
  if (maxYearLevel != null && term.yearLevel > maxYearLevel) {
    return `Makeup term (${base})`;
  }
  return base;
}

function nextTermAfter(
  yearLevel: number,
  semester: SemesterTerm,
  maxYearLevel: number
): TermRef | null {
  if (semester === 'FIRST') {
    return { yearLevel, semester: 'SECOND' };
  }

  if (semester === 'SECOND' && yearLevel < maxYearLevel) {
    return { yearLevel: yearLevel + 1, semester: 'FIRST' };
  }

  return null;
}

/**
 * When the student may retake a failed subject.
 * Next semester follows the failed term (or the current term if that date has passed).
 * Next year is the same semester in the following year level.
 * When the current term is already approved, leftover work is placed on a makeup term
 * after the last curriculum term instead of the locked current term.
 */
export function resolveRetakeTargetTerm(options: {
  schedule: RetakeScheduleValue;
  failedYearLevel: number;
  failedSemester: SemesterTerm;
  studentYearLevel: number;
  studentSemester: SemesterTerm;
  maxYearLevel: number;
  currentTermClosed?: boolean;
}): TermRef | null {
  const {
    schedule,
    failedYearLevel,
    failedSemester,
    studentYearLevel,
    studentSemester,
    maxYearLevel,
    currentTermClosed = false,
  } = options;
  const current: TermRef = { yearLevel: studentYearLevel, semester: studentSemester };
  const ceiling = Math.max(maxYearLevel, studentYearLevel, failedYearLevel) + 2;

  let target: TermRef;

  if (schedule === 'NEXT_SEMESTER') {
    const afterFailed = nextTermAfter(failedYearLevel, failedSemester, ceiling);
    if (!afterFailed) {
      target = current;
    } else if (compareTerms(afterFailed, current) >= 0) {
      target = afterFailed;
    } else {
      target = current;
    }
  } else {
    target = { yearLevel: failedYearLevel + 1, semester: failedSemester };
    if (compareTerms(target, current) < 0) {
      target = { yearLevel: studentYearLevel + 1, semester: failedSemester };
      if (compareTerms(target, current) < 0) {
        target = { yearLevel: studentYearLevel + 1, semester: studentSemester };
      }
    }
  }

  if (currentTermClosed && compareTerms(target, current) <= 0) {
    return nextTermUnbounded(current.yearLevel, current.semester);
  }

  return target;
}
