'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { sendGradeSubmissionCopyEmail } from '@/lib/mail';
import { formatSemesterLabel } from '@/lib/semester-terms';

import {
  buildGradeSubmissionEmailBody,
  buildGradeSubmissionHtml,
  buildGradeSubmissionPlainText,
  buildGradeSubmissionRows,
} from '../lib/grade-submission-document';
import type { ExistingGrade } from '../lib/types';

export async function emailGradeSubmissionToSelf() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const student = await db.student.findFirst({
    where: { userId: session.user.id },
    include: {
      grades: true,
      user: { select: { email: true } },
    },
  });

  if (!student) {
    return { error: 'Student record not found' };
  }

  const recipient = student.email || student.user.email || session.user.email;
  if (!recipient) {
    return { error: 'No email is linked to your account' };
  }

  const curriculumId = student.curriculumId;
  if (!curriculumId) {
    return { error: 'No curriculum assigned' };
  }

  const offerings = await db.curriculumSubject.findMany({
    where: {
      curriculumId,
      yearLevel: student.yearLevel,
      semester: student.currentSemester,
    },
    include: {
      subject: {
        select: {
          code: true,
          description: true,
          units: true,
        },
      },
    },
    orderBy: [{ displayOrder: 'asc' }],
  });

  const existingGrades: Record<string, ExistingGrade> = {};
  for (const grade of student.grades) {
    existingGrades[grade.curriculumSubjectId] = {
      grade: grade.grade ? String(grade.grade) : null,
      status: grade.status,
    };
  }

  const document = {
    studentName: student.fullName,
    studentId: student.studentId,
    course: student.course,
    yearLevel: student.yearLevel,
    termLabel: `Year ${student.yearLevel} • ${formatSemesterLabel(student.currentSemester)}`,
    rows: buildGradeSubmissionRows(
      offerings.map((item) => ({
        id: item.id,
        code: item.subject.code,
        description: item.subject.description,
        units: item.subject.units,
        yearLevel: item.yearLevel,
        semester: item.semester,
        displayOrder: item.displayOrder,
      })),
      existingGrades
    ),
  };

  const sent = await sendGradeSubmissionCopyEmail({
    to: recipient,
    studentName: student.fullName,
    studentId: student.studentId,
    termLabel: document.termLabel,
    htmlBody: buildGradeSubmissionEmailBody(document),
    text: buildGradeSubmissionPlainText(document),
    htmlAttachment: buildGradeSubmissionHtml(document),
  });

  if (!sent) {
    return { error: 'Failed to send the document. Try again later.' };
  }

  return { success: `Sent to ${recipient}` };
}
