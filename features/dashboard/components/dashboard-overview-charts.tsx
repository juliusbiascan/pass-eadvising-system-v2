'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const evaluationStatusConfig = {
  Approved: { label: 'Approved', color: 'var(--chart-1)' },
  Evaluated: { label: 'Evaluated', color: 'var(--chart-3)' },
  Pending: { label: 'Pending', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const gradeStatusConfig = {
  Passed: { label: 'Passed', color: 'oklch(0.55 0.15 145)' },
  Failed: { label: 'Failed', color: 'var(--destructive)' },
  Incomplete: { label: 'Incomplete', color: 'oklch(0.75 0.15 85)' },
  Pending: { label: 'Pending', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const yearLevelConfig = {
  count: { label: 'Students', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const semesterConfig = {
  count: { label: 'Students', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const curriculumConfig = {
  completed: { label: 'Completed (current term)', color: 'var(--chart-1)' },
  pending: { label: 'Pending (current term)', color: 'var(--chart-5)' },
} satisfies ChartConfig;

type EvaluationStatusChartProps = {
  data: Array<{ status: string; count: number }>;
};

export function EvaluationStatusChart({ data }: EvaluationStatusChartProps) {
  if (data.every((d) => d.count === 0)) {
    return <EmptyChart message="No evaluation records yet" />;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ChartContainer config={evaluationStatusConfig} className="mx-auto aspect-square max-h-[280px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={`var(--color-${entry.status})`}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
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

type SimpleBarChartProps = {
  data: Array<{ label: string; count: number }>;
  config: ChartConfig;
  dataKey?: string;
};

function SimpleBarChart({ data, config, dataKey = 'count' }: SimpleBarChartProps) {
  if (data.length === 0) {
    return <EmptyChart message="No data yet" />;
  }

  return (
    <ChartContainer config={config} className="aspect-[4/3] w-full min-h-[220px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey={dataKey} fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function StudentsByYearChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return <SimpleBarChart data={data} config={yearLevelConfig} />;
}

export function StudentsBySemesterChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return <SimpleBarChart data={data} config={semesterConfig} />;
}

export function GradeStatusChart({
  data,
}: {
  data: Array<{ status: string; count: number }>;
}) {
  if (data.every((d) => d.count === 0)) {
    return <EmptyChart message="No grades recorded yet" />;
  }

  return (
    <ChartContainer config={gradeStatusConfig} className="aspect-[4/3] w-full min-h-[220px]">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          type="category"
          dataKey="status"
          tickLine={false}
          axisLine={false}
          width={72}
          fontSize={11}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={`var(--color-${entry.status})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

type CurriculumProgressChartProps = {
  data: Array<{
    name: string;
    completed: number;
    pending: number;
    total: number;
    rate: number;
  }>;
};

export function CurriculumProgressBarChart({ data }: CurriculumProgressChartProps) {
  if (data.every((d) => d.total === 0)) {
    return <EmptyChart message="No students assigned to active curriculums" />;
  }

  return (
    <ChartContainer config={curriculumConfig} className="aspect-[5/3] w-full min-h-[260px]">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} fontSize={11} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-medium">
                  {value} {name === 'completed' ? 'completed' : 'pending'}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}
