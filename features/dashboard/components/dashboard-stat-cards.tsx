import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type DashboardStats = {
  totalStudents: number;
  totalCurriculums: number;
  totalSubjects: number;
  completedEvaluations: number;
  pendingEvaluations: number;
};

const statConfig: Array<{
  key: keyof DashboardStats;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    key: 'totalStudents',
    label: 'Students',
    description: 'Enrolled in system',
    icon: GraduationCap,
    accent: 'bg-(--pass-gold)/15 text-(--pass-cod) dark:text-(--pass-gold)',
  },
  {
    key: 'totalCurriculums',
    label: 'Curriculums',
    description: 'Active program batches',
    icon: Layers,
    accent: 'bg-(--pass-red)/10 text-(--pass-red)',
  },
  {
    key: 'totalSubjects',
    label: 'Catalog subjects',
    description: 'Unique subject codes',
    icon: BookOpen,
    accent: 'bg-(--pass-cod)/10 text-(--pass-cod) dark:bg-white/10 dark:text-(--pass-iron)',
  },
  {
    key: 'completedEvaluations',
    label: 'Approved terms',
    description: 'Registrar / admin approved',
    icon: CheckCircle2,
    accent: 'bg-(--pass-gold)/15 text-(--pass-cod) dark:text-(--pass-gold)',
  },
  {
    key: 'pendingEvaluations',
    label: 'Awaiting approval',
    description: 'Pending head or registrar',
    icon: Clock,
    accent: 'bg-(--pass-red)/10 text-(--pass-red)',
  },
];

export function DashboardStatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {statConfig.map(({ key, label, description, icon: Icon, accent }) => (
        <div
          key={key}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm',
            'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {stats[key].toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                accent
              )}
            >
              <Icon className="size-5" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
