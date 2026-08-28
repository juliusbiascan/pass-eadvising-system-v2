'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { schoolBrand } from '@/config/school';
import AcademicProgressReport from '@/features/dashboard/components/academic-progress-report';
import CurriculumReport from '@/features/dashboard/components/curriculum-report';
import { DashboardSection } from '@/features/dashboard/components/dashboard-section';
import EvaluationReport from '@/features/dashboard/components/evaluation-report';
import FailedSubjects from '@/features/dashboard/components/failed-subjects';
import { ReportLetterhead } from '@/features/dashboard/components/reports/report-letterhead';
import { ReportInsights } from '@/features/dashboard/components/reports/report-insights';
import { ReportKpiGrid } from '@/features/dashboard/components/reports/report-kpis';
import {
  CourseProgressChart,
  CurriculumLoadChart,
  CurriculumStatusPie,
  EvaluationStatusPie,
  EvaluationsByCourseChart,
  FailureRateChart,
  NamedCountBarChart,
  ProgressDistributionChart,
  RiskBandPie,
} from '@/features/dashboard/components/reports/report-charts';
import type { ReportExportType, ReportsBundle } from '@/features/dashboard/lib/report-types';

const TAB_TITLES: Record<Exclude<ReportExportType, 'all'>, string> = {
  evaluations: 'Student Evaluation Report',
  curriculum: 'Curriculum Report',
  performance: 'Subject Performance Report',
  progress: 'Academic Progress Report',
};

type ReportsWorkspaceProps = {
  data: ReportsBundle;
};

