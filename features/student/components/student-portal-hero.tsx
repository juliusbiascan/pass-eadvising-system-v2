import { Hash, Layers, Sparkles } from 'lucide-react';

import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

import type { StudentPortalStudent } from '../lib/types';

interface StudentPortalHeroProps {
  student: StudentPortalStudent;
  progressPct: number;
  currentTermLabel: string;
  maxYearLevel?: number;
  isProgramComplete?: boolean;
}

export function StudentPortalHero({
  student,
  progressPct,
  currentTermLabel,
  maxYearLevel,
  isProgramComplete = false,
}: StudentPortalHeroProps) {
  const firstName = student.fullName.split(' ')[0] || student.fullName;
  const isMakeup = !isProgramComplete && maxYearLevel != null && student.yearLevel > maxYearLevel;
  const standingLabel = isProgramComplete
    ? 'Program complete'
    : isMakeup
      ? 'Makeup term'
      : `Year ${student.yearLevel}`;
  const termChip = isProgramComplete
    ? 'All terms approved'
    : isMakeup
      ? `${formatYearLevelLabel(student.yearLevel)} • ${formatSemesterLabel(student.currentSemester)}`
      : currentTermLabel || student.currentSemester;

  return (
    <section className="student-portal-fade-up relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-(--pass-orb-red) blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-8 size-44 rounded-full bg-(--pass-orb-gold) blur-3xl"
        aria-hidden
      />
      <span
        className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-(--pass-red) via-(--pass-gold) to-(--pass-red)"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--pass-red)">
            {isProgramComplete ? 'Congratulations' : 'Welcome back'}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{student.course}</p>

          <ul className="mt-3 flex flex-wrap gap-2">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium">
              <Hash className="size-3 text-(--pass-red)" aria-hidden />
              {student.studentId}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium">
              <Layers className="size-3 text-(--pass-gold)" aria-hidden />
              {standingLabel}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium">
              <Sparkles className="size-3 text-(--pass-red)" aria-hidden />
              {termChip}
            </li>
          </ul>
        </div>

        <div className="w-full shrink-0 sm:max-w-[13rem]">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Curriculum progress</p>
            <p className="text-sm font-semibold tabular-nums text-(--pass-red)">{progressPct}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="student-portal-progress h-full rounded-full bg-linear-to-r from-(--pass-red) to-(--pass-gold)"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
