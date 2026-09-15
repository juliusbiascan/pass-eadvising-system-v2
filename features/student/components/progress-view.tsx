import { CalendarCheck, Clock3, GraduationCap } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSemesterLabel } from '@/lib/semester-terms';

import { buildGraduationOutlook } from '../lib/graduation-outlook';
import type { CurriculumItem, EvaluationSubject } from '../lib/types';

interface ProgressViewProps {
  yearLevel: number;
  maxYearLevel: number;
  curriculumData: CurriculumItem[];
  gradeStats: {
    passed: CurriculumItem[];
    failed: CurriculumItem[];
    incomplete: CurriculumItem[];
    progressPct: number;
  };
  activeSemester: string;
  nextEnrollmentLabel: string | null;
  eligibleSubjects: EvaluationSubject[];
  isMakeupStanding?: boolean;
  isProgramComplete?: boolean;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-lg font-semibold tabular-nums sm:text-2xl">{value}</div>
    </div>
  );
}

function SubjectList({
  items,
  emptyMessage,
}: {
  items: Array<{ id: string; code: string; description: string }>;
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/80 bg-background/60 p-3">
          <div className="font-medium">{item.code}</div>
          <div className="text-muted-foreground">{item.description}</div>
        </li>
      ))}
    </ul>
  );
}

export function ProgressView({
  yearLevel,
  maxYearLevel,
  curriculumData,
  gradeStats,
  activeSemester,
  nextEnrollmentLabel,
  eligibleSubjects,
  isMakeupStanding = false,
  isProgramComplete = false,
}: ProgressViewProps) {
  const resolveSubjects = [...gradeStats.failed, ...gradeStats.incomplete];
  const outlook = buildGraduationOutlook({
    yearLevel,
    semester: activeSemester,
    maxYearLevel,
  });
  const programPct = Math.round((outlook.currentTermIndex / outlook.programSemesters) * 100);
  const delayCount = resolveSubjects.length;
  const showMakeupPath =
    !isProgramComplete && (isMakeupStanding || (outlook.isComplete && delayCount > 0));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-4 shrink-0 text-(--pass-red)" />
            Path to graduation
          </CardTitle>
          <CardDescription>
            Remaining years and semesters if you stay on track with your curriculum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-(--pass-gold)/35 bg-(--pass-gold)/10 p-4">
            {isProgramComplete ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--pass-red)">
                  Congratulations
                </p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-xl">
                  You passed every subject in this curriculum.
                </p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  All terms are approved. Confirm remaining requirements with the registrar before
                  graduation clearance.
                </p>
              </>
            ) : showMakeupPath || outlook.isComplete ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--pass-red)">
                  {showMakeupPath ? 'Makeup term' : 'Program complete'}
                </p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-xl">
                  {showMakeupPath
                    ? 'You are taking leftover or failed subjects after the last curriculum term.'
                    : 'You have reached the end of this curriculum.'}
                </p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  {showMakeupPath
                    ? 'Enter makeup or retake grades under Grades after an administrator assigns them. Confirm remaining requirements with an administrator before graduation clearance.'
                    : 'Confirm remaining requirements with an administrator before graduation clearance.'}
                </p>
              </>
            ) : outlook.isOnFinalTerm ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--pass-red)">
                  Final semester
                </p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-xl">
                  On track to graduate after {outlook.graduationTermLabel}
                </p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  This is your last term in the program. Pass remaining subjects this semester to
                  finish on time.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--pass-red)">
                  Expected graduation
                </p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-xl">
                  After {outlook.graduationTermLabel}
                </p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  About {outlook.remainingLabel} remaining, including the term you are in now.
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Program terms</span>
              <span className="font-medium tabular-nums">
                Term {outlook.currentTermIndex} of {outlook.programSemesters}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-linear-to-r from-(--pass-red) to-(--pass-gold)"
                style={{ width: `${Math.min(100, Math.max(0, programPct))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Program length" value={`${outlook.programYears} yrs`} />
            <StatCard label="Years left" value={outlook.isComplete ? 0 : outlook.remainingYears} />
            <StatCard
              label="Semesters left"
              value={outlook.isComplete ? 0 : outlook.remainingSemesters}
            />
            <StatCard
              label="You are in"
              value={
                yearLevel > maxYearLevel
                  ? 'Makeup'
                  : `Y${yearLevel} ${formatSemesterLabel(activeSemester)}`
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl border border-border/80 bg-background/60 p-3">
              <CalendarCheck className="mt-0.5 size-4 shrink-0 text-(--pass-gold)" />
              <div className="min-w-0">
                <p className="text-sm font-medium">When you graduate</p>
                <p className="mt-0.5 text-pretty text-sm text-muted-foreground">
                  {outlook.isComplete
                    ? 'Curriculum years are complete. Ask admin about clearance.'
                    : `Finish after ${outlook.graduationTermLabel} if you pass remaining subjects on schedule.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/80 bg-background/60 p-3">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-(--pass-red)" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Time remaining</p>
                <p className="mt-0.5 text-pretty text-sm text-muted-foreground">
                  {outlook.isComplete
                    ? 'No curriculum terms left on this program map.'
                    : `${outlook.remainingLabel} left (${outlook.remainingSemesters} semester${outlook.remainingSemesters === 1 ? '' : 's'}), including this term.`}
                </p>
              </div>
            </div>
          </div>

          {delayCount > 0 ? (
            <p className="text-pretty text-xs text-muted-foreground">
              You have {delayCount} failed or incomplete {delayCount === 1 ? 'subject' : 'subjects'}.
              Retakes can add extra semesters before graduation.
            </p>
          ) : (
            <p className="text-pretty text-xs text-muted-foreground">
              This estimate assumes you pass each remaining term. Official graduation still depends
              on evaluation and registrar clearance.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic progress</CardTitle>
          <CardDescription>
            Completion across all subjects from Year 1 through your current year level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Completion</div>
            <div className="text-sm font-medium tabular-nums">{gradeStats.progressPct}%</div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="student-portal-progress h-2 rounded-full bg-linear-to-r from-(--pass-red) to-(--pass-gold)"
              style={{ width: `${gradeStats.progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total subjects" value={curriculumData.length} />
            <StatCard label="Passed" value={gradeStats.passed.length} />
            <StatCard
              label="Remaining"
              value={curriculumData.length - gradeStats.passed.length}
            />
            <StatCard label="Current semester" value={formatSemesterLabel(activeSemester)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study plan (recommended focus)</CardTitle>
          <CardDescription>
            Prioritize failed or incomplete subjects, then work through eligible subjects for your
            next term.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">1) Resolve failed / incomplete</div>
            <SubjectList
              items={resolveSubjects.slice(0, 12)}
              emptyMessage="No failed or incomplete subjects."
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">
              2) Take eligible subjects next
              {nextEnrollmentLabel ? ` (${nextEnrollmentLabel})` : ''}
            </div>
            <SubjectList
              items={eligibleSubjects.slice(0, 12)}
              emptyMessage="No eligible subjects yet. Save grades and wait for admin to complete your evaluation."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
