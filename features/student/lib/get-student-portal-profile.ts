import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getMaxYearLevel } from '@/lib/student-progression';
import { isMakeupStanding } from '@/lib/subject-retake-helpers';

import { isCurriculumProgramComplete } from './program-complete';
import type { StudentPortalStudent } from './types';

export async function getStudentPortalProfile(): Promise<StudentPortalStudent | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const student = await db.student.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      fullName: true,
      studentId: true,
      course: true,
      yearLevel: true,
      currentSemester: true,
      email: true,
      curriculumId: true,
      user: { select: { email: true } },
      grades: { select: { curriculumSubjectId: true, status: true } },
      evaluations: {
        select: { yearLevel: true, semester: true, status: true, curriculumId: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  const maxYearLevel = student.curriculumId
    ? await getMaxYearLevel(student.curriculumId)
    : student.yearLevel;

  const subjects = student.curriculumId
    ? await db.curriculumSubject.findMany({
        where: { curriculumId: student.curriculumId, yearLevel: { lte: maxYearLevel } },
        select: { id: true },
      })
    : [];

  const grades = Object.fromEntries(
    student.grades.map((grade) => [grade.curriculumSubjectId, { status: grade.status }])
  );

  const programComplete = isCurriculumProgramComplete({
    maxYearLevel,
    yearLevel: student.yearLevel,
    semester: student.currentSemester,
    subjects,
    grades,
    evaluations: student.curriculumId
      ? student.evaluations.filter((evaluation) => evaluation.curriculumId === student.curriculumId)
      : [],
  });
  const makeupStanding =
    !programComplete && isMakeupStanding(student.yearLevel, maxYearLevel);

  return {
    id: student.id,
    fullName: student.fullName,
    studentId: student.studentId,
    course: student.course,
    yearLevel: student.yearLevel,
    currentSemester: student.currentSemester,
    email: student.email || student.user.email || session.user.email || null,
    isMakeupStanding: makeupStanding,
    isProgramComplete: programComplete,
  };
}
