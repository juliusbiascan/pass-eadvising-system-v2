import type { GradePassSettings } from '@/lib/grade-evaluation';
import type { EvaluationStatus, UserRole } from '@/app/generated/prisma/enums';

export type CurriculumItem = {
  id: string;
  code: string;
  description: string;
  units: number;
  yearLevel: number;
  semester: string;
  displayOrder: number;
  /** Confirmed retake/makeup placed on the current term's grade form. */
  isRetake?: boolean;
  previousGrade?: string | null;
  /** Why this leftover subject is being taken later. */
  scheduleKind?: 'FAILED' | 'PENDING' | 'INCOMPLETE';
};

export type GradeStatus = 'PASSED' | 'FAILED' | 'INCOMPLETE' | 'PENDING';

export type ExistingGrade = {
  grade?: string | null;
  status: GradeStatus;
};

export type EvaluationSubject = {
  id: string;
  code: string;
  description: string;
  percent?: number;
  missing?: string[];
};

export type StudentPortalStudent = {
  id: string;
  fullName: string;
  studentId: string;
  course: string;
  yearLevel: number;
  currentSemester: string;
  email: string | null;
  isMakeupStanding?: boolean;
  isProgramComplete?: boolean;
};

export type PriorTermGap = {
  key: string;
  label: string;
  yearLevel: number;
  semester: string;
  missingGrades: number;
  totalSubjects: number;
  evaluationStatus: EvaluationStatus | null;
};

export type StudentPortalData = {
  student: StudentPortalStudent;
  curriculumId: string;
  gradePassSettings: GradePassSettings;
  activeSemester: string;
  currentTermLabel: string;
  nextEnrollmentLabel: string | null;
  /** Subjects from Year 1 through the student's current year level. */
  curriculumData: CurriculumItem[];
  /** Subjects for the active semester at the current year level (grade entry). */
  activeOfferingData: CurriculumItem[];
  /** Failed or leftover subjects confirmed to appear on the current term's grade form. */
  retakeOfferingData: CurriculumItem[];
  /** Failed subjects plus unfinished subjects from an earlier term. */
  deferredSubjects: CurriculumItem[];
  maxYearLevel: number;
  isMakeupStanding: boolean;
  isProgramComplete: boolean;
  priorTermGaps: {
    hasGap: boolean;
    gaps: PriorTermGap[];
  };
  existingGrades: Record<string, ExistingGrade>;
  /** True after the student submits term grades (a current-term evaluation record exists). */
  hasSubmittedTermGrades: boolean;
  displayEvaluation: {
    status: EvaluationStatus;
    submittedAt?: Date | string | null;
    submittedBy?: UserRole | null;
    completedByName?: string | null;
    completedByPosition?: string | null;
    remarks?: string | null;
    approvedAt?: Date | string | null;
    approvedByName?: string | null;
    approvedByPosition?: string | null;
    approvalRemarks?: string | null;
    isStoredResult: boolean;
  };
  termEvaluationLists: {
    passed: EvaluationSubject[];
    eligible: EvaluationSubject[];
    blocked: EvaluationSubject[];
  };
  gradeStats: {
    passed: CurriculumItem[];
    failed: CurriculumItem[];
    incomplete: CurriculumItem[];
    pending: CurriculumItem[];
    progressPct: number;
  };
};

export type StudentPortalError =
  | { type: 'no-student' }
  | { type: 'no-curriculum' };
