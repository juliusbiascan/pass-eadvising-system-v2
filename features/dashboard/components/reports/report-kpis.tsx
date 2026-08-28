import { cn } from '@/lib/utils';

import type { ReportKpi } from '@/features/dashboard/lib/report-types';

export function ReportKpiGrid({ items }: { items: ReportKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-2xl border border-border/80 bg-card p-4 shadow-sm',
            item.tone === 'gold' && 'border-(--pass-gold)/40 bg-(--pass-gold)/8',
            item.tone === 'danger' && 'border-(--pass-red)/25 bg-(--pass-red)/6'
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
