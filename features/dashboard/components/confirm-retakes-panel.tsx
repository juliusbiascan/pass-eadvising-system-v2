'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  clearFailedSubjectRetake,
  confirmFailedSubjectRetake,
} from '@/actions/subject-retake';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatRetakeScheduleLabel,
  formatSubjectScheduleReason,
  formatTermRef,
  resolveRetakeTargetTerm,
  type FailedSubjectRetakeRow,
  type RetakeScheduleValue,
} from '@/lib/subject-retake-helpers';
import { formatSemesterLabel } from '@/lib/semester-terms';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import type { SemesterTerm } from '@/app/generated/prisma/enums';

type ConfirmRetakesPanelProps = {
  studentId: string;
  studentYearLevel: number;
  studentSemester: SemesterTerm;
  maxYearLevel: number;
  failedSubjects: FailedSubjectRetakeRow[];
};

export function ConfirmRetakesPanel({
  studentId,
  studentYearLevel,
  studentSemester,
  maxYearLevel,
  failedSubjects,
}: ConfirmRetakesPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [activeSubject, setActiveSubject] = useState<FailedSubjectRetakeRow | null>(null);
  const [schedule, setSchedule] = useState<RetakeScheduleValue>('NEXT_SEMESTER');
  const [isPending, startTransition] = useTransition();

  const previewTarget = useMemo(() => {
    if (!activeSubject) return null;
    return resolveRetakeTargetTerm({
      schedule,
      failedYearLevel: activeSubject.failedYearLevel,
      failedSemester: activeSubject.failedSemester,
      studentYearLevel,
      studentSemester,
      maxYearLevel,
    });
  }, [activeSubject, schedule, studentYearLevel, studentSemester, maxYearLevel]);

  if (failedSubjects.length === 0) {
    return null;
  }

  const handleConfirm = () => {
    if (!activeSubject) return;
    setError('');
    setSuccess('');

    startTransition(() => {
      confirmFailedSubjectRetake({
        studentId,
        curriculumSubjectId: activeSubject.curriculumSubjectId,
        schedule,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success);
        setActiveSubject(null);
        router.refresh();
      });
    });
  };

  const handleClear = (subject: FailedSubjectRetakeRow) => {
    setError('');
    setSuccess('');

    startTransition(() => {
      clearFailedSubjectRetake({
        studentId,
        curriculumSubjectId: subject.curriculumSubjectId,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success);
        router.refresh();
      });
    });
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Subjects to take later</CardTitle>
        <CardDescription>
          Failed subjects and unfinished subjects from an earlier term (for example 1st
          semester leftovers after a shift) can be assigned to next semester or next year.
          Confirmed subjects appear on the student grade form for that term.
        </CardDescription>
      </CardHeader>
      {(error || success) && (
        <CardContent className="space-y-3">
          <FormError message={error} />
          <FormSuccess message={success} />
        </CardContent>
      )}
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Subject</TableHead>
              <TableHead>Original term</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failedSubjects.map((subject) => {
              const confirmed = subject.retake?.status === 'CONFIRMED';

              return (
                <TableRow key={subject.curriculumSubjectId}>
                  <TableCell className="pl-4">
                    <div className="min-w-[160px] max-w-[260px]">
                      <p className="font-medium">{subject.code}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {subject.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[110px]">
                      <p className="font-medium">
                        {formatYearLevelLabel(subject.failedYearLevel)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSemesterLabel(subject.failedSemester)}
                        {subject.grade ? ` · Grade ${subject.grade}` : ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={subject.reason === 'FAILED' ? 'destructive' : 'secondary'}
                    >
                      {formatSubjectScheduleReason(subject.reason)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {confirmed ? (
                      <div className="space-y-1">
                        <Badge>
                          {subject.reason === 'FAILED' ? 'Retake' : 'Makeup'}{' '}
                          {formatTermRef({
                            yearLevel: subject.retake!.targetYearLevel,
                            semester: subject.retake!.targetSemester,
                          })}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatRetakeScheduleLabel(subject.retake!.schedule)}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="destructive">Awaiting confirmation</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-2">
                      {confirmed ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleClear(subject)}
                        >
                          Clear
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          setSchedule(subject.retake?.schedule ?? 'NEXT_SEMESTER');
                          setActiveSubject(subject);
                        }}
                      >
                        {confirmed ? 'Change term' : 'Assign term'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog
        open={activeSubject !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setActiveSubject(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeSubject?.reason === 'FAILED' ? 'Confirm retake' : 'Assign leftover subject'}
            </DialogTitle>
            <DialogDescription>
              {activeSubject
                ? `Choose when ${activeSubject.code} may be taken. It will show on the student grade form for the selected term.`
                : 'Choose when this subject may be taken.'}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={schedule}
            onValueChange={(value) => setSchedule(value as RetakeScheduleValue)}
            className="gap-3"
          >
            <Label
              htmlFor="retake-next-semester"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
            >
              <RadioGroupItem id="retake-next-semester" value="NEXT_SEMESTER" className="mt-0.5" />
              <span>
                <span className="block font-medium">Next semester</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  The following term after the original subject term. For a 1st semester
                  leftover while the student is already in 2nd semester, that is this
                  current term.
                </span>
              </span>
            </Label>
            <Label
              htmlFor="retake-next-year"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
            >
              <RadioGroupItem id="retake-next-year" value="NEXT_YEAR" className="mt-0.5" />
              <span>
                <span className="block font-medium">Next year</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Same semester in the next year level, when the subject is typically offered again.
                </span>
              </span>
            </Label>
          </RadioGroup>

          {previewTarget ? (
            <p className="text-sm text-muted-foreground">
              This subject will appear on the student grade form in{' '}
              <strong className="text-foreground">{formatTermRef(previewTarget)}</strong>.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setActiveSubject(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={handleConfirm}>
              {isPending ? 'Saving...' : 'Save assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
