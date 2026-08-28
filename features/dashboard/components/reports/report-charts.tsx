'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type {
  CourseEvaluationBreakdown,
  CourseProgressRow,
  CurriculumLoadRow,
  NamedCount,
  PerformanceReportRow,
} from '@/features/dashboard/lib/report-types';

const evaluationStatusConfig = {
  Approved: { label: 'Approved', color: 'var(--chart-1)' },
  Evaluated: { label: 'Evaluated', color: 'var(--chart-5)' },
  Pending: { label: 'Pending', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const courseEvaluationConfig = {
  Approved: { label: 'Approved', color: 'var(--chart-1)' },
  Evaluated: { label: 'Evaluated', color: 'var(--chart-5)' },
  Pending: { label: 'Pending', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const curriculumLoadConfig = {
  students: { label: 'Students', color: 'var(--chart-1)' },
  subjects: { label: 'Subjects', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const curriculumStatusConfig = {
  Active: { label: 'Active', color: 'var(--chart-2)' },
  Inactive: { label: 'Inactive', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const riskConfig = {
  High: { label: 'High (≥30%)', color: 'var(--destructive)' },
  Moderate: { label: 'Moderate (15–29%)', color: 'oklch(0.75 0.15 85)' },
  Low: { label: 'Low (<15%)', color: 'var(--chart-5)' },
  Clear: { label: 'No failures', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const failureRateConfig = {
  failureRate: { label: 'Failure rate %', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const progressDistConfig = {
  count: { label: 'Students', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const courseProgressConfig = {
  average: { label: 'Average %', color: 'var(--chart-4)' },
} satisfies ChartConfig;

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function EvaluationStatusPie({ data }: { data: NamedCount[] }) {
  if (data.every((item) => item.count === 0)) {
    return <EmptyChart message="No evaluation records yet" />;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartContainer config={evaluationStatusConfig} className="mx-auto aspect-square max-h-[280px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-2xl font-bold"
        >
          {total}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-xs"
        >
          terms
        </text>
      </PieChart>
    </ChartContainer>
  );
}

export function EvaluationsByCourseChart({ data }: { data: CourseEvaluationBreakdown[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No evaluations by course yet" />;
  }

  return (
    <ChartContainer config={courseEvaluationConfig} className="aspect-[4/3] w-full min-h-[240px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="course" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="Approved" stackId="a" fill="var(--color-Approved)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Evaluated" stackId="a" fill="var(--color-Evaluated)" />
        <Bar dataKey="Pending" stackId="a" fill="var(--color-Pending)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function NamedCountBarChart({
  data,
  emptyMessage,
  seriesLabel = 'Count',
  unit,
}: {
  data: NamedCount[];
  emptyMessage: string;
  seriesLabel?: string;
  unit?: string;
}) {
  if (data.length === 0 || data.every((item) => item.count === 0)) {
    return <EmptyChart message={emptyMessage} />;
  }

  const config = {
    count: { label: seriesLabel, color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-[4/3] w-full min-h-[220px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={unit ? 40 : 32}
          fontSize={11}
          unit={unit}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function CurriculumLoadChart({ data }: { data: CurriculumLoadRow[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No curriculum records yet" />;
  }

  return (
    <ChartContainer config={curriculumLoadConfig} className="aspect-[5/3] w-full min-h-[260px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="subjects" fill="var(--color-subjects)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function CurriculumStatusPie({ data }: { data: NamedCount[] }) {
  if (data.every((item) => item.count === 0)) {
    return <EmptyChart message="No curriculum records yet" />;
  }

  return (
    <ChartContainer config={curriculumStatusConfig} className="mx-auto aspect-square max-h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function RiskBandPie({ data }: { data: NamedCount[] }) {
  if (data.every((item) => item.count === 0)) {
    return <EmptyChart message="No graded subjects yet" />;
  }

  return (
    <ChartContainer config={riskConfig} className="mx-auto aspect-square max-h-[280px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function FailureRateChart({ data }: { data: PerformanceReportRow[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No failed grades recorded yet" />;
  }

  const chartData = data.slice(0, 10).map((row) => ({
    name: row.subjectCode,
    failureRate: Number(row.failureRate.toFixed(1)),
  }));

  return (
    <ChartContainer config={failureRateConfig} className="aspect-[5/3] w-full min-h-[280px]">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} unit="%" />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={72}
          fontSize={11}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="failureRate" fill="var(--color-failureRate)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function ProgressDistributionChart({ data }: { data: NamedCount[] }) {
  if (data.every((item) => item.count === 0)) {
    return <EmptyChart message="No student progress to chart" />;
  }

  return (
    <ChartContainer config={progressDistConfig} className="aspect-[4/3] w-full min-h-[240px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function CourseProgressChart({ data }: { data: CourseProgressRow[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No course progress yet" />;
  }

  return (
    <ChartContainer config={courseProgressConfig} className="aspect-[4/3] w-full min-h-[240px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="course" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} fontSize={11} unit="%" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="average" fill="var(--color-average)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
