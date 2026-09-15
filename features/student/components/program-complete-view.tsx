import { BadgeCheck, PartyPopper, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface ProgramCompleteViewProps {
  studentName: string;
  course: string;
  passedCount: number;
}

export function ProgramCompleteView({
  studentName,
  course,
  passedCount,
}: ProgramCompleteViewProps) {
  const firstName = studentName.split(' ')[0] || studentName;

  return (
    <Card className="overflow-hidden border-(--pass-gold)/40">
      <CardContent className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-(--pass-orb-gold) blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-8 size-44 rounded-full bg-(--pass-orb-red) blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-lg text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-(--pass-gold)/20 text-(--pass-red) ring-1 ring-(--pass-gold)/40">
            <PartyPopper className="size-7" aria-hidden />
          </span>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--pass-red)">
            Program complete
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Congratulations, {firstName}
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every term is approved and you passed all {passedCount}{' '}
            {passedCount === 1 ? 'subject' : 'subjects'} in your {course} curriculum.
            There are no more grades to enter.
          </p>

          <ul className="mt-6 flex flex-col items-center gap-2 text-sm sm:flex-row sm:justify-center sm:gap-3">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 font-medium">
              <BadgeCheck className="size-3.5 text-emerald-600" aria-hidden />
              All terms approved
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 font-medium">
              <Sparkles className="size-3.5 text-(--pass-gold)" aria-hidden />
              All subjects passed
            </li>
          </ul>

          <p className="mt-6 text-pretty text-xs text-muted-foreground sm:text-sm">
            Confirm remaining graduation requirements and clearance with the registrar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
