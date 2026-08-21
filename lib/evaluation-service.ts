'use server';

import { db } from '@/lib/db';
import type { SemesterTerm, UserRole } from '@/app/generated/prisma/enums';
import {
  buildEvaluationSnapshot,
  parseEvaluationSnapshot,
  serializeEvaluationSnapshot,
  type EvaluationApprovalRecord,
  type EvaluationComputation,
  type EvaluationCompletionRecord,
  type EvaluationSnapshot,
  type StoredEvaluationRecord,
  type TermEvaluationKey,
} from '@/lib/evaluation';

const evaluationRecordSelect = {
  id: true,
  status: true,
  summary: true,
  submittedAt: true,
  submittedBy: true,
  approvedAt: true,
  approvedBy: true,
  yearLevel: true,
  semester: true,
  updatedAt: true,
} as const;

/** PASSED grades across the whole curriculum, keyed by catalog subject id. */
export async function getPassedSubjectIdsForCurriculum(
  studentId: string,
  curriculumId: string
): Promise<Set<string>> {
  const offerings = await db.curriculumSubject.findMany({
    where: { curriculumId },
    select: { id: true, subjectId: true },
  });

  if (offerings.length === 0) {
    return new Set();
  }

  const offeringIdToSubjectId = new Map(
    offerings.map((offering) => [offering.id, offering.subjectId])
  );

  const grades = await db.studentGrade.findMany({
    where: { studentId, status: 'PASSED' },
    select: { curriculumSubjectId: true },
  });

  const passedSubjectIds = new Set<string>();
  for (const grade of grades) {
    const subjectId = offeringIdToSubjectId.get(grade.curriculumSubjectId);
    if (subjectId) {
      passedSubjectIds.add(subjectId);
    }
  }

  return passedSubjectIds;
}

export async function getTermEvaluationRecord(
  key: TermEvaluationKey
): Promise<StoredEvaluationRecord | null> {
  const record = await db.evaluationResult.findUnique({
    where: {
      studentId_curriculumId_yearLevel_semester: {
        studentId: key.studentId,
        curriculumId: key.curriculumId,
        yearLevel: key.yearLevel,
        semester: key.semester,
      },
    },
    select: evaluationRecordSelect,
  });

  return record;
}

export async function markTermEvaluationPending(key: TermEvaluationKey): Promise<void> {
  await db.evaluationResult.upsert({
    where: {
      studentId_curriculumId_yearLevel_semester: {
        studentId: key.studentId,
        curriculumId: key.curriculumId,
        yearLevel: key.yearLevel,
        semester: key.semester,
      },
    },
    create: {
      studentId: key.studentId,
      curriculumId: key.curriculumId,
      yearLevel: key.yearLevel,
      semester: key.semester,
      status: 'PENDING',
    },
    update: {
      status: 'PENDING',
      submittedAt: null,
      submittedBy: null,
      approvedAt: null,
      approvedBy: null,
    },
  });
}

export async function saveTermEvaluationEvaluated(
  key: TermEvaluationKey,
  computation: EvaluationComputation,
  submittedBy: UserRole,
  completion: EvaluationCompletionRecord,
  evaluatedAt: Date
): Promise<StoredEvaluationRecord> {
  const snapshot = buildEvaluationSnapshot(
    computation,
    key,
    submittedBy,
    completion,
    evaluatedAt
  );

  const record = await db.evaluationResult.upsert({
    where: {
      studentId_curriculumId_yearLevel_semester: {
        studentId: key.studentId,
        curriculumId: key.curriculumId,
        yearLevel: key.yearLevel,
        semester: key.semester,
      },
    },
    create: {
      studentId: key.studentId,
      curriculumId: key.curriculumId,
      yearLevel: key.yearLevel,
      semester: key.semester,
      status: 'EVALUATED',
      summary: serializeEvaluationSnapshot(snapshot),
      submittedAt: evaluatedAt,
      submittedBy,
      approvedAt: null,
      approvedBy: null,
    },
    update: {
      status: 'EVALUATED',
      summary: serializeEvaluationSnapshot(snapshot),
      submittedAt: evaluatedAt,
      submittedBy,
      approvedAt: null,
      approvedBy: null,
    },
    select: evaluationRecordSelect,
  });

  return record;
}

export async function saveTermEvaluationApproved(
  key: TermEvaluationKey,
  submittedBy: UserRole,
  approval: EvaluationApprovalRecord,
  approvedAt: Date
): Promise<StoredEvaluationRecord> {
  const existing = await getTermEvaluationRecord(key);
  const snapshot = parseEvaluationSnapshot(existing?.summary ?? null);

  if (!existing || existing.status !== 'EVALUATED' || !snapshot) {
    throw new Error('Term must be evaluated by the department head before approval');
  }

  const approvedSnapshot: EvaluationSnapshot = {
    ...snapshot,
    approvedAt: approvedAt.toISOString(),
    approvedBy: submittedBy,
    approvedByName: approval.approvedByName,
    approvedByPosition: approval.approvedByPosition,
    approvalRemarks: approval.remarks,
  };

  const record = await db.evaluationResult.update({
    where: { id: existing.id },
    data: {
      status: 'COMPLETED',
      summary: serializeEvaluationSnapshot(approvedSnapshot),
      approvedAt,
      approvedBy: submittedBy,
    },
    select: evaluationRecordSelect,
  });

  return record;
}

export async function listStudentEvaluations(studentId: string) {
  const records = await db.evaluationResult.findMany({
    where: { studentId },
    orderBy: [{ yearLevel: 'desc' }, { semester: 'desc' }, { updatedAt: 'desc' }],
    select: {
      ...evaluationRecordSelect,
      curriculum: {
        select: {
          programCode: true,
          batchLabel: true,
        },
      },
    },
  });

  return records.map((record) => {
    const snapshot = parseEvaluationSnapshot(record.summary);
    return {
      id: record.id,
      status: record.status,
      yearLevel: record.yearLevel,
      semester: record.semester,
      curriculum: `${record.curriculum.programCode} - ${record.curriculum.batchLabel}`,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      submittedBy: record.submittedBy,
      completedByName: snapshot?.completedByName ?? null,
      completedByPosition: snapshot?.completedByPosition ?? null,
      remarks: snapshot?.remarks ?? null,
      approvedAt: record.approvedAt?.toISOString() ?? snapshot?.approvedAt ?? null,
      approvedBy: record.approvedBy ?? snapshot?.approvedBy ?? null,
      approvedByName: snapshot?.approvedByName ?? null,
      approvedByPosition: snapshot?.approvedByPosition ?? null,
      approvalRemarks: snapshot?.approvalRemarks ?? null,
      updatedAt: record.updatedAt.toISOString(),
      counts: snapshot?.counts ?? { passed: 0, eligible: 0, blocked: 0 },
    };
  });
}

export async function getStudentTermContext(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      curriculumId: true,
      yearLevel: true,
      currentSemester: true,
    },
  });

  if (!student?.curriculumId) {
    return null;
  }

  return {
    studentId: student.id,
    curriculumId: student.curriculumId,
    yearLevel: student.yearLevel,
    semester: student.currentSemester as SemesterTerm,
  };
}
