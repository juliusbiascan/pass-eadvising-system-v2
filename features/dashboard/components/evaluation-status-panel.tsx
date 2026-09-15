import { EvaluationStatusBadge } from '@/components/status-badge';
import {
  EVALUATION_STATUS_LABEL,
  formatEvaluationDate,
  formatEvaluatorLabel,
  isEvaluationApproved,
  isEvaluationEvaluated,
} from '@/lib/evaluation';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';
import type { EvaluationStatus, UserRole } from '@/app/generated/prisma/enums';

interface EvaluationStatusPanelProps {
  status: EvaluationStatus;
  submittedAt?: Date | string | null;
  submittedBy?: UserRole | null;
  completedByName?: string | null;
  completedByPosition?: string | null;
  remarks?: string | null;
  approvedAt?: Date | string | null;
  approvedByName?: string | null;
  approvedByPosition?: string | null;
  approvalRemarks?: string | null;
  yearLevel: number;
  semester: string;
  termLabel?: string;
  isStoredResult?: boolean;
  isStudentView?: boolean;
}

export function EvaluationStatusPanel({
  status,
  submittedAt,
  completedByName,
  completedByPosition,
  remarks,
  approvedAt,
  approvedByName,
  approvedByPosition,
  approvalRemarks,
  yearLevel,
  semester,
  termLabel,
  isStoredResult = false,
  isStudentView = false,
}: EvaluationStatusPanelProps) {
  const evaluatedOn = formatEvaluationDate(submittedAt);
  const approvedOn = formatEvaluationDate(approvedAt);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Evaluation status</span>
        <EvaluationStatusBadge status={status} />
      </div>
      <p className="mt-2 text-muted-foreground">
        Term: {termLabel || `${formatYearLevelLabel(yearLevel)} • ${formatSemesterLabel(semester)}`}
      </p>
      {isEvaluationEvaluated(status) ? (
        <div className="mt-1 space-y-1 text-muted-foreground">
          <p>
            Evaluated by {formatEvaluatorLabel(completedByName, completedByPosition)}
            {evaluatedOn ? ` on ${evaluatedOn}` : ''}
            {isStoredResult ? ' • showing saved evaluation record' : ''}
          </p>
          {remarks ? <p>Head remarks: {remarks}</p> : null}
          {isEvaluationApproved(status) ? (
            <>
              <p>
                Approved by {formatEvaluatorLabel(approvedByName, approvedByPosition)}
                {approvedOn ? ` on ${approvedOn}` : ''}
              </p>
              {approvalRemarks ? <p>Approval remarks: {approvalRemarks}</p> : null}
            </>
          ) : (
            <p>Waiting for the registrar or admin to check and approve this evaluation.</p>
          )}
        </div>
      ) : isStudentView ? (
        <p className="mt-1 text-muted-foreground">
          Save your grades, then print or submit the grade slip to the registrar. Your department
          head will evaluate by date, then the registrar or admin will check and approve by date.
          Results shown are previews until the head finalizes them.
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground">
          {EVALUATION_STATUS_LABEL.PENDING}. Department heads evaluate by date. After that, the
          registrar or admin checks and approves by date. Results below are live previews until
          the head evaluates.
        </p>
      )}
    </div>
  );
}
