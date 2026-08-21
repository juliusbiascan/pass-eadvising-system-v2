import { cn } from '@/lib/utils';

import type { GradeStatus } from '../lib/types';

const statusStyles: Record<GradeStatus, string> = {
  PASSED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  FAILED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  INCOMPLETE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  PENDING: 'bg-muted text-muted-foreground',
};

interface GradeStatusBadgeProps {
  status: GradeStatus;
  className?: string;
}

export function GradeStatusBadge({ status, className }: GradeStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
