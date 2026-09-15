'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ClipboardCheck } from 'lucide-react';

import { saveStudentGrades } from '@/actions/curriculum';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { cn } from '@/lib/utils';
import {
  deriveStatusFromGrade,
  formatPassingRule,
  type GradePassSettings,
} from '@/lib/grade-evaluation';
import { formatSemesterLabel, type SemesterTermValue } from '@/lib/semester-terms';

import { GradeReviewDrawer } from './grade-review-drawer';
import type { CurriculumItem, ExistingGrade, GradeStatus } from '../lib/types';
import type { EvaluationStatus } from '@/app/generated/prisma/enums';
import { isEvaluationApproved } from '@/lib/evaluation';

interface StudentEvaluationFormProps {
  studentId: string;
  curriculumId?: string;
  semester?: SemesterTermValue;
  displayTermLabel?: string;
  offerings: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
  gradePassSettings: GradePassSettings;
  evaluationStatus?: EvaluationStatus;
  isMakeupStanding?: boolean;
  onSaved?: (grades: Record<string, ExistingGrade>) => void;
}

function scheduleLabel(offering: CurriculumItem) {
  if (!offering.isRetake) return null;
  return offering.scheduleKind === 'FAILED' ? 'Retake' : 'Makeup';
}

function rowAccent(status: GradeStatus, hasGrade: boolean) {
  if (!hasGrade) return 'border-l-transparent';
  switch (status) {
    case 'PASSED':
      return 'border-l-emerald-500 bg-emerald-500/[0.03]';
    case 'FAILED':
      return 'border-l-rose-500 bg-rose-500/[0.03]';
    case 'INCOMPLETE':
      return 'border-l-amber-500 bg-amber-500/[0.03]';
    default:
      return 'border-l-muted-foreground/30';
  }
}

function buildInitialValues(
  offerings: CurriculumItem[],
  existingGrades: Record<string, ExistingGrade>
) {
  const initial: Record<string, { grade: string; status: GradeStatus }> = {};
  for (const offering of offerings) {
    if (offering.isRetake) {
      const existing = existingGrades[offering.id];
      if (offering.scheduleKind === 'FAILED' && existing?.status !== 'PASSED') {
        initial[offering.id] = { grade: '', status: 'PENDING' };
        continue;
      }
    }
    initial[offering.id] = {
      grade: existingGrades[offering.id]?.grade?.toString() || '',
      status: existingGrades[offering.id]?.status || 'PENDING',
    };
  }
  return initial;
}

