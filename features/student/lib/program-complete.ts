import { isEvaluationApproved } from '@/lib/evaluation';
import { SEMESTER_TERMS } from '@/lib/semester-terms';
import { compareTerms } from '@/lib/subject-retake-helpers';
import type { EvaluationStatus, SemesterTerm } from '@/app/generated/prisma/enums';

export function isCurriculumProgramComplete({
  maxYearLevel,
  yearLevel,
  semester,
  subjects,
  grades,
  evaluations,
}: {
  maxYearLevel: number;
  yearLevel: number;
  semester: string;
  subjects: { id: string }[];
  grades: Record<string, { status?: string | null }>;
  evaluations: { yearLevel: number; semester: string; status: EvaluationStatus }[];
}): boolean {
  if (maxYearLevel < 1 || subjects.length === 0) {
    return false;
  }

  const lastSemester = SEMESTER_TERMS[SEMESTER_TERMS.length - 1];
  const reachedProgramEnd =
    yearLevel > maxYearLevel || (yearLevel === maxYearLevel && semester === lastSemester);
  if (!reachedProgramEnd) {
    return false;
  }

  const allSubjectsPassed = subjects.every(
    (subject) => grades[subject.id]?.status === 'PASSED'
  );
  if (!allSubjectsPassed) {
    return false;
  }

  const current = {
    yearLevel,
    semester: semester as SemesterTerm,
  };
  const approvedKeys = new Set(
    evaluations
      .filter((evaluation) => isEvaluationApproved(evaluation.status))
      .map((evaluation) => `${evaluation.yearLevel}-${evaluation.semester}`)
  );

  for (let year = 1; year <= yearLevel; year += 1) {
    for (const term of SEMESTER_TERMS) {
      const termRef = { yearLevel: year, semester: term };
      if (compareTerms(termRef, current) > 0) {
        continue;
      }
      if (!approvedKeys.has(`${year}-${term}`)) {
        return false;
      }
    }
  }

  return true;
}
