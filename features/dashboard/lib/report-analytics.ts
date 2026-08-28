import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';

import type {
  CourseEvaluationBreakdown,
  CourseProgressRow,
  CurriculumAnalytics,
  CurriculumLoadRow,
  CurriculumReportRow,
  EvaluationAnalytics,
  EvaluationReportRow,
  NamedCount,
  PerformanceAnalytics,
  PerformanceReportRow,
  ProgressAnalytics,
  ProgressReportRow,
  ReportInsight,
  ReportKpi,
} from './report-types';

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusLabel(status: string) {
  if (status === 'COMPLETED') return 'Approved';
  if (status === 'EVALUATED') return 'Evaluated';
  if (status === 'PENDING') return 'Pending';
  return status;
}

function emptyInsight(detail: string): ReportInsight[] {
  return [{ tone: 'neutral', title: 'No records yet', detail }];
}

export function buildEvaluationAnalytics(
  rows: EvaluationReportRow[]
): EvaluationAnalytics {
  const pending = rows.filter((row) => row.evaluationStatus === 'PENDING').length;
  const evaluated = rows.filter((row) => row.evaluationStatus === 'EVALUATED').length;
  const approved = rows.filter((row) => row.evaluationStatus === 'COMPLETED').length;
  const total = rows.length;
  const approvalRate = pct(approved, total);
  const avgPassed = round1(average(rows.map((row) => row.passedCount)));
  const avgEligible = round1(average(rows.map((row) => row.eligibleCount)));
  const avgBlocked = round1(average(rows.map((row) => row.blockedCount)));

  const byStatus: NamedCount[] = [
    { name: 'Approved', count: approved },
    { name: 'Evaluated', count: evaluated },
    { name: 'Pending', count: pending },
  ];

  const courseMap = new Map<string, CourseEvaluationBreakdown>();
  for (const row of rows) {
    const current = courseMap.get(row.course) ?? {
      course: row.course,
      Approved: 0,
      Evaluated: 0,
      Pending: 0,
    };
    const key = statusLabel(row.evaluationStatus) as keyof Omit<
      CourseEvaluationBreakdown,
      'course'
    >;
    if (key in current) {
      current[key] += 1;
    }
    courseMap.set(row.course, current);
  }
  const byCourse = [...courseMap.values()].sort(
    (a, b) => b.Approved + b.Evaluated + b.Pending - (a.Approved + a.Evaluated + a.Pending)
  );

  const yearMap = new Map<number, number>();
  for (const row of rows) {
    yearMap.set(row.yearLevel, (yearMap.get(row.yearLevel) ?? 0) + 1);
  }
  const byYear: NamedCount[] = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ name: formatYearLevelLabel(year), count }));

  const kpis: ReportKpi[] = [
    {
      label: 'Term evaluations',
      value: total.toLocaleString(),
      hint: 'Submitted in this scope',
    },
    {
      label: 'Approval rate',
      value: `${approvalRate}%`,
      hint: `${approved} registrar-approved`,
      tone: approvalRate >= 70 ? 'gold' : 'default',
    },
    {
      label: 'Awaiting action',
      value: (pending + evaluated).toLocaleString(),
      hint: `${pending} pending · ${evaluated} evaluated`,
      tone: pending + evaluated > 0 ? 'danger' : 'default',
    },
    {
      label: 'Avg. blocked subjects',
      value: String(avgBlocked),
      hint: `${avgPassed} passed · ${avgEligible} eligible`,
    },
  ];

  const insights: ReportInsight[] = [];
  if (total === 0) {
    insights.push(...emptyInsight('No term evaluations have been submitted in this scope.'));
  } else {
    insights.push({
      tone: approvalRate >= 70 ? 'positive' : 'neutral',
      title: `${approvalRate}% of evaluations are approved`,
      detail: `${approved} of ${total} term evaluations have registrar or admin approval. ${evaluated} are evaluated and waiting for approval.`,
    });

    if (pending + evaluated > 0) {
      insights.push({
        tone: 'warning',
        title: `${pending + evaluated} evaluations still need follow-through`,
        detail:
          pending > 0
            ? `${pending} have not been evaluated by a head yet. Clearing this queue unblocks enrollment advising.`
            : 'Heads have evaluated these terms; registrar or admin approval is the remaining step.',
      });
    }

    const blockedByCourse = rows.reduce<Record<string, { blocked: number; count: number }>>(
      (acc, row) => {
        const current = acc[row.course] ?? { blocked: 0, count: 0 };
        current.blocked += row.blockedCount;
        current.count += 1;
        acc[row.course] = current;
        return acc;
      },
      {}
    );
    const blockedLeader = Object.entries(blockedByCourse)
      .map(([course, value]) => ({
        course,
        avg: round1(value.blocked / value.count),
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    if (blockedLeader && blockedLeader.avg > 0) {
      insights.push({
        tone: blockedLeader.avg >= 3 ? 'warning' : 'neutral',
        title: `${blockedLeader.course} has the highest blocked-subject load`,
        detail: `Evaluations in ${blockedLeader.course} average ${blockedLeader.avg} blocked subjects. Review prerequisites and failed retakes for that department.`,
      });
    }
  }

  return {
    total,
    pending,
    evaluated,
    approved,
    approvalRate,
    avgPassed,
    avgEligible,
    avgBlocked,
    byStatus,
    byCourse,
    byYear,
    kpis,
    insights,
  };
}

export function buildCurriculumAnalytics(
  rows: CurriculumReportRow[]
): CurriculumAnalytics {
  const total = rows.length;
  const activeCount = rows.filter((row) => row.isActive).length;
  const totalStudents = rows.reduce((sum, row) => sum + row.studentsCount, 0);
  const totalSubjects = rows.reduce((sum, row) => sum + row.subjectsCount, 0);

  const byProgram: CurriculumLoadRow[] = [...rows]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .map((row) => ({
      name: `${row.programCode} ${row.batchYear}`,
      students: row.studentsCount,
      subjects: row.subjectsCount,
    }));

  const statusSplit: NamedCount[] = [
    { name: 'Active', count: activeCount },
    { name: 'Inactive', count: total - activeCount },
  ];

  const kpis: ReportKpi[] = [
    {
      label: 'Curriculums',
      value: total.toLocaleString(),
      hint: `${activeCount} active versions`,
    },
    {
      label: 'Assigned students',
      value: totalStudents.toLocaleString(),
      hint: 'Mapped to a program batch',
    },
    {
      label: 'Subject offerings',
      value: totalSubjects.toLocaleString(),
      hint: 'Across listed curriculums',
    },
    {
      label: 'Avg. subjects / batch',
      value: total > 0 ? String(Math.round(totalSubjects / total)) : '0',
      hint: 'Catalog depth per version',
    },
  ];

  const insights: ReportInsight[] = [];
  if (total === 0) {
    insights.push(...emptyInsight('No curriculum versions are available in this scope.'));
  } else {
    const largest = [...rows].sort((a, b) => b.studentsCount - a.studentsCount)[0];
    insights.push({
      tone: 'neutral',
      title: `${activeCount} of ${total} curriculums are active`,
      detail: `They cover ${totalStudents} assigned students and ${totalSubjects} subject offerings.`,
    });

    if (largest && largest.studentsCount > 0) {
      insights.push({
        tone: 'positive',
        title: `${largest.programCode} ${largest.batchYear} has the largest enrollment`,
        detail: `${largest.studentsCount} students are assigned to ${largest.title} (${largest.batchLabel}).`,
      });
    }

    const inactiveWithStudents = rows.filter((row) => !row.isActive && row.studentsCount > 0);
    if (inactiveWithStudents.length > 0) {
      insights.push({
        tone: 'warning',
        title: `${inactiveWithStudents.length} inactive curriculums still have students`,
        detail: inactiveWithStudents
          .map((row) => `${row.programCode} ${row.batchYear} (${row.studentsCount})`)
          .join(', '),
      });
    }
  }

  return {
    total,
    activeCount,
    totalStudents,
    totalSubjects,
    byProgram,
    statusSplit,
    kpis,
    insights,
  };
}

export function buildPerformanceAnalytics(
  rows: PerformanceReportRow[]
): PerformanceAnalytics {
  const subjectsGraded = rows.length;
  const subjectsWithFailures = rows.filter((row) => row.failureCount > 0).length;
  const highRisk = rows.filter((row) => row.failureRate >= 30);
  const moderateRisk = rows.filter((row) => row.failureRate >= 15 && row.failureRate < 30);
  const lowRisk = rows.filter((row) => row.failureRate > 0 && row.failureRate < 15);
  const clear = rows.filter((row) => row.failureRate === 0);
  const avgFailureRate = round1(average(rows.map((row) => row.failureRate)));
  const topFailures = [...rows]
    .filter((row) => row.failureCount > 0)
    .sort((a, b) => b.failureRate - a.failureRate)
    .slice(0, 10);

  const riskBands: NamedCount[] = [
    { name: 'High', count: highRisk.length },
    { name: 'Moderate', count: moderateRisk.length },
    { name: 'Low', count: lowRisk.length },
    { name: 'Clear', count: clear.length },
  ];

  const kpis: ReportKpi[] = [
    {
      label: 'Subjects with grades',
      value: subjectsGraded.toLocaleString(),
      hint: 'Unique catalog codes',
    },
    {
      label: 'High-risk subjects',
      value: highRisk.length.toLocaleString(),
      hint: 'Failure rate 30% or higher',
      tone: highRisk.length > 0 ? 'danger' : 'gold',
    },
    {
      label: 'Avg. failure rate',
      value: `${avgFailureRate}%`,
      hint: `${subjectsWithFailures} subjects have at least one fail`,
    },
    {
      label: 'Top failure count',
      value: topFailures[0] ? String(topFailures[0].failureCount) : '0',
      hint: topFailures[0] ? topFailures[0].subjectCode : 'No failed grades',
    },
  ];

  const insights: ReportInsight[] = [];
  if (subjectsGraded === 0) {
    insights.push(...emptyInsight('No saved grades are available to analyze subject performance.'));
  } else if (subjectsWithFailures === 0) {
    insights.push({
      tone: 'positive',
      title: 'No failed grades in this scope',
      detail: `${subjectsGraded} subjects have recorded grades and none currently show a FAILED status.`,
    });
  } else {
    if (highRisk.length > 0) {
      insights.push({
        tone: 'warning',
        title: `${highRisk.length} subjects are high-risk`,
        detail: `Failure rate is 30% or higher. Prioritize advising, retake planning, and prerequisite review for ${highRisk
          .slice(0, 3)
          .map((row) => row.subjectCode)
          .join(', ')}${highRisk.length > 3 ? ', and others' : ''}.`,
      });
    }

    const leader = topFailures[0];
    if (leader) {
      insights.push({
        tone: leader.failureRate >= 30 ? 'warning' : 'neutral',
        title: `${leader.subjectCode} has the highest failure rate`,
        detail: `${leader.failureCount} of ${leader.totalEnrolled} recorded grades failed (${leader.failureRate.toFixed(1)}%). ${leader.subjectDescription}.`,
      });
    }

    insights.push({
      tone: 'neutral',
      title: `Average subject failure rate is ${avgFailureRate}%`,
      detail: `${moderateRisk.length} subjects sit in the moderate band (15–29%) and may need monitoring before they become high-risk.`,
    });
  }

  return {
    subjectsGraded,
    subjectsWithFailures,
    highRiskCount: highRisk.length,
    moderateRiskCount: moderateRisk.length,
    avgFailureRate,
    topFailures,
    riskBands,
    kpis,
    insights,
  };
}

export function buildProgressAnalytics(rows: ProgressReportRow[]): ProgressAnalytics {
  const studentCount = rows.length;
  const avgProgress = Math.round(average(rows.map((row) => row.progressPercentage)));
  const nearComplete = rows.filter((row) => row.progressPercentage >= 75).length;
  const onPace = rows.filter(
    (row) => row.progressPercentage >= 50 && row.progressPercentage < 75
  ).length;
  const developing = rows.filter(
    (row) => row.progressPercentage >= 25 && row.progressPercentage < 50
  ).length;
  const behind = rows.filter((row) => row.progressPercentage < 25).length;
  const atRiskCount = rows.filter(
    (row) => row.progressPercentage < 40 || row.failed >= 3
  ).length;

  const distribution: NamedCount[] = [
    { name: '0–24%', count: behind },
    { name: '25–49%', count: developing },
    { name: '50–74%', count: onPace },
    { name: '75–100%', count: nearComplete },
  ];

  const courseMap = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const current = courseMap.get(row.course) ?? { total: 0, count: 0 };
    current.total += row.progressPercentage;
    current.count += 1;
    courseMap.set(row.course, current);
  }
  const byCourse: CourseProgressRow[] = [...courseMap.entries()]
    .map(([course, value]) => ({
      course,
      average: Math.round(value.total / value.count),
      students: value.count,
    }))
    .sort((a, b) => a.average - b.average);

  const yearMap = new Map<number, { total: number; count: number }>();
  for (const row of rows) {
    const current = yearMap.get(row.yearLevel) ?? { total: 0, count: 0 };
    current.total += row.progressPercentage;
    current.count += 1;
    yearMap.set(row.yearLevel, current);
  }
  const byYear: NamedCount[] = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({
      name: formatYearLevelLabel(year),
      count: Math.round(value.total / value.count),
    }));

  const kpis: ReportKpi[] = [
    {
      label: 'Students tracked',
      value: studentCount.toLocaleString(),
      hint: 'With an assigned curriculum',
    },
    {
      label: 'Average completion',
      value: `${avgProgress}%`,
      hint: 'Passed subjects vs curriculum',
      tone: avgProgress >= 60 ? 'gold' : 'default',
    },
    {
      label: 'Near complete',
      value: nearComplete.toLocaleString(),
      hint: '75% or more of subjects passed',
    },
    {
      label: 'Needs advising',
      value: atRiskCount.toLocaleString(),
      hint: 'Below 40% or 3+ failed subjects',
      tone: atRiskCount > 0 ? 'danger' : 'default',
    },
  ];

  const insights: ReportInsight[] = [];
  if (studentCount === 0) {
    insights.push(
      ...emptyInsight('No students with an assigned curriculum were found in this scope.')
    );
  } else {
    insights.push({
      tone: avgProgress >= 60 ? 'positive' : 'neutral',
      title: `Average curriculum completion is ${avgProgress}%`,
      detail: `${nearComplete} students have passed at least 75% of their curriculum. ${behind} remain under 25%.`,
    });

    if (atRiskCount > 0) {
      insights.push({
        tone: 'warning',
        title: `${atRiskCount} students need closer advising`,
        detail:
          'They are below 40% completion or already have three or more failed subjects. Use Records to review failed offerings and retake plans.',
      });
    }

    const lowestCourse = byCourse[0];
    if (lowestCourse && byCourse.length > 1) {
      insights.push({
        tone: lowestCourse.average < 50 ? 'warning' : 'neutral',
        title: `${lowestCourse.course} has the lowest average progress`,
        detail: `${lowestCourse.students} students average ${lowestCourse.average}% completion. Compare with other programs to see whether curriculum load or failed subjects are the driver.`,
      });
    }
  }

  return {
    studentCount,
    avgProgress,
    nearComplete,
    onPace,
    developing,
    behind,
    atRiskCount,
    distribution,
    byCourse,
    byYear,
    kpis,
    insights,
  };
}
