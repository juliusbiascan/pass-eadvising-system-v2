/** Two-semester academic year: 1st and 2nd semester only. */
export const SEMESTER_TERMS = ['FIRST', 'SECOND'] as const;

export type SemesterTermValue = (typeof SEMESTER_TERMS)[number];

export const SEMESTER_LABELS: Record<SemesterTermValue, string> = {
  FIRST: '1st Semester',
  SECOND: '2nd Semester',
};

export function formatSemesterLabel(semester: string): string {
  if (semester === 'FIRST' || semester === 'SECOND') {
    return SEMESTER_LABELS[semester];
  }
  return semester;
}

export function isSemesterTerm(value: string): value is SemesterTermValue {
  return value === 'FIRST' || value === 'SECOND';
}
