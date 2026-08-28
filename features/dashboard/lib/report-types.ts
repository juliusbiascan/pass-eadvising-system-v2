export type EvaluationReportRow = {
  studentRecordId: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: number;
  semester: string;
  curriculum: string;
  evaluationStatus: string;
  submittedBy?: 'ADMIN' | 'HEAD' | 'USER' | null;
  completedByName?: string | null;
  completedByPosition?: string | null;
  remarks?: string | null;
  approvedByName?: string | null;
  approvedByPosition?: string | null;
  passedCount: number;
  eligibleCount: number;
  blockedCount: number;
  completedAt?: string;
};

export type CurriculumReportRow = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: string;
  isActive: boolean;
  subjectsCount: number;
  studentsCount: number;
  semesterBreakdown: Record<string, number>;
};

export type PerformanceReportRow = {
  subjectCode: string;
  subjectDescription: string;
  failureCount: number;
  totalEnrolled: number;
  failureRate: number;
};

export type ProgressReportRow = {
  studentRecordId: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: number;
  curriculum: string;
  passed: number;
  failed: number;
  remaining: number;
  totalSubjects: number;
  progressPercentage: number;
  latestEvaluationStatus: string;
};

export type ReportInsight = {
  tone: 'positive' | 'warning' | 'neutral';
  title: string;
  detail: string;
};

export type ReportKpi = {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'gold' | 'danger';
};

export type NamedCount = {
  name: string;
  count: number;
};

export type CourseEvaluationBreakdown = {
  course: string;
  Approved: number;
  Evaluated: number;
  Pending: number;
};

export type CurriculumLoadRow = {
  name: string;
  students: number;
  subjects: number;
};

export type CourseProgressRow = {
  course: string;
  average: number;
  students: number;
};

export type EvaluationAnalytics = {
  total: number;
  pending: number;
  evaluated: number;
  approved: number;
  approvalRate: number;
  avgPassed: number;
  avgEligible: number;
  avgBlocked: number;
  byStatus: NamedCount[];
  byCourse: CourseEvaluationBreakdown[];
  byYear: NamedCount[];
  kpis: ReportKpi[];
  insights: ReportInsight[];
};

export type CurriculumAnalytics = {
  total: number;
  activeCount: number;
  totalStudents: number;
  totalSubjects: number;
  byProgram: CurriculumLoadRow[];
  statusSplit: NamedCount[];
  kpis: ReportKpi[];
  insights: ReportInsight[];
};

export type PerformanceAnalytics = {
  subjectsGraded: number;
  subjectsWithFailures: number;
  highRiskCount: number;
  moderateRiskCount: number;
  avgFailureRate: number;
  topFailures: PerformanceReportRow[];
  riskBands: NamedCount[];
  kpis: ReportKpi[];
  insights: ReportInsight[];
};

export type ProgressAnalytics = {
  studentCount: number;
  avgProgress: number;
  nearComplete: number;
  onPace: number;
  developing: number;
  behind: number;
  atRiskCount: number;
  distribution: NamedCount[];
  byCourse: CourseProgressRow[];
  byYear: NamedCount[];
  kpis: ReportKpi[];
  insights: ReportInsight[];
};

export type ReportsMeta = {
  generatedAt: string;
  scopeLabel: string;
  roleLabel: string;
};

export type ReportsBundle = {
  meta: ReportsMeta;
  evaluations: {
    rows: EvaluationReportRow[];
    analytics: EvaluationAnalytics;
  };
  curriculum: {
    rows: CurriculumReportRow[];
    analytics: CurriculumAnalytics;
  };
  performance: {
    rows: PerformanceReportRow[];
    analytics: PerformanceAnalytics;
  };
  progress: {
    rows: ProgressReportRow[];
    analytics: ProgressAnalytics;
  };
};

export type ReportExportType =
  | 'all'
  | 'evaluations'
  | 'curriculum'
  | 'performance'
  | 'progress';
