import type { EvaluationStatus, SemesterTerm, UserRole } from '@/app/generated/prisma/enums';
import type { EnrollmentTerm } from '@/lib/student-progression';

export type EvaluationSubjectItem = {
  id: string;
  code: string;
  description: string;
  percent?: number;
  missing?: string[];
};

export type EvaluatorPositionType = 'ADMIN' | 'HEAD';

export type EvaluationCompletionRecord = {
  completedByName: string;
  completedByPosition: string;
  remarks?: string;
};

export type EvaluationApprovalRecord = {
  approvedByName: string;
  approvedByPosition: string;
  remarks?: string;
};

export type EvaluationSnapshot = {
  passed: EvaluationSubjectItem[];
  eligible: EvaluationSubjectItem[];
  blocked: EvaluationSubjectItem[];
  counts: {
    passed: number;
    eligible: number;
    blocked: number;
  };
  yearLevel: number;
  semester: SemesterTerm;
  submittedAt?: string;
  submittedBy?: UserRole;
  completedByName?: string;
  completedByPosition?: string;
  remarks?: string;
  approvedAt?: string;
  approvedBy?: UserRole;
  approvedByName?: string;
  approvedByPosition?: string;
  approvalRemarks?: string;
};

export type EvaluationComputation = {
  passed: EvaluationSubjectItem[];
  eligible: EvaluationSubjectItem[];
  blocked: EvaluationSubjectItem[];
  /** When evaluating a specific term, eligible/blocked target the next enrollment term. */
  nextEnrollmentTerm?: EnrollmentTerm | null;
};

export type TermEvaluationKey = {
  studentId: string;
  curriculumId: string;
  yearLevel: number;
  semester: SemesterTerm;
};

export type StoredEvaluationRecord = {
  id: string;
  status: EvaluationStatus;
  summary: string | null;
  submittedAt: Date | null;
  submittedBy: UserRole | null;
  approvedAt: Date | null;
  approvedBy: UserRole | null;
  yearLevel: number;
  semester: SemesterTerm;
  updatedAt: Date;
};

export const EVALUATION_STATUS_LABEL: Record<EvaluationStatus, string> = {
  PENDING: 'Pending evaluation',
  EVALUATED: 'Evaluated',
  COMPLETED: 'Approved',
};

export function isEvaluationEvaluated(
  status?: EvaluationStatus | string | null
): boolean {
  return status === 'EVALUATED' || status === 'COMPLETED';
}

export function isEvaluationApproved(
  status?: EvaluationStatus | string | null
): boolean {
  return status === 'COMPLETED';
}

export function formatCompletedByPosition(
  positionType: EvaluatorPositionType,
  course?: { code: string; title: string } | null
): string {
  if (positionType === 'ADMIN') {
    return 'Registrar / Admin';
  }
  if (!course) {
    return 'Head of Course';
  }
  return `Head of ${course.code} (${course.title})`;
}

export function formatEvaluatorLabel(
  name?: string | null,
  position?: string | null
): string {
  if (name && position) {
    return `${name} (${position})`;
  }
  return name || position || 'staff';
}

