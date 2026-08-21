import { formatSemesterLabel } from '@/lib/semester-terms';
import type { EvaluationStatus, SemesterTerm } from '@/app/generated/prisma/enums';
import { compareTerms } from '@/lib/subject-retake-helpers';

import type { CurriculumItem, ExistingGrade, PriorTermGap } from './types';

type TermEvaluation = {
  yearLevel: number;
  semester: SemesterTerm;
  status: EvaluationStatus;
};

function isSubjectComplete(
  subjectId: string,
  existingGrades: Record<string, ExistingGrade>
): boolean {
  return existingGrades[subjectId]?.status === 'PASSED';
}

/**
 * Finds earlier terms (prior year, or 1st semester of the current year when the
 * student is already in 2nd semester) that still lack passed grades or a completed
 * evaluation. Typical after a mid-year shift.
 */
export function detectPriorTermGaps(
  studentYearLevel: number,
  studentSemester: SemesterTerm,
  curriculumItems: CurriculumItem[],
  existingGrades: Record<string, ExistingGrade>,
  evaluations: TermEvaluation[] = []
): { hasGap: boolean; gaps: PriorTermGap[] } {
  const current = { yearLevel: studentYearLevel, semester: studentSemester };

  const evaluationByTerm = new Map(
    evaluations.map((e) => [`${e.yearLevel}-${e.semester}`, e.status])
  );

  const priorItems = curriculumItems.filter((item) =>
    compareTerms(
      { yearLevel: item.yearLevel, semester: item.semester as SemesterTerm },
      current
    ) < 0
  );
  const groupMap = new Map<string, CurriculumItem[]>();

  for (const item of priorItems) {
    const key = `${item.yearLevel}-${item.semester}`;
    const group = groupMap.get(key) ?? [];
    group.push(item);
    groupMap.set(key, group);
  }

  const gaps: PriorTermGap[] = [];

  for (const [key, subjects] of groupMap) {
    const missingGrades = subjects.filter(
      (s) => !isSubjectComplete(s.id, existingGrades)
    ).length;

    const evaluationStatus = evaluationByTerm.get(key) ?? null;
    const needsAttention =
      missingGrades > 0 || evaluationStatus !== 'COMPLETED';

    if (!needsAttention) continue;

    const { yearLevel, semester } = subjects[0];
    gaps.push({
      key,
      label: `Year ${yearLevel} • ${formatSemesterLabel(semester as SemesterTerm)}`,
      yearLevel,
      semester: semester,
      missingGrades,
      totalSubjects: subjects.length,
      evaluationStatus,
    });
  }

  gaps.sort((a, b) => a.yearLevel - b.yearLevel || a.semester.localeCompare(b.semester));

  return { hasGap: gaps.length > 0, gaps };
}
