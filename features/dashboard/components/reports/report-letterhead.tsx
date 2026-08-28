import Image from 'next/image';

import { schoolBrand } from '@/config/school';
import { cn } from '@/lib/utils';

type ReportLetterheadProps = {
  title: string;
  generatedAt: string;
  scopeLabel: string;
  roleLabel: string;
  className?: string;
};

function formatReportDate(iso: string) {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ReportLetterhead({
  title,
  generatedAt,
  scopeLabel,
  roleLabel,
  className,
}: ReportLetterheadProps) {
  return (
    <header
      className={cn(
        'report-letterhead overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none',
        className
      )}
    >
      <div className="h-1.5 bg-linear-to-r from-(--pass-red) via-(--pass-gold) to-(--pass-red)" />
      <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          <span className="relative shrink-0">
            <span
              className="absolute inset-0 rounded-2xl bg-(--pass-gold)/45 blur-md print:hidden"
              aria-hidden
            />
            <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-(--pass-gold)/45 print:ring-black/20">
              <Image
                src={schoolBrand.logoSrcLarge}
                alt={schoolBrand.logoAlt}
                width={64}
                height={64}
                className="size-14 object-contain"
                priority
              />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--pass-red)">
              {schoolBrand.name}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-(--pass-cod) dark:text-(--pass-iron) sm:text-xl">
              {schoolBrand.systemName}
            </p>
            <p className="text-xs text-muted-foreground">
              {schoolBrand.address} · {schoolBrand.locality}
            </p>
          </div>
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated {formatReportDate(generatedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Scope: {scopeLabel} · {roleLabel}
          </p>
        </div>
      </div>
    </header>
  );
}
