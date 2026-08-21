'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  formatEvaluationDate,
  todayDateInputValue,
} from '@/lib/evaluation';

export type EvaluationReviewSubject = {
  id: string;
  code: string;
  description: string;
  percent?: number;
};

export type EvaluationReview = {
  passed: EvaluationReviewSubject[];
  eligible: EvaluationReviewSubject[];
  blocked: EvaluationReviewSubject[];
};

export type GradeStatusCounts = {
  passed: number;
  failed: number;
  incomplete: number;
  pending: number;
};

export type EvaluationActionMode = 'evaluate' | 'approve';

export type CompleteEvaluationPayload = {
  completedByName: string;
  actionDate: string;
  remarks?: string;
  confirmed: true;
};

interface CompleteEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EvaluationActionMode;
  studentName?: string;
  studentCourse?: string;
  termLabel: string;
  nextEnrollmentLabel?: string | null;
  review?: EvaluationReview;
  gradeCounts: GradeStatusCounts;
  defaultCompleterName?: string;
  lockEvaluatorPosition?: {
    type: 'ADMIN' | 'HEAD';
    courseCode?: string;
  };
  evaluatedByName?: string | null;
  evaluatedByPosition?: string | null;
  evaluatedAt?: Date | string | null;
  isPending: boolean;
  error?: string;
  onConfirm: (payload: CompleteEvaluationPayload) => void;
}

function ReviewList({
  title,
  items,
  empty,
}: {
  title: string;
  items: EvaluationReviewSubject[];
  empty: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">
        {title} ({items.length})
      </p>
      {items.length ? (
        <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
          {items.map((item) => (
            <li key={item.id}>
              {item.code} — {item.description}
              {item.percent !== undefined ? ` (${item.percent}% prereqs)` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

export function CompleteEvaluationDialog({
  open,
  onOpenChange,
  mode,
  studentName,
  studentCourse,
  termLabel,
  nextEnrollmentLabel,
  review,
  gradeCounts,
  defaultCompleterName = '',
  lockEvaluatorPosition,
  evaluatedByName,
  evaluatedByPosition,
  evaluatedAt,
  isPending,
  error,
  onConfirm,
}: CompleteEvaluationDialogProps) {
  const isApprove = mode === 'approve';
  const [completedByName, setCompletedByName] = useState(defaultCompleterName);
  const [actionDate, setActionDate] = useState(todayDateInputValue());
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCompletedByName(defaultCompleterName);
    setActionDate(todayDateInputValue());
    setRemarks('');
    setConfirmed(false);
    setFormError('');
  }, [open, defaultCompleterName]);

  const unfinished = gradeCounts.pending + gradeCounts.incomplete;
  const positionLabel = isApprove
    ? 'Registrar / Admin'
    : `Head of ${lockEvaluatorPosition?.courseCode || studentCourse || 'course'}`;
  const evaluatedOn = formatEvaluationDate(evaluatedAt);

  const handleConfirm = () => {
    setFormError('');
    const name = completedByName.trim();
    if (name.length < 2) {
      setFormError(
        isApprove
          ? 'Enter the name of the person who approved this evaluation.'
          : 'Enter the name of the person who evaluated this term.'
      );
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(actionDate)) {
      setFormError(isApprove ? 'Select the approval date.' : 'Select the evaluation date.');
      return;
    }
    if (!confirmed) {
      setFormError(
        isApprove
          ? 'Confirm that you have checked this evaluation before approving it.'
          : 'Confirm that you have reviewed this evaluation before completing it.'
      );
      return;
    }

    onConfirm({
      completedByName: name,
      actionDate,
      remarks: remarks.trim() || undefined,
      confirmed: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isApprove ? 'Check and approve evaluation' : 'Evaluate by date'}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? 'Review the department head evaluation, record who checked it, and approve by date. Approval applies progression for this student.'
              : 'Review the term results, record who evaluated this student, and save the evaluation date. The registrar or admin will check and approve next.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {studentName ? <p className="font-medium">{studentName}</p> : null}
            <p className="text-muted-foreground">Term: {termLabel}</p>
            {nextEnrollmentLabel ? (
              <p className="text-muted-foreground">Next enrollment: {nextEnrollmentLabel}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Grades this term: {gradeCounts.passed} passed, {gradeCounts.failed} failed,{' '}
              {gradeCounts.incomplete} incomplete, {gradeCounts.pending} pending
            </p>
            {unfinished > 0 ? (
              <p className="mt-1 text-xs text-destructive">
                {unfinished} subject{unfinished === 1 ? '' : 's'} still pending or incomplete.
              </p>
            ) : null}
            {isApprove && evaluatedByName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Evaluated by {evaluatedByName}
                {evaluatedByPosition ? ` (${evaluatedByPosition})` : ''}
                {evaluatedOn ? ` on ${evaluatedOn}` : ''}
              </p>
            ) : null}
          </div>

          {review ? (
            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
              <ReviewList
                title="Passed"
                items={review.passed}
                empty="No passed subjects for this term."
              />
              <ReviewList
                title={nextEnrollmentLabel ? 'Eligible next' : 'Eligible'}
                items={review.eligible}
                empty="No eligible subjects for the next term."
              />
              <ReviewList
                title={nextEnrollmentLabel ? 'Blocked next' : 'Blocked'}
                items={review.blocked}
                empty="No blocked subjects for the next term."
              />
            </div>
          ) : null}

          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">
              {isApprove ? 'Approval record' : 'Evaluation record'}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="completed-by-name">{isApprove ? 'Approved by' : 'Evaluated by'}</Label>
              <Input
                id="completed-by-name"
                value={completedByName}
                onChange={(event) => setCompletedByName(event.target.value)}
                placeholder="Full name"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Position</Label>
              <p className="text-sm text-muted-foreground">{positionLabel}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evaluation-action-date">
                {isApprove ? 'Approval date' : 'Evaluation date'}
              </Label>
              <Input
                id="evaluation-action-date"
                type="date"
                value={actionDate}
                onChange={(event) => setActionDate(event.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evaluation-remarks">Remarks</Label>
              <Textarea
                id="evaluation-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder={
                  isApprove
                    ? 'Optional notes for this approval record'
                    : 'Optional notes for this evaluation record'
                }
                disabled={isPending}
              />
            </div>

            <Label htmlFor="confirm-evaluation" className="flex items-start gap-2 font-normal">
              <Checkbox
                id="confirm-evaluation"
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                disabled={isPending}
                className="mt-0.5"
              />
              <span>
                {isApprove
                  ? 'I have checked this evaluation against the submitted grade slip and approve it for the student record.'
                  : 'I have reviewed this evaluation and confirm it is complete and accurate for the student record.'}
              </span>
            </Label>
          </div>

          {(formError || error) && (
            <p className="text-sm text-destructive">{formError || error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending
              ? isApprove
                ? 'Approving...'
                : 'Saving...'
              : isApprove
                ? 'Confirm and approve'
                : 'Confirm and evaluate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
