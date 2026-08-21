import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatSemesterLabel } from '@/lib/semester-terms';
import type { SemesterTermValue } from '@/lib/semester-terms';

type RecentEvaluation = {
  studentId: string;
  fullName: string;
  course: string;
  evaluationStatus: string;
  yearLevel?: number;
  semester?: string;
  completedAt?: string;
};

export function DashboardRecentEvaluations({ data }: { data: RecentEvaluation[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No evaluation activity yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {data.map((record, index) => {
        const termLabel =
          record.yearLevel != null && record.semester
            ? `Y${record.yearLevel} · ${formatSemesterLabel(record.semester as SemesterTermValue)}`
            : null;
        const dateLabel = record.completedAt
          ? new Date(record.completedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : null;

        return (
          <li
            key={`${record.studentId}-${record.completedAt}-${index}`}
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{record.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {record.studentId}
                {termLabel ? ` · ${termLabel}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge
                variant={record.evaluationStatus === 'COMPLETED' ? 'default' : 'secondary'}
                className="text-[10px]"
              >
                {record.evaluationStatus === 'COMPLETED'
                  ? 'Approved'
                  : record.evaluationStatus === 'EVALUATED'
                    ? 'Evaluated'
                    : 'Pending'}
              </Badge>
              {dateLabel ? (
                <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardRecentEvaluationsFooter() {
  return (
    <Link
      href="/dashboard/reports"
      className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      View all reports
      <ArrowRight className="size-3" aria-hidden />
    </Link>
  );
}
