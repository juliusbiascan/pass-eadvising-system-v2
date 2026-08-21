import { formatSemesterLabel, SEMESTER_TERMS } from '@/lib/semester-terms';

export type GraduationOutlook = {
  maxYearLevel: number;
  programYears: number;
  programSemesters: number;
  currentTermIndex: number;
  remainingSemesters: number;
  remainingYears: number;
  remainingExtraSemesters: number;
  remainingLabel: string;
  graduationTermLabel: string;
  isOnFinalTerm: boolean;
  isComplete: boolean;
};

function termOffset(semester: string): number {
  return semester === 'SECOND' ? 2 : 1;
}

export function getTermIndex(yearLevel: number, semester: string): number {
  return Math.max(1, (Math.max(1, yearLevel) - 1) * SEMESTER_TERMS.length + termOffset(semester));
}

export function formatRemainingDuration(remainingSemesters: number): string {
  if (remainingSemesters <= 0) {
    return 'None';
  }

  if (remainingSemesters === 1) {
    return '1 semester';
  }

  const years = Math.floor(remainingSemesters / SEMESTER_TERMS.length);
  const leftover = remainingSemesters % SEMESTER_TERMS.length;

  if (years === 0) {
    return `${remainingSemesters} semesters`;
  }

  const yearLabel = years === 1 ? '1 year' : `${years} years`;
  if (leftover === 0) {
    return yearLabel;
  }

  return leftover === 1 ? `${yearLabel}, 1 semester` : `${yearLabel}, ${leftover} semesters`;
}

export function buildGraduationOutlook({
  yearLevel,
  semester,
  maxYearLevel,
}: {
  yearLevel: number;
  semester: string;
  maxYearLevel: number;
}): GraduationOutlook {
  const termsPerYear = SEMESTER_TERMS.length;
  const programYears = Math.max(1, maxYearLevel);
  const programSemesters = programYears * termsPerYear;
  const currentTermIndex = Math.min(programSemesters, getTermIndex(yearLevel, semester));
  const remainingSemesters = Math.max(0, programSemesters - currentTermIndex + 1);
  const lastSemester = SEMESTER_TERMS[SEMESTER_TERMS.length - 1];
  const isOnFinalTerm = remainingSemesters === 1;
  const isComplete = remainingSemesters <= 0 || yearLevel > programYears;

  return {
    maxYearLevel: programYears,
    programYears,
    programSemesters,
    currentTermIndex,
    remainingSemesters,
    remainingYears: Math.floor(remainingSemesters / termsPerYear),
    remainingExtraSemesters: remainingSemesters % termsPerYear,
    remainingLabel: formatRemainingDuration(remainingSemesters),
    graduationTermLabel: `Year ${programYears} · ${formatSemesterLabel(lastSemester)}`,
    isOnFinalTerm,
    isComplete,
  };
}