export function ReportsWorkspace({ data }: ReportsWorkspaceProps) {
  const [tab, setTab] = useState<Exclude<ReportExportType, 'all'>>('evaluations');
  const [exporting, setExporting] = useState<ReportExportType | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportExcel(type: ReportExportType) {
    setExportError(null);
    setExporting(type);
    try {
      const response = await fetch(`/api/reports/export?type=${type}`);
      if (!response.ok) {
        throw new Error('Could not build the spreadsheet.');
      }
      const blob = await response.blob();
      const filename =
        response.headers
          .get('Content-Disposition')
          ?.match(/filename="([^"]+)"/)?.[1] ?? 'PASS-College-Academic-Report.xlsx';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Export failed. Try again.'
      );
    } finally {
      setExporting(null);
    }
  }

  const overviewKpis = [
    {
      label: 'Evaluations',
      value: data.evaluations.analytics.total.toLocaleString(),
      hint: `${data.evaluations.analytics.approvalRate}% approved`,
    },
    {
      label: 'Curriculum batches',
      value: data.curriculum.analytics.total.toLocaleString(),
      hint: `${data.curriculum.analytics.totalStudents} students assigned`,
    },
    {
      label: 'High-risk subjects',
      value: data.performance.analytics.highRiskCount.toLocaleString(),
      hint: `${data.performance.analytics.avgFailureRate}% avg. failure rate`,
      tone: data.performance.analytics.highRiskCount > 0 ? ('danger' as const) : ('default' as const),
    },
    {
      label: 'Average progress',
      value: `${data.progress.analytics.avgProgress}%`,
      hint: `${data.progress.analytics.atRiskCount} students need advising`,
      tone: data.progress.analytics.avgProgress >= 60 ? ('gold' as const) : ('default' as const),
    },
  ];

  return (
    <div className="report-print-root space-y-6">
      <div className="report-export-bar flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--pass-red)">
            Academic reports
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-(--pass-cod) dark:text-(--pass-iron) sm:text-3xl">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Figures, analysis, and exportable records for evaluations, curriculum, subject
            performance, and student progress.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Print / PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" disabled={exporting !== null}>
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Export Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>PASS College workbook</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void exportExcel(tab)}>
                <FileSpreadsheet className="size-4" aria-hidden />
                This report ({TAB_TITLES[tab]})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportExcel('all')}>
                <FileSpreadsheet className="size-4" aria-hidden />
                Full academic report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {exportError ? (
        <p className="text-sm text-destructive print:hidden">{exportError}</p>
      ) : null}

      <ReportLetterhead
        title={TAB_TITLES[tab]}
        generatedAt={data.meta.generatedAt}
        scopeLabel={data.meta.scopeLabel}
        roleLabel={data.meta.roleLabel}
      />

      <div className="print:hidden">
        <ReportKpiGrid items={overviewKpis} />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Exclude<ReportExportType, 'all'>)}
        className="space-y-4"
      >
        <TabsList className="report-tabs-list h-auto w-full flex-wrap justify-start print:hidden">
          <TabsTrigger value="evaluations">Student evaluations</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="performance">Subject performance</TabsTrigger>
          <TabsTrigger value="progress">Academic progress</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="report-section report-section-first space-y-4">
          <h2 className="sr-only">{TAB_TITLES.evaluations}</h2>
          <ReportKpiGrid items={data.evaluations.analytics.kpis} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardSection
              title="Evaluation status"
              description="Approved, evaluated, and pending term evaluations"
            >
              <EvaluationStatusPie data={data.evaluations.analytics.byStatus} />
            </DashboardSection>
            <DashboardSection
              title="Evaluations by course"
              description="Workload and completion mix per program"
            >
              <EvaluationsByCourseChart data={data.evaluations.analytics.byCourse} />
            </DashboardSection>
            <DashboardSection
              title="Evaluations by year level"
              description="Which year levels are being processed"
              className="lg:col-span-2"
            >
              <NamedCountBarChart
                data={data.evaluations.analytics.byYear}
                emptyMessage="No year-level evaluation data yet"
              />
            </DashboardSection>
          </div>
          <ReportInsights insights={data.evaluations.analytics.insights} />
          <DashboardSection
            title="Evaluation register"
            description="Submitted term evaluations with passed, eligible, and blocked counts"
          >
            <EvaluationReport data={data.evaluations.rows} />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="curriculum" className="report-section space-y-4">
          <h2 className="sr-only">{TAB_TITLES.curriculum}</h2>
          <ReportKpiGrid items={data.curriculum.analytics.kpis} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardSection
              title="Students and subjects by batch"
              description="Enrollment size versus catalog depth"
            >
              <CurriculumLoadChart data={data.curriculum.analytics.byProgram} />
            </DashboardSection>
            <DashboardSection
              title="Active vs inactive versions"
              description="Curriculum versions currently in use"
            >
              <CurriculumStatusPie data={data.curriculum.analytics.statusSplit} />
            </DashboardSection>
          </div>
          <ReportInsights insights={data.curriculum.analytics.insights} />
          <DashboardSection
            title="Curriculum register"
            description="Program versions, subject counts, enrolled students, and term distribution"
          >
            <CurriculumReport data={data.curriculum.rows} />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="performance" className="report-section space-y-4">
          <h2 className="sr-only">{TAB_TITLES.performance}</h2>
          <ReportKpiGrid items={data.performance.analytics.kpis} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardSection
              title="Highest failure rates"
              description="Top subjects by share of FAILED grades"
            >
              <FailureRateChart data={data.performance.analytics.topFailures} />
            </DashboardSection>
            <DashboardSection
              title="Risk bands"
              description="Subjects grouped by failure-rate threshold"
            >
              <RiskBandPie data={data.performance.analytics.riskBands} />
            </DashboardSection>
          </div>
          <ReportInsights insights={data.performance.analytics.insights} />
          <DashboardSection
            title="Subject performance register"
            description="Failure counts and rates for every subject with recorded grades"
          >
            <FailedSubjects data={data.performance.rows} />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="progress" className="report-section space-y-4">
          <h2 className="sr-only">{TAB_TITLES.progress}</h2>
          <ReportKpiGrid items={data.progress.analytics.kpis} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardSection
              title="Completion distribution"
              description="How many students sit in each progress band"
            >
              <ProgressDistributionChart data={data.progress.analytics.distribution} />
            </DashboardSection>
            <DashboardSection
              title="Average progress by course"
              description="Curriculum completion compared across programs"
            >
              <CourseProgressChart data={data.progress.analytics.byCourse} />
            </DashboardSection>
            <DashboardSection
              title="Average progress by year level"
              description="Completion rate as students move through the program"
              className="lg:col-span-2"
            >
              <NamedCountBarChart
                data={data.progress.analytics.byYear}
                emptyMessage="No year-level progress yet"
                seriesLabel="Average %"
                unit="%"
              />
            </DashboardSection>
          </div>
          <ReportInsights insights={data.progress.analytics.insights} />
          <DashboardSection
            title="Student progress register"
            description="Per-student completion based on passed subjects in the assigned curriculum"
          >
            <AcademicProgressReport data={data.progress.rows} />
          </DashboardSection>
        </TabsContent>
      </Tabs>

      <footer className="hidden border-t border-border/80 pt-3 text-xs text-muted-foreground print:block">
        {schoolBrand.name} · {schoolBrand.systemName} · Internal academic report · {data.meta.scopeLabel}
      </footer>
    </div>
  );
}
