import { Badge } from '@/components/ui/badge';
import { RESULT_STATUS_BADGE_CLASS } from '@/components/status-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type EvaluationSubject = {
  id: string;
  code: string;
  description: string;
  percent?: number;
};

interface SubjectTableProps {
  items: EvaluationSubject[];
  emptyMessage: string;
  showPercent?: boolean;
}

function SubjectTable({ items, emptyMessage, showPercent = false }: SubjectTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Code</TableHead>
            <TableHead>Description</TableHead>
            {showPercent && <TableHead className="pr-4 text-right">Prerequisites</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showPercent ? 3 : 2}
                className="h-16 pl-4 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-4 font-medium">{item.code}</TableCell>
                <TableCell className="text-muted-foreground">{item.description}</TableCell>
                {showPercent && (
                  <TableCell className="pr-4 text-right">
                    {item.percent !== undefined ? (
                      <span className="tabular-nums text-sm">{item.percent}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface EvaluationResultsProps {
  error?: string;
  currentTermLabel: string;
  nextEnrollmentLabel: string | null;
  passed: EvaluationSubject[];
  eligible: EvaluationSubject[];
  blocked: EvaluationSubject[];
}

export default function EvaluationResults({
  error,
  currentTermLabel,
  nextEnrollmentLabel,
  passed,
  eligible,
  blocked,
}: EvaluationResultsProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Evaluation Results</CardTitle>
        <CardDescription>
          Passed subjects are for {currentTermLabel}. Eligible and blocked subjects are for the
          next enrollment
          {nextEnrollmentLabel ? ` (${nextEnrollmentLabel})` : ''}.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.passed}>
            {passed.length} passed
          </Badge>
          <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.eligible}>
            {eligible.length} eligible
          </Badge>
          <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.blocked}>
            {blocked.length} blocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full bg-emerald-500" />
            Passed subjects ({currentTermLabel})
          </h3>
          <SubjectTable
            items={passed}
            emptyMessage={`No passed subjects yet for ${currentTermLabel}.`}
          />
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full bg-sky-500" />
            Eligible subjects
            {nextEnrollmentLabel ? ` (${nextEnrollmentLabel})` : ''}
          </h3>
          <SubjectTable
            items={eligible}
            showPercent
            emptyMessage={
              nextEnrollmentLabel
                ? `No eligible subjects for ${nextEnrollmentLabel}.`
                : 'No further terms in this curriculum.'
            }
          />
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full bg-rose-500" />
            Blocked subjects
            {nextEnrollmentLabel ? ` (${nextEnrollmentLabel})` : ''}
          </h3>
          <SubjectTable
            items={blocked}
            showPercent
            emptyMessage={
              nextEnrollmentLabel
                ? `No blocked subjects for ${nextEnrollmentLabel}.`
                : 'No blocked subjects — no further terms in this curriculum.'
            }
          />
        </section>
      </CardContent>
    </Card>
  );
}
