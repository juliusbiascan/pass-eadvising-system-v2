import { db } from '@/lib/db';
import { SEMESTER_TERMS } from '@/lib/semester-terms';
import {
  compareTerms,
  formatTermRef,
  nextTermUnbounded,
  type TermRef,
} from '@/lib/subject-retake-helpers';
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

function standingResult(
  yearLevel: number,
  currentSemester: SemesterTerm,
  extras: Partial<ProgressionResult> = {}
): ProgressionResult {
  return {
    progressed: false,
    yearLevel,
    currentSemester,
    yearLevelAdvanced: false,
    semesterAdvanced: false,
    ...extras,
  };
}

async function unpassedConfirmedRetakeIds(
  studentId: string,
  curriculumSubjectIds: string[]
): Promise<string[]> {
  if (curriculumSubjectIds.length === 0) {
    return [];
  }

  const passed = await db.studentGrade.findMany({
    where: {
      studentId,
      curriculumSubjectId: { in: curriculumSubjectIds },
      status: 'PASSED',
    },
    select: { curriculumSubjectId: true },
  });
  const passedIds = new Set(passed.map((row) => row.curriculumSubjectId));
  return curriculumSubjectIds.filter((id) => !passedIds.has(id));
}

/**
 * After the last curriculum term (or during a makeup standing), move the student onto
 * a makeup term when leftover/failed subjects are already confirmed for a later term,
 * or when confirmed retakes for the just-approved term were never passed.
 */
async function maybeAdvanceToMakeupTerm(options: {
  studentId: string;
  yearLevel: number;
  currentSemester: SemesterTerm;
  maxYearLevel: number;
}): Promise<ProgressionResult> {
  const { studentId, yearLevel, currentSemester, maxYearLevel } = options;
  const current: TermRef = { yearLevel, semester: currentSemester };

  const retakes = await db.subjectRetake.findMany({
    where: { studentId, status: 'CONFIRMED' },
    select: {
      curriculumSubjectId: true,
      targetYearLevel: true,
      targetSemester: true,
    },
  });

  const dueThisTerm = retakes.filter(
    (retake) =>
      retake.targetYearLevel === current.yearLevel &&
      retake.targetSemester === current.semester
  );
  const stillOpenHere = await unpassedConfirmedRetakeIds(
    studentId,
    dueThisTerm.map((retake) => retake.curriculumSubjectId)
  );

  const futureTargets = retakes
    .filter(
      (retake) =>
        compareTerms(
          { yearLevel: retake.targetYearLevel, semester: retake.targetSemester },
          current
        ) > 0
    )
    .sort((a, b) =>
      compareTerms(
        { yearLevel: a.targetYearLevel, semester: a.targetSemester },
        { yearLevel: b.targetYearLevel, semester: b.targetSemester }
      )
    );

  if (stillOpenHere.length === 0 && futureTargets.length === 0) {
    return standingResult(yearLevel, currentSemester);
  }

  const target: TermRef =
    futureTargets.length > 0
      ? {
          yearLevel: futureTargets[0].targetYearLevel,
          semester: futureTargets[0].targetSemester,
        }
      : nextTermUnbounded(current.yearLevel, current.semester);

  if (compareTerms(target, current) <= 0) {
    return standingResult(yearLevel, currentSemester);
  }

  if (stillOpenHere.length > 0) {
    await db.subjectRetake.updateMany({
      where: {
        studentId,
        status: 'CONFIRMED',
        curriculumSubjectId: { in: stillOpenHere },
      },
      data: {
        targetYearLevel: target.yearLevel,
        targetSemester: target.semester,
      },
    });
  }

  await db.student.update({
    where: { id: studentId },
    data: { yearLevel: target.yearLevel, currentSemester: target.semester },
  });

  return {
    progressed: true,
    message: `Opened ${formatTermRef(target, maxYearLevel)} so leftover or failed subjects can be taken.`,
    yearLevel: target.yearLevel,
    currentSemester: target.semester,
    yearLevelAdvanced: target.yearLevel !== yearLevel,
    semesterAdvanced: target.semester !== currentSemester,
  };
}

/**
 * Place a student onto a confirmed makeup/retake target when their current term is
 * already approved (no open grade form). Used when staff assign leftover work after
 * the last curriculum term is complete.
 */
export async function placeStudentOnRetakeTarget(options: {
  studentId: string;
  target: TermRef;
}): Promise<boolean> {
  const { studentId, target } = options;
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { yearLevel: true, currentSemester: true },
  });

  if (!student) {
    return false;
  }

  const current: TermRef = {
    yearLevel: student.yearLevel,
    semester: student.currentSemester,
  };

  if (compareTerms(target, current) <= 0) {
    return false;
  }

  await db.student.update({
    where: { id: studentId },
    data: { yearLevel: target.yearLevel, currentSemester: target.semester },
  });

  return true;
}

/**
 * Advances a student after an admin completes a term evaluation.
 * - If every subject for the year level is PASSED → next year, FIRST semester.
 * - Otherwise → FIRST → SECOND within the same year.
 * - After SECOND → next year FIRST when below the curriculum max year.
 * - After the last curriculum term, confirmed leftover/failed subjects open a makeup term.
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
    return standingResult(1, 'FIRST');
  }

  let { yearLevel, currentSemester } = student;

  if (
    completedTerm &&
    (yearLevel !== completedTerm.yearLevel || currentSemester !== completedTerm.semester)
  ) {
    return standingResult(yearLevel, currentSemester);
  }

  const maxYearLevel = await getMaxYearLevel(curriculumId);
  const inMakeupStanding = yearLevel > maxYearLevel;

  if (!inMakeupStanding) {
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
  }

  return maybeAdvanceToMakeupTerm({
    studentId,
    yearLevel,
    currentSemester,
    maxYearLevel,
  });
}
