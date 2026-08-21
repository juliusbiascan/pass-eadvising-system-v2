import { db } from '@/lib/db';
import { SEMESTER_TERMS } from '@/lib/semester-terms';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

export type CompletedTerm = {
  yearLevel: number;
  semester: SemesterTerm;
};

export function getNextSemester(current: SemesterTerm): SemesterTerm | null {
  const index = SEMESTER_TERMS.indexOf(current as (typeof SEMESTER_TERMS)[number]);
  if (index < 0 || index >= SEMESTER_TERMS.length - 1) {
    return null;
  }
  return SEMESTER_TERMS[index + 1];
}

export async function allOfferingsPassed(
  studentId: string,
  curriculumId: string,
  yearLevel: number,
  semester?: SemesterTerm
): Promise<boolean> {
  const offerings = await db.curriculumSubject.findMany({
    where: {
      curriculumId,
      yearLevel,
      ...(semester ? { semester } : {}),
    },
    select: { id: true },
  });

  if (offerings.length === 0) {
    return false;
  }

  const passedCount = await db.studentGrade.count({
    where: {
      studentId,
      curriculumSubjectId: { in: offerings.map((offering) => offering.id) },
      status: 'PASSED',
    },
  });

  return passedCount === offerings.length;
}

async function getMaxYearLevel(curriculumId: string): Promise<number> {
  const result = await db.curriculumSubject.aggregate({
    where: { curriculumId },
    _max: { yearLevel: true },
  });

  return result._max.yearLevel ?? 6;
}

export type EnrollmentTerm = {
  yearLevel: number;
  semester: SemesterTerm;
};

/** Next term the student would enroll in (1st→2nd sem, or 2nd sem→next year 1st). */
export function getNextEnrollmentTerm(
  yearLevel: number,
  semester: SemesterTerm,
  maxYearLevel: number
): EnrollmentTerm | null {
  const nextSemester = getNextSemester(semester);
  if (nextSemester) {
    return { yearLevel, semester: nextSemester };
  }

  if (semester === 'SECOND' && yearLevel < maxYearLevel) {
    return { yearLevel: yearLevel + 1, semester: 'FIRST' };
  }

  return null;
}

export { getMaxYearLevel };

export type ProgressionResult = {
  progressed: boolean;
  message?: string;
  yearLevel: number;
  currentSemester: SemesterTerm;
  yearLevelAdvanced: boolean;
  semesterAdvanced: boolean;
};

/**
 * Advances a student after an admin completes a term evaluation.
 * - If every subject for the year level is PASSED → next year, FIRST semester.
 * - Otherwise → FIRST → SECOND within the same year.
 * - After SECOND → next year FIRST when below the curriculum max year.
 */
export async function applyStudentProgression(
  studentId: string,
  curriculumId: string,
  completedTerm?: CompletedTerm
): Promise<ProgressionResult> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      yearLevel: true,
      currentSemester: true,
      course: true,
    },
  });

  if (!student) {
    return {
      progressed: false,
      yearLevel: 1,
      currentSemester: 'FIRST',
      yearLevelAdvanced: false,
      semesterAdvanced: false,
    };
  }

  let { yearLevel, currentSemester } = student;

  if (
    completedTerm &&
    (yearLevel !== completedTerm.yearLevel || currentSemester !== completedTerm.semester)
  ) {
    return {
      progressed: false,
      yearLevel,
      currentSemester,
      yearLevelAdvanced: false,
      semesterAdvanced: false,
    };
  }

  const maxYearLevel = await getMaxYearLevel(curriculumId);
  const yearComplete = await allOfferingsPassed(studentId, curriculumId, yearLevel);

  if (yearComplete && yearLevel < maxYearLevel) {
    yearLevel += 1;
    currentSemester = 'FIRST';

    await db.student.update({
      where: { id: studentId },
      data: { yearLevel, currentSemester },
    });

    return {
      progressed: true,
      message: `Advanced to ${student.course} Year ${yearLevel} (${currentSemester} semester).`,
      yearLevel,
      currentSemester,
      yearLevelAdvanced: true,
      semesterAdvanced: false,
    };
  }

  const nextSemester = getNextSemester(currentSemester);

  if (nextSemester) {
    currentSemester = nextSemester;

    await db.student.update({
      where: { id: studentId },
      data: { currentSemester },
    });

    return {
      progressed: true,
      message: `Advanced to ${currentSemester} semester for Year ${yearLevel}.`,
      yearLevel,
      currentSemester,
      yearLevelAdvanced: false,
      semesterAdvanced: true,
    };
  }

  if (currentSemester === 'SECOND' && yearLevel < maxYearLevel) {
    yearLevel += 1;
    currentSemester = 'FIRST';

    await db.student.update({
      where: { id: studentId },
      data: { yearLevel, currentSemester },
    });

    return {
      progressed: true,
      message: `Advanced to ${student.course} Year ${yearLevel} (${currentSemester} semester).`,
      yearLevel,
      currentSemester,
      yearLevelAdvanced: true,
      semesterAdvanced: false,
    };
  }

  return {
    progressed: false,
    yearLevel,
    currentSemester,
    yearLevelAdvanced: false,
    semesterAdvanced: false,
  };
}
