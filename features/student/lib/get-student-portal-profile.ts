import { auth } from '@/auth';
import { db } from '@/lib/db';

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
      user: { select: { email: true } },
    },
  });

  if (!student) {
    return null;
  }

  return {
    id: student.id,
    fullName: student.fullName,
    studentId: student.studentId,
    course: student.course,
    yearLevel: student.yearLevel,
    currentSemester: student.currentSemester,
    email: student.email || student.user.email || session.user.email || null,
  };
}
