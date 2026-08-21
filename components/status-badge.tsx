import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EVALUATION_STATUS_LABEL } from '@/lib/evaluation';
import type { EvaluationStatus, GradeStatus } from '@/app/generated/prisma/enums';

export const GRADE_STATUS_LABEL: Record<GradeStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  INCOMPLETE: 'Incomplete',
  PENDING: 'Pending',
};

export const GRADE_STATUS_BADGE_CLASS: Record<GradeStatus, string> = {
  PASSED:
    'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  FAILED:
    'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  INCOMPLETE:
    'border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  PENDING:
    'border-transparent bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
};

export const GRADE_STATUS_TRIGGER_CLASS: Record<GradeStatus, string> = {
  PASSED:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  FAILED: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  INCOMPLETE:
    'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  PENDING:
    'border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

export const GRADE_STATUS_DOT_CLASS: Record<GradeStatus, string> = {
  PASSED: 'bg-emerald-500',
  FAILED: 'bg-rose-500',
  INCOMPLETE: 'bg-amber-500',
  PENDING: 'bg-slate-400',
};

export const EVALUATION_STATUS_BADGE_CLASS: Record<EvaluationStatus, string> = {
  COMPLETED:
    'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  EVALUATED:
    'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  PENDING:
    'border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
};

export const RESULT_STATUS_BADGE_CLASS = {
  passed:
    'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  eligible:
    'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  blocked:
    'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
} as const;

interface GradeStatusBadgeProps {
  status: GradeStatus;
  className?: string;
}

export function GradeStatusBadge({ status, className }: GradeStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(GRADE_STATUS_BADGE_CLASS[status], className)}>
      {GRADE_STATUS_LABEL[status]}
    </Badge>
  );
}

interface EvaluationStatusBadgeProps {
  status: EvaluationStatus;
  className?: string;
  children?: ReactNode;
}

export function EvaluationStatusBadge({
  status,
  className,
  children,
}: EvaluationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(EVALUATION_STATUS_BADGE_CLASS[status], className)}
    >
      {children ?? EVALUATION_STATUS_LABEL[status]}
    </Badge>
  );
}
