'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Undo2 } from 'lucide-react';

import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isEvaluationApproved, isEvaluationEvaluated } from '@/lib/evaluation';
import type { EvaluationStatus } from '@/app/generated/prisma/enums';
import type { GradePassSettings } from '@/lib/grade-evaluation';
import type { SemesterTermValue } from '@/lib/semester-terms';

import { cancelGradeSubmission } from '../actions/cancel-grade-submission';
import { GradeSubmissionForm } from './grade-submission-form';
import { ProgramCompleteView } from './program-complete-view';
import { RetakeRequestForm } from './retake-request-form';
import StudentEvaluationForm from './student-evaluation-form';
import type { CurriculumItem, ExistingGrade, StudentPortalStudent } from '../lib/types';

interface GradesViewProps {
  student: StudentPortalStudent;
  studentId: string;
  curriculumId: string;
  semester: SemesterTermValue;
  currentTermLabel: string;
  offerings: CurriculumItem[];
  retakeOfferings: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
  gradePassSettings: GradePassSettings;
  evaluationStatus: EvaluationStatus;
  hasSubmittedTermGrades: boolean;
  deferredSubjects: CurriculumItem[];
  gradeCounts: Record<'passed' | 'failed' | 'incomplete' | 'pending', number>;
  isMakeupStanding?: boolean;
  isProgramComplete?: boolean;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'pass' | 'fail' | 'warn' | 'muted';
}) {
  const tones = {
    pass: 'border-l-emerald-500',
    fail: 'border-l-rose-500',
    warn: 'border-l-amber-500',
    muted: 'border-l-(--pass-gold)',
  };

  return (
    <div className={`rounded-xl border border-border/80 border-l-4 bg-background/60 p-3 ${tones[tone]}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function GradesView({
  student,
  studentId,
  curriculumId,
  semester,
  currentTermLabel,
  offerings,
  retakeOfferings,
  existingGrades,
  gradePassSettings,
  evaluationStatus,
  hasSubmittedTermGrades,
  deferredSubjects,
  gradeCounts,
  isMakeupStanding = false,
  isProgramComplete = false,
}: GradesViewProps) {
  const router = useRouter();
  const [submittedGrades, setSubmittedGrades] = useState<Record<string, ExistingGrade> | null>(
    null
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const formOfferings = useMemo(
    () => [...retakeOfferings, ...offerings],
    [retakeOfferings, offerings]
  );

  const gradesLocked = hasSubmittedTermGrades || submittedGrades !== null;
  const canCancelSubmission = gradesLocked && !isEvaluationEvaluated(evaluationStatus);

  const handleCancelSubmission = () => {
    setError('');
    setSuccess('');
    startTransition(() => {
      cancelGradeSubmission().then((result) => {
        setCancelOpen(false);

        if (result?.error) {
          setError(result.error);
          return;
        }

        setSubmittedGrades(null);
        setSuccess(result?.success || 'Submission cancelled. You can edit your grades.');
        router.refresh();
      });
    });
  };

  const gradesForSlip = useMemo(
    () =>
      submittedGrades ? { ...existingGrades, ...submittedGrades } : existingGrades,
    [existingGrades, submittedGrades]
  );

  const assignedIds = useMemo(
    () => new Set(retakeOfferings.map((offering) => offering.id)),
    [retakeOfferings]
  );

  const failedForRequest = useMemo(() => {
    const byId = new Map(
      deferredSubjects
        .filter(
          (subject) => subject.scheduleKind === 'FAILED' && !assignedIds.has(subject.id)
        )
        .map((subject) => [subject.id, subject])
    );
    for (const offering of formOfferings) {
      if (offering.isRetake) continue;
      const status = gradesForSlip[offering.id]?.status;
      if (status === 'FAILED' && !byId.has(offering.id)) {
        byId.set(offering.id, { ...offering, scheduleKind: 'FAILED' });
      }
    }
    return Array.from(byId.values());
  }, [assignedIds, deferredSubjects, formOfferings, gradesForSlip]);

  const leftoverForRequest = useMemo(
    () =>
      deferredSubjects.filter(
        (subject) =>
          !assignedIds.has(subject.id) &&
          (subject.scheduleKind === 'PENDING' || subject.scheduleKind === 'INCOMPLETE')
      ),
    [assignedIds, deferredSubjects]
  );

  if (isProgramComplete) {
    return (
      <ProgramCompleteView
        studentName={student.fullName}
        course={student.course}
        passedCount={gradeCounts.passed}
      />
    );
  }

  if (gradesLocked) {
    return (
      <div className="space-y-6">
        <FormError message={error} />
        <FormSuccess message={success} />
        <Alert className="border-(--pass-gold)/40 bg-(--pass-gold)/10">
          <Clock />
          <AlertTitle className="text-pretty">
            {isEvaluationApproved(evaluationStatus)
              ? 'Your grades have been approved.'
              : evaluationStatus === 'EVALUATED'
                ? 'Your department head has evaluated this term.'
                : 'You already saved your grades. Submit the slip to the registrar.'}
          </AlertTitle>
          <AlertDescription className="text-pretty">
            {isEvaluationApproved(evaluationStatus)
              ? 'The registrar or admin has approved this term. You can print, download, or email the form below.'
              : evaluationStatus === 'EVALUATED'
                ? 'Print, download, or email the form below while the registrar or admin checks and approves your evaluation.'
                : 'Grade entry is closed for this term. Print or submit the grade slip to the registrar. Cancel the submission if you need to edit grades before your department head evaluates.'}
          </AlertDescription>
        </Alert>

        {canCancelSubmission ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
            onClick={() => {
              setError('');
              setCancelOpen(true);
            }}
            disabled={isPending}
          >
            <Undo2 />
            Cancel submission
          </Button>
        ) : null}

        <AlertDialog
          open={cancelOpen}
          onOpenChange={(open) => {
            if (isPending) return;
            setCancelOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this submission?</AlertDialogTitle>
              <AlertDialogDescription>
                You can edit your grades and submit again. This does not delete the grades you
                already entered. You cannot cancel after your department head evaluates this term.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Keep submission</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleCancelSubmission();
                }}
                disabled={isPending}
              >
                {isPending ? 'Cancelling...' : 'Cancel submission'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <GradeSubmissionForm
          student={student}
          termLabel={currentTermLabel}
          offerings={formOfferings}
          existingGrades={gradesForSlip}
        />

        {failedForRequest.length > 0 ? (
          <div className="space-y-3">
            <Alert className="border-rose-500/40 bg-rose-500/10">
              <AlertTitle className="text-pretty">Failed subjects</AlertTitle>
              <AlertDescription className="text-pretty">
                Print the retake request below and submit it to an administrator. After they
                confirm next semester, next year, or a makeup term (if every curriculum term
                is already approved), the subject will appear on your grade form for that term.
              </AlertDescription>
            </Alert>
            <RetakeRequestForm
              student={student}
              termLabel={currentTermLabel}
              failedSubjects={failedForRequest}
              existingGrades={gradesForSlip}
            />
          </div>
        ) : null}

        {leftoverForRequest.length > 0 ? (
          <div className="space-y-3">
            <Alert className="border-amber-500/40 bg-amber-500/10">
              <AlertTitle className="text-pretty">Leftover subjects from an earlier term</AlertTitle>
              <AlertDescription className="text-pretty">
                {isMakeupStanding
                  ? 'These leftover subjects are still pending or incomplete. Print the request below so an administrator can assign them to this makeup term.'
                  : 'These subjects are still pending or incomplete (for example 1st semester subjects after a shift while you are already in 2nd semester). Print the request below so an administrator can assign each subject to next semester, next year, or a makeup term if every curriculum term is already approved.'}
              </AlertDescription>
            </Alert>
            <RetakeRequestForm
              student={student}
              termLabel={currentTermLabel}
              failedSubjects={leftoverForRequest}
              existingGrades={gradesForSlip}
              variant="leftover"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormSuccess message={success} />
      <StudentEvaluationForm
        studentId={studentId}
        curriculumId={curriculumId}
        semester={semester}
        offerings={formOfferings}
        existingGrades={existingGrades}
        gradePassSettings={gradePassSettings}
        evaluationStatus={evaluationStatus}
        isMakeupStanding={isMakeupStanding}
        displayTermLabel={currentTermLabel}
        onSaved={setSubmittedGrades}
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick status</CardTitle>
          <CardDescription>
            Counts from saved grades (status set automatically from numeric grades).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Passed" value={gradeCounts.passed} tone="pass" />
          <StatCard label="Failed" value={gradeCounts.failed} tone="fail" />
          <StatCard label="Incomplete" value={gradeCounts.incomplete} tone="warn" />
          <StatCard label="Pending" value={gradeCounts.pending} tone="muted" />
        </CardContent>
      </Card>

      {failedForRequest.length > 0 ? (
        <div className="space-y-3">
          <Alert className="border-rose-500/40 bg-rose-500/10">
            <AlertTitle className="text-pretty">Request a retake</AlertTitle>
            <AlertDescription className="text-pretty">
              Print this form and submit it to an administrator. After they confirm next
              semester, next year, or a makeup term if you have already finished the program,
              the failed subject will appear on your grade form for that term.
            </AlertDescription>
          </Alert>
          <RetakeRequestForm
            student={student}
            termLabel={currentTermLabel}
            failedSubjects={failedForRequest}
            existingGrades={gradesForSlip}
          />
        </div>
      ) : null}

      {leftoverForRequest.length > 0 ? (
        <div className="space-y-3">
          <Alert className="border-amber-500/40 bg-amber-500/10">
            <AlertTitle className="text-pretty">Request leftover subjects</AlertTitle>
            <AlertDescription className="text-pretty">
              {isMakeupStanding
                ? 'Print this form so an administrator can add unfinished leftover subjects to this makeup term.'
                : 'Print this form so an administrator can assign unfinished 1st semester (or earlier) subjects to next semester, next year, or a makeup term after the last approved curriculum term.'}
            </AlertDescription>
          </Alert>
          <RetakeRequestForm
            student={student}
            termLabel={currentTermLabel}
            failedSubjects={leftoverForRequest}
            existingGrades={gradesForSlip}
            variant="leftover"
          />
        </div>
      ) : null}
    </div>
  );
}
