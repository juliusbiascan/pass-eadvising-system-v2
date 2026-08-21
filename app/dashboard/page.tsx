import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CurriculumProgress from '@/features/dashboard/components/curriculum-progress';
import { DashboardAtRiskSubjects } from '@/features/dashboard/components/dashboard-at-risk-subjects';
import {
  CurriculumProgressBarChart,
  EvaluationStatusChart,
  GradeStatusChart,
  StudentsBySemesterChart,
  StudentsByYearChart,
} from '@/features/dashboard/components/dashboard-overview-charts';
import { DashboardQuickLinks } from '@/features/dashboard/components/dashboard-quick-links';
import {
  DashboardRecentEvaluations,
  DashboardRecentEvaluationsFooter,
} from '@/features/dashboard/components/dashboard-recent-evaluations';
import { DashboardSection } from '@/features/dashboard/components/dashboard-section';
import { DashboardStatCards } from '@/features/dashboard/components/dashboard-stat-cards';
import {
  getCurriculumProgress,
  getDashboardStats,
  getEvaluationStatusBreakdown,
  getEvaluationSummary,
  getFailedSubjects,
  getGradeStatusBreakdown,
  getStudentsBySemester,
  getStudentsByYearLevel,
} from '@/features/dashboard/lib/get-dashboard-data';
import { getDashboardAccess } from '@/lib/staff-access';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Admin Dashboard - Academic System',
};

function formatDashboardDate() {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

const Dashboard = async () => {
  const access = await getDashboardAccess();
  if (!access) {
    redirect('/auth/login');
  }

  const courseCodes = access.courseCodes;
  const [
    stats,
    evaluationSummary,
    curriculumProgress,
    failedSubjects,
    evaluationStatusData,
    studentsByYear,
    studentsBySemester,
    gradeStatusData,
  ] = await Promise.all([
    getDashboardStats(courseCodes),
    getEvaluationSummary(courseCodes),
    getCurriculumProgress(courseCodes),
    getFailedSubjects(courseCodes),
    getEvaluationStatusBreakdown(courseCodes),
    getStudentsByYearLevel(courseCodes),
    getStudentsBySemester(courseCodes),
    getGradeStatusBreakdown(courseCodes),
  ]);

  const curriculumChartData = curriculumProgress.map((row) => ({
    name: `${row.programCode} ${row.batchYear}`,
    completed: row.completedStudents,
    pending: row.pendingStudents,
    total: row.totalStudents,
    rate: Math.round(row.progressPercentage),
  }));

  const totalEvaluations = stats.completedEvaluations + stats.pendingEvaluations;
  const completionRate =
    totalEvaluations > 0
      ? Math.round((stats.completedEvaluations / totalEvaluations) * 100)
      : 0;

  const pendingCurriculumStudents = curriculumProgress.reduce(
    (sum, row) => sum + row.pendingStudents,
    0
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--pass-red)">
            PASS E-Advising
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-(--pass-cod) dark:text-(--pass-iron) sm:text-3xl">
            {access.role === 'HEAD' ? 'Department overview' : 'Admin overview'}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDashboardDate()}</p>
          {access.role === 'HEAD' ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {access.courses.length > 0 ? (
                access.courses.map((course) => (
                  <Badge key={course.id} variant="secondary">
                    {course.code}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No departments assigned yet. Ask an administrator to assign
                  courses to this head account.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCurriculumStudents > 0 ? (
            <Badge variant="secondary" className="gap-1 px-2.5 py-1">
              <TrendingUp className="size-3" aria-hidden />
              {pendingCurriculumStudents} pending this term
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/reports">
              Open reports
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex-1">
          <DashboardStatCards stats={stats} />
        </div>
        <aside className="flex shrink-0 flex-col justify-center overflow-hidden rounded-2xl border border-(--pass-gold)/35 bg-(--pass-cod) px-5 py-4 text-(--pass-iron) shadow-sm transition-transform duration-300 hover:-translate-y-0.5 lg:w-52">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-(--pass-gold)">
            Term completion
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-(--pass-gold)">{completionRate}%</p>
          <p className="mt-1 text-xs text-(--pass-iron)/70">
            {stats.completedEvaluations} of {totalEvaluations || '—'} evaluations done
          </p>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardSection
              title="Evaluation status"
              description="All term evaluations by status"
            >
              <EvaluationStatusChart data={evaluationStatusData} />
            </DashboardSection>

            <DashboardSection
              title="Grade outcomes"
              description="Distribution of saved student grades"
            >
              <GradeStatusChart data={gradeStatusData} />
            </DashboardSection>

            <DashboardSection
              title="Students by year level"
              description="Current year level placement"
            >
              <StudentsByYearChart data={studentsByYear} />
            </DashboardSection>

            <DashboardSection title="Students by semester" description="Current semester term">
              <StudentsBySemesterChart data={studentsBySemester} />
            </DashboardSection>
          </div>

          <DashboardSection
            title="Curriculum evaluation completion"
            description="Students with a completed evaluation for their current year level and semester"
            contentClassName="space-y-8"
          >
            <CurriculumProgressBarChart data={curriculumChartData} />
            <CurriculumProgress data={curriculumProgress} />
          </DashboardSection>
        </div>

        <aside className="space-y-6">
          <DashboardSection title="Quick actions" description="Jump to common tasks">
            <DashboardQuickLinks role={access.role} />
          </DashboardSection>

          <DashboardSection
            title="Recent evaluations"
            description="Latest student evaluation activity"
          >
            <DashboardRecentEvaluations data={evaluationSummary} />
            <DashboardRecentEvaluationsFooter />
          </DashboardSection>

          <DashboardSection
            title="At-risk subjects"
            description="Highest failure rates in the catalog"
          >
            <DashboardAtRiskSubjects data={failedSubjects} />
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