export function todayDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatEvaluationDate(value?: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function buildEvaluationSnapshot(
  computation: EvaluationComputation,
  key: TermEvaluationKey,
  submittedBy: UserRole,
  completion?: EvaluationCompletionRecord,
  submittedAt: Date = new Date()
): EvaluationSnapshot {
  return {
    passed: computation.passed,
    eligible: computation.eligible,
    blocked: computation.blocked,
    counts: {
      passed: computation.passed.length,
      eligible: computation.eligible.length,
      blocked: computation.blocked.length,
    },
    yearLevel: key.yearLevel,
    semester: key.semester,
    submittedAt: submittedAt.toISOString(),
    submittedBy,
    completedByName: completion?.completedByName,
    completedByPosition: completion?.completedByPosition,
    remarks: completion?.remarks,
  };
}

export function serializeEvaluationSnapshot(snapshot: EvaluationSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseEvaluationSnapshot(summary: string | null): EvaluationSnapshot | null {
  if (!summary) {
    return null;
  }

  try {
    const parsed = JSON.parse(summary) as Partial<EvaluationSnapshot> & {
      passed?: number;
      eligible?: number;
      blocked?: number;
    };

    const completion = {
      completedByName: parsed.completedByName,
      completedByPosition: parsed.completedByPosition,
      remarks: parsed.remarks,
      approvedAt: parsed.approvedAt,
      approvedBy: parsed.approvedBy,
      approvedByName: parsed.approvedByName,
      approvedByPosition: parsed.approvedByPosition,
      approvalRemarks: parsed.approvalRemarks,
    };

    if (Array.isArray(parsed.passed) && Array.isArray(parsed.eligible) && Array.isArray(parsed.blocked)) {
      return {
        passed: parsed.passed,
        eligible: parsed.eligible,
        blocked: parsed.blocked,
        counts: parsed.counts ?? {
          passed: parsed.passed.length,
          eligible: parsed.eligible.length,
          blocked: parsed.blocked.length,
        },
        yearLevel: parsed.yearLevel ?? 1,
        semester: parsed.semester ?? 'FIRST',
        submittedAt: parsed.submittedAt,
        submittedBy: parsed.submittedBy,
        ...completion,
      };
    }

    if (
      typeof parsed.passed === 'number' &&
      typeof parsed.eligible === 'number' &&
      typeof parsed.blocked === 'number'
    ) {
      return {
        passed: [],
        eligible: [],
        blocked: [],
        counts: {
          passed: parsed.passed,
          eligible: parsed.eligible,
          blocked: parsed.blocked,
        },
        yearLevel: parsed.yearLevel ?? 1,
        semester: parsed.semester ?? 'FIRST',
        submittedAt: parsed.submittedAt,
        submittedBy: parsed.submittedBy,
        ...completion,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveEvaluationDisplay(
  stored: StoredEvaluationRecord | null,
  live: EvaluationComputation
): EvaluationComputation & {
  status: EvaluationStatus;
  submittedAt: Date | null;
  submittedBy: UserRole | null;
  completedByName: string | null;
  completedByPosition: string | null;
  remarks: string | null;
  approvedAt: Date | null;
  approvedBy: UserRole | null;
  approvedByName: string | null;
  approvedByPosition: string | null;
  approvalRemarks: string | null;
  isStoredResult: boolean;
} {
  if (isEvaluationEvaluated(stored?.status)) {
    const snapshot = parseEvaluationSnapshot(stored?.summary ?? null);
    if (snapshot) {
      const isApproved = isEvaluationApproved(stored?.status);
      const hasSeparateApproval = Boolean(
        stored?.approvedAt || snapshot.approvedByName || snapshot.approvedAt
      );

      return {
        passed: snapshot.passed,
        eligible: snapshot.eligible,
        blocked: snapshot.blocked,
        status: stored!.status,
        submittedAt: stored!.submittedAt,
        submittedBy: stored!.submittedBy,
        completedByName: snapshot.completedByName ?? null,
        completedByPosition: snapshot.completedByPosition ?? null,
        remarks: snapshot.remarks ?? null,
        approvedAt: stored!.approvedAt ?? (isApproved ? stored!.submittedAt : null),
        approvedBy: stored!.approvedBy ?? (isApproved && !hasSeparateApproval ? stored!.submittedBy : null),
        approvedByName:
          snapshot.approvedByName ??
          (isApproved && !hasSeparateApproval ? snapshot.completedByName ?? null : null),
        approvedByPosition:
          snapshot.approvedByPosition ??
          (isApproved && !hasSeparateApproval ? snapshot.completedByPosition ?? null : null),
        approvalRemarks: snapshot.approvalRemarks ?? null,
        isStoredResult: true,
      };
    }
  }

  return {
    ...live,
    status: stored?.status ?? 'PENDING',
    submittedAt: stored?.submittedAt ?? null,
    submittedBy: stored?.submittedBy ?? null,
    completedByName: null,
    completedByPosition: null,
    remarks: null,
    approvedAt: stored?.approvedAt ?? null,
    approvedBy: stored?.approvedBy ?? null,
    approvedByName: null,
    approvedByPosition: null,
    approvalRemarks: null,
    isStoredResult: false,
  };
}
