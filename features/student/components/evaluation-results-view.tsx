import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EvaluationStatusPanel } from '@/features/dashboard/components/evaluation-status-panel';
import type { EvaluationStatus, UserRole } from '@/app/generated/prisma/enums';

import type { CurriculumItem, EvaluationSubject } from '../lib/types';

interface SubjectListProps {
  items: Array<{ id: string; code: string; description: string; percent?: number }>;
  emptyMessage: string;
  showPercent?: boolean;
}

function SubjectList({ items, emptyMessage, showPercent }: SubjectListProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/80 bg-background/60 p-3">
          <div className="font-medium">{item.code}</div>
          <div className="text-muted-foreground">{item.description}</div>
          {showPercent && item.percent !== undefined ? (
            <div className="mt-1 text-xs text-muted-foreground">
              Prerequisites complete: {item.percent}%
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

interface EvaluationResultsViewProps {
  displayEvaluation: {
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
    isStoredResult: boolean;
  };
  yearLevel: number;
  semester: string;
  currentTermLabel: string;
  nextEnrollmentLabel: string | null;
  termEvaluationLists: {
    passed: EvaluationSubject[];
    eligible: EvaluationSubject[];
    blocked: EvaluationSubject[];
  };
  failedSubjects: CurriculumItem[];
  hasPriorTermGaps?: boolean;
  isMakeupStanding?: boolean;
}

export function EvaluationResultsView({
  displayEvaluation,
  yearLevel,
  semester,
  currentTermLabel,
  nextEnrollmentLabel,
  termEvaluationLists,
  failedSubjects,
  hasPriorTermGaps = false,
  isMakeupStanding = false,
}: EvaluationResultsViewProps) {
  return (
    <div className="space-y-6">
      <EvaluationStatusPanel
        status={displayEvaluation.status}
        submittedAt={displayEvaluation.submittedAt}
        submittedBy={displayEvaluation.submittedBy}
        completedByName={displayEvaluation.completedByName}
        completedByPosition={displayEvaluation.completedByPosition}
        remarks={displayEvaluation.remarks}
        approvedAt={displayEvaluation.approvedAt}
        approvedByName={displayEvaluation.approvedByName}
        approvedByPosition={displayEvaluation.approvedByPosition}
        approvalRemarks={displayEvaluation.approvalRemarks}
        yearLevel={yearLevel}
        semester={semester}
        termLabel={currentTermLabel}
        isStoredResult={displayEvaluation.isStoredResult}
        isStudentView
      />

      <Card>
        <CardHeader>
          <CardTitle>Evaluation results</CardTitle>
          <CardDescription>
            {isMakeupStanding
              ? 'Passed and failed reflect leftover or retake grades entered this makeup term. Eligible and blocked show the next makeup term, if one is scheduled.'
              : 'Passed and failed reflect your current term and year. Eligible and blocked show what you can take in your next semester or year level.'}
            {hasPriorTermGaps
              ? ' Blocked subjects may include prerequisites from earlier years that are not marked passed yet.'
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Passed subjects ({currentTermLabel})
            </div>
            <SubjectList
              items={termEvaluationLists.passed}
              emptyMessage="No passed subjects for this term yet."
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Failed subjects</div>
            <SubjectList
              items={failedSubjects}
              emptyMessage="No failed subjects."
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">
              Eligible subjects (next enrollment
              {nextEnrollmentLabel ? `: ${nextEnrollmentLabel}` : ''})
            </div>
            <SubjectList
              items={termEvaluationLists.eligible}
              emptyMessage={
                nextEnrollmentLabel
                  ? 'No eligible subjects for your next term yet.'
                  : isMakeupStanding
                    ? 'No further curriculum terms. Finish leftover and retake subjects on Grades.'
                    : 'You are at the final term in your curriculum.'
              }
              showPercent
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">
              Blocked subjects (missing prerequisites
              {nextEnrollmentLabel ? `: ${nextEnrollmentLabel}` : ''})
            </div>
            <SubjectList
              items={termEvaluationLists.blocked}
              emptyMessage={
                nextEnrollmentLabel
                  ? 'No blocked subjects for your next term.'
                  : isMakeupStanding
                    ? 'No blocked subjects for a further makeup term.'
                    : 'No blocked subjects — no further terms in your curriculum.'
              }
              showPercent
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
