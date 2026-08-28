'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { isEvaluationApproved, isEvaluationEvaluated } from '@/lib/evaluation';
import {
  deletePendingTermEvaluation,
  getTermEvaluationRecord,
} from '@/lib/evaluation-service';

export async function cancelGradeSubmission() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'USER') {
    return { error: 'Unauthorized' };
  }

  const student = await db.student.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      curriculumId: true,
      yearLevel: true,
      currentSemester: true,
    },
  });

  if (!student) {
    return { error: 'Student record not found' };
  }

  if (!student.curriculumId) {
    return { error: 'No curriculum assigned' };
  }

  const key = {
    studentId: student.id,
    curriculumId: student.curriculumId,
    yearLevel: student.yearLevel,
    semester: student.currentSemester,
  };

  const existing = await getTermEvaluationRecord(key);

  if (existing && isEvaluationEvaluated(existing.status)) {
    return {
      error: isEvaluationApproved(existing.status)
        ? 'This term is already approved. You cannot cancel the submission.'
        : 'Your department head has already evaluated this term. You cannot cancel the submission.',
    };
  }

  if (existing) {
    const deleted = await deletePendingTermEvaluation(key);
    if (!deleted) {
      return { error: 'Unable to cancel this submission. Try again.' };
    }
  }

  revalidatePath('/default');
  revalidatePath('/dashboard/students');
  revalidatePath('/dashboard/records');
  revalidatePath(`/dashboard/records/${student.id}`);

  return { success: 'Submission cancelled. You can edit your grades and submit again.' };
}