export default function StudentEvaluationForm({
  studentId,
  semester,
  displayTermLabel,
  offerings,
  existingGrades,
  gradePassSettings,
  evaluationStatus = 'PENDING',
  isMakeupStanding = false,
  onSaved,
}: StudentEvaluationFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(
    () => buildInitialValues(offerings, existingGrades),
    [offerings, existingGrades]
  );

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(buildInitialValues(offerings, existingGrades));
  }, [offerings, existingGrades]);

  const isDirty = useMemo(
    () =>
      offerings.some(
        (offering) =>
          (values[offering.id]?.grade ?? '') !== (initialValues[offering.id]?.grade ?? '')
      ),
    [offerings, values, initialValues]
  );

  const stats = useMemo(() => {
    let entered = 0;
    for (const offering of offerings) {
      if (values[offering.id]?.grade?.trim()) entered += 1;
    }
    const total = offerings.length;
    const progress = total > 0 ? Math.round((entered / total) * 100) : 0;
    return { entered, total, progress };
  }, [offerings, values]);

  const termLabel = displayTermLabel || (semester ? formatSemesterLabel(semester) : null);
  const retakeOfferings = useMemo(
    () => offerings.filter((offering) => offering.isRetake),
    [offerings]
  );
  const missingRetakeCount = retakeOfferings.filter(
    (offering) => !values[offering.id]?.grade?.trim()
  ).length;

  const updateGrade = (offeringId: string, grade: string) => {
    const derived = deriveStatusFromGrade(grade, gradePassSettings);
    setValues((prev) => ({
      ...prev,
      [offeringId]: {
        ...prev[offeringId],
        grade,
        status: derived ?? prev[offeringId]?.status ?? 'PENDING',
      },
    }));
  };

  const handleSave = () => {
    setError('');
    setSuccess('');

    const grades = offerings
      .filter((offering) => !offering.isRetake || Boolean(values[offering.id]?.grade?.trim()))
      .map((offering) => ({
        curriculumSubjectId: offering.id,
        grade: values[offering.id]?.grade?.trim() || undefined,
        status: values[offering.id]?.status || 'PENDING',
      }));

    startTransition(() => {
      saveStudentGrades({ studentId, grades }).then((result) => {
        if (result?.error) {
          setError(result.error);
          setReviewOpen(false);
          return;
        }

        setSuccess(result?.success || 'Grades saved');
        onSaved?.(
          Object.fromEntries(
            offerings
              .filter(
                (offering) => !offering.isRetake || Boolean(values[offering.id]?.grade?.trim())
              )
              .map((offering) => [
                offering.id,
                {
                  grade: values[offering.id]?.grade?.trim() || null,
                  status: values[offering.id]?.status || 'PENDING',
                },
              ])
          )
        );
        router.refresh();
      });
    });
  };

  const renderGradeInput = (offeringId: string, className?: string) => (
    <Input
      type="text"
      inputMode="decimal"
      value={values[offeringId]?.grade || ''}
      onChange={(e) => updateGrade(offeringId, e.target.value)}
      placeholder={gradePassSettings.gradeScale === 'gwa' ? '1.75' : '85'}
      disabled={isPending}
      className={cn(
        'h-10 w-full max-w-[7rem] text-center text-base tabular-nums sm:h-9 sm:text-sm',
        className
      )}
      aria-label="Grade"
    />
  );

  return (
    <div className="min-w-0 space-y-4">
      <FormError message={error} />
      <FormSuccess message={success} />

      <Card className="gap-0">
        <CardHeader className="gap-4 border-b px-3 pb-4 sm:px-4 sm:pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                <BookOpen className="size-4 shrink-0 text-(--pass-red)" />
                {isMakeupStanding ? 'Makeup term grades' : 'Term grades'}
              </CardTitle>
              <CardDescription className="text-pretty">
                {isMakeupStanding
                  ? `Enter grades for leftover or failed subjects assigned to this makeup term. ${formatPassingRule(gradePassSettings)}.`
                  : `Enter your grades for this term. ${formatPassingRule(gradePassSettings)}.`}
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {termLabel ? <Badge variant="secondary">{termLabel}</Badge> : null}
            </div>
          </div>

          {offerings.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.entered} of {stats.total} subjects entered
                </span>
                <span className="font-medium tabular-nums">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-1.5" />
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-5 px-3 pb-5 pt-4 sm:px-4 sm:pt-6">
          <Alert className="border-0 bg-muted/50 shadow-none">
            <AlertDescription className="text-pretty text-sm leading-relaxed">
              {isEvaluationApproved(evaluationStatus)
                ? 'Your evaluation for this term is approved. Review and submit new grades only if you need to send it back for evaluation.'
                : evaluationStatus === 'EVALUATED'
                  ? 'Your department head has evaluated this term. Submit the grade slip to the registrar if you have not already. The registrar or admin will check and approve it.'
                  : 'Review your grades before saving. After you save, print or submit the grade slip to the registrar. You can cancel the submission if you need to edit before your department head evaluates.'}
            </AlertDescription>
          </Alert>

          {retakeOfferings.length > 0 ? (
            <Alert className="border-rose-500/40 bg-rose-500/10">
              <AlertDescription className="text-pretty text-sm leading-relaxed">
                {retakeOfferings.some((offering) => offering.scheduleKind !== 'FAILED')
                  ? isMakeupStanding
                    ? 'This makeup term is for leftover or failed subjects assigned by an administrator. Enter each grade below — they are marked Makeup or Retake.'
                    : 'An administrator assigned leftover or failed subjects to this term. Enter the grade below — they are marked Makeup or Retake.'
                  : retakeOfferings.length === 1
                    ? 'An administrator approved a failed subject for retake this term. Enter the new grade below — it is marked Retake.'
                    : `An administrator approved ${retakeOfferings.length} failed subjects for retake this term. Enter the new grades below — they are marked Retake.`}
              </AlertDescription>
            </Alert>
          ) : null}

          {offerings.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center sm:px-6 sm:py-10">
              <p className="text-sm font-medium">No subjects for this term</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isMakeupStanding
                  ? 'Ask an administrator to assign leftover or failed subjects to this makeup term under Records → Subjects to take later.'
                  : isEvaluationApproved(evaluationStatus)
                    ? 'This term is already approved. Ask an administrator to assign leftover subjects to a makeup term.'
                    : 'Subjects for your current year level and semester will appear here. After the last term is approved, leftover subjects are taken in a makeup term once an administrator assigns them.'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="-mx-3 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[7rem]">Code</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-[4.5rem] text-center">Units</TableHead>
                      <TableHead className="w-[8rem] text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerings.map((offering) => {
                      const entry = values[offering.id];
                      const hasGrade = Boolean(entry?.grade?.trim());

                      return (
                        <TableRow
                          key={offering.id}
                          className={cn(
                            'border-l-2 transition-colors',
                            rowAccent(entry?.status ?? 'PENDING', hasGrade)
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              {offering.code}
                              {offering.isRetake ? (
                                <Badge
                                  variant={
                                    offering.scheduleKind === 'FAILED'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {scheduleLabel(offering)}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{offering.description}</div>
                            <div className="text-xs text-muted-foreground">
                              Year {offering.yearLevel}
                              {offering.isRetake ? (
                                <>
                                  {' · '}
                                  <span
                                    className={
                                      offering.scheduleKind === 'FAILED'
                                        ? 'font-medium text-rose-700 dark:text-rose-300'
                                        : 'font-medium text-amber-700 dark:text-amber-300'
                                    }
                                  >
                                    {scheduleLabel(offering)}
                                  </span>
                                  {offering.previousGrade
                                    ? ` · previous ${offering.previousGrade}`
                                    : offering.scheduleKind === 'PENDING'
                                      ? ' · leftover from earlier term'
                                      : ''}
                                </>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {offering.units}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderGradeInput(offering.id)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-lg border lg:hidden">
                {offerings.map((offering) => {
                  const entry = values[offering.id];
                  const hasGrade = Boolean(entry?.grade?.trim());

                  return (
                    <div
                      key={offering.id}
                      className={cn(
                        'border-l-4 p-3 sm:p-4',
                        rowAccent(entry?.status ?? 'PENDING', hasGrade)
                      )}
                    >
                      <div className="mb-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{offering.code}</span>
                          {offering.isRetake ? (
                            <Badge
                              variant={
                                offering.scheduleKind === 'FAILED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {scheduleLabel(offering)}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="tabular-nums">
                            {offering.units} u
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-snug text-muted-foreground">
                          {offering.description}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Year {offering.yearLevel}
                          {offering.isRetake ? (
                            <>
                              {' · '}
                              <span
                                className={
                                  offering.scheduleKind === 'FAILED'
                                    ? 'font-medium text-rose-700 dark:text-rose-300'
                                    : 'font-medium text-amber-700 dark:text-amber-300'
                                }
                              >
                                {scheduleLabel(offering)}
                              </span>
                              {offering.previousGrade
                                ? ` · previous ${offering.previousGrade}`
                                : offering.scheduleKind === 'PENDING'
                                  ? ' · leftover from earlier term'
                                  : ''}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Grade</span>
                        {renderGradeInput(offering.id, 'w-full sm:max-w-[7rem]')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>

        {offerings.length > 0 ? (
          <CardFooter className="flex flex-col-reverse gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {missingRetakeCount > 0
                ? `Enter a new grade for ${missingRetakeCount === 1 ? 'the retake subject' : 'all retake subjects'} before you submit.`
                : isDirty
                  ? 'Review your grades before submitting. You can still edit until you confirm.'
                  : 'Enter or update grades, then review before you submit.'}
            </p>
            <Button
              onClick={() => {
                setError('');
                setReviewOpen(true);
              }}
              disabled={
                isPending ||
                offerings.length === 0 ||
                stats.entered === 0 ||
                missingRetakeCount > 0
              }
              className="h-11 w-full touch-manipulation shadow-sm sm:h-9 sm:w-auto sm:min-w-[10.5rem]"
            >
              <ClipboardCheck className="size-4" />
              Review grades
            </Button>
          </CardFooter>
        ) : null}
      </Card>

      <GradeReviewDrawer
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        offerings={offerings}
        values={values}
        isPending={isPending}
        onConfirm={handleSave}
      />
    </div>
  );
}
