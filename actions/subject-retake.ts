'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { isEvaluationApproved } from '@/lib/evaluation';
import { getTermEvaluationRecord } from '@/lib/evaluation-service';
import {
  getMaxYearLevel,
  placeStudentOnRetakeTarget,
} from '@/lib/student-progression';
import {
  compareTerms,
  formatRetakeScheduleLabel,
  formatTermRef,
  isPriorTerm,
  resolveRetakeTargetTerm,
} from '@/lib/subject-retakes';
import { requireStudentRecordAccess } from '@/lib/staff-access';
import { ClearSubjectRetakeSchema, ConfirmSubjectRetakeSchema } from '@/schemas';

async function ensureStaffForStudent(studentId: string) {
  const result = await requireStudentRecordAccess(studentId);
  return !('error' in result) && result.access === 'staff';
}

export async function confirmFailedSubjectRetake(values: {
  studentId: string;
  curriculumSubjectId: string;
  schedule: 'NEXT_SEMESTER' | 'NEXT_YEAR';
}) {
  const parsed = ConfirmSubjectRetakeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid retake request' };
  }

  const { studentId, curriculumSubjectId, schedule } = parsed.data;

  if (!(await ensureStaffForStudent(studentId))) {
    return { error: 'Unauthorized' };
  }

  const [student, offering, grade] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        curriculumId: true,
        yearLevel: true,
        currentSemester: true,
      },
    }),
    db.curriculumSubject.findUnique({
      where: { id: curriculumSubjectId },
      select: { id: true, yearLevel: true, semester: true, curriculumId: true },
    }),
    db.studentGrade.findUnique({
      where: {
        studentId_curriculumSubjectId: { studentId, curriculumSubjectId },
      },
      select: { grade: true, status: true },
    }),
  ]);

  if (!student) {
    return { error: 'Student not found' };
  }

  if (!offering) {
    return { error: 'Subject offering not found' };
  }

  if (grade?.status === 'PASSED') {
    return { error: 'This subject is already passed' };
  }

  const current = {
    yearLevel: student.yearLevel,
    semester: student.currentSemester,
  };
  const isPrior = isPriorTerm(
    { yearLevel: offering.yearLevel, semester: offering.semester },
    current
  );
  const curriculumId = student.curriculumId ?? offering.curriculumId;
  const [maxYearLevel, currentEval] = await Promise.all([
    curriculumId ? getMaxYearLevel(curriculumId) : Promise.resolve(student.yearLevel + 2),
    curriculumId
      ? getTermEvaluationRecord({
          studentId,
          curriculumId,
          yearLevel: student.yearLevel,
          semester: student.currentSemester,
        })
      : Promise.resolve(null),
  ]);
  const currentTermClosed = isEvaluationApproved(currentEval?.status);
  const fromClosedStanding =
    currentTermClosed &&
    compareTerms(
      { yearLevel: offering.yearLevel, semester: offering.semester },
      current
    ) <= 0;
  const canSchedule =
    grade?.status === 'FAILED' ||
    ((isPrior || fromClosedStanding) &&
      (!grade || grade.status === 'PENDING' || grade.status === 'INCOMPLETE'));

  if (!canSchedule) {
    return {
      error:
        'Only failed subjects, or unfinished subjects from an earlier term, can be scheduled for next semester or next year',
    };
  }

  const target = resolveRetakeTargetTerm({
    schedule,
    failedYearLevel: offering.yearLevel,
    failedSemester: offering.semester,
    studentYearLevel: student.yearLevel,
    studentSemester: student.currentSemester,
    maxYearLevel,
    currentTermClosed,
  });

  if (!target) {
    return { error: 'Could not determine a term for this subject' };
  }

  await db.subjectRetake.upsert({
    where: {
      studentId_curriculumSubjectId: { studentId, curriculumSubjectId },
    },
    create: {
      studentId,
      curriculumSubjectId,
      status: 'CONFIRMED',
      schedule,
      targetYearLevel: target.yearLevel,
      targetSemester: target.semester,
      failedAtYearLevel: offering.yearLevel,
      failedAtSemester: offering.semester,
      originalGrade: grade?.grade ?? null,
      confirmedAt: new Date(),
    },
    update: {
      status: 'CONFIRMED',
      schedule,
      targetYearLevel: target.yearLevel,
      targetSemester: target.semester,
      failedAtYearLevel: offering.yearLevel,
      failedAtSemester: offering.semester,
      originalGrade: grade?.grade ?? null,
      confirmedAt: new Date(),
    },
  });

  let openedMakeupTerm = false;
  if (currentTermClosed) {
    openedMakeupTerm = await placeStudentOnRetakeTarget({ studentId, target });
  }

  revalidatePath(`/dashboard/records/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/evaluate`);
  revalidatePath('/dashboard/records');
  revalidatePath('/default');

  const kind = grade?.status === 'FAILED' ? 'Retake' : 'Makeup';
  const termLabel = formatTermRef(target, maxYearLevel);
  const placement = openedMakeupTerm
    ? ` The student is now in that makeup term so grades can be entered.`
    : ' It will appear on the student grade form in that term.';

  return {
    success: `${kind} approved for ${formatRetakeScheduleLabel(schedule)} (${termLabel}).${placement}`,
  };
}

export async function clearFailedSubjectRetake(values: {
  studentId: string;
  curriculumSubjectId: string;
}) {
  const parsed = ClearSubjectRetakeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid request' };
  }

  if (!(await ensureStaffForStudent(parsed.data.studentId))) {
    return { error: 'Unauthorized' };
  }

  const { studentId, curriculumSubjectId } = parsed.data;

  const existing = await db.subjectRetake.findUnique({
    where: {
      studentId_curriculumSubjectId: { studentId, curriculumSubjectId },
    },
    select: { status: true },
  });

  if (!existing) {
    return { error: 'No retake approval found for this subject' };
  }

  if (existing.status === 'COMPLETED') {
    return { error: 'A completed retake cannot be cleared' };
  }

  await db.subjectRetake.delete({
    where: {
      studentId_curriculumSubjectId: { studentId, curriculumSubjectId },
    },
  });

  revalidatePath(`/dashboard/records/${studentId}`);
  revalidatePath('/dashboard/records');
  revalidatePath('/default');

  return { success: 'Retake approval cleared' };
}
