import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import type { ReportInsight } from '@/features/dashboard/lib/report-types';
import { cn } from '@/lib/utils';

const toneStyles = {
  positive: 'border-(--pass-gold)/35 bg-(--pass-gold)/10',
  warning: 'border-(--pass-red)/25 bg-(--pass-red)/6',
  neutral: 'border-border/80 bg-muted/40',
} as const;

const toneIcons = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  neutral: Info,
} as const;

export function ReportInsights({ insights }: { insights: ReportInsight[] }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight">Analysis</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        What the figures mean for advising and follow-up
      </p>
      <ul className="mt-4 space-y-3">
        {insights.map((insight) => {
          const Icon = toneIcons[insight.tone];
          return (
            <li
              key={insight.title}
              className={cn('rounded-xl border px-3.5 py-3', toneStyles[insight.tone])}
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {insight.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
