'use client';

import { EvaluationStatusBadge } from '@/components/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatEvaluationDate,
  formatEvaluatorLabel,
  isEvaluationApproved,
  isEvaluationEvaluated,
} from '@/lib/evaluation';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';
import type { EvaluationStatus, UserRole } from '@/app/generated/prisma/enums';

type HistoryRecord = {
  id: string;
  status: EvaluationStatus;
  yearLevel: number;
  semester: string;
  curriculum: string;
  submittedAt: string | null;
  submittedBy: UserRole | null;
  completedByName?: string | null;
  completedByPosition?: string | null;
  remarks?: string | null;
  approvedAt?: string | null;
  approvedBy?: UserRole | null;
  approvedByName?: string | null;
  approvedByPosition?: string | null;
  approvalRemarks?: string | null;
  updatedAt: string;
  counts: { passed: number; eligible: number; blocked: number };
};

interface EvaluationHistoryProps {
  records: HistoryRecord[];
}

export default function EvaluationHistory({ records }: EvaluationHistoryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Term</TableHead>
          <TableHead>Curriculum</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Passed</TableHead>
          <TableHead className="text-right">Eligible</TableHead>
          <TableHead className="text-right">Blocked</TableHead>
          <TableHead>Evaluated</TableHead>
          <TableHead>Approved</TableHead>
          <TableHead className="pr-4">Remarks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const evaluatedOn = formatEvaluationDate(record.submittedAt || record.updatedAt);
          const approvedOn = formatEvaluationDate(record.approvedAt);

          return (
            <TableRow key={record.id}>
              <TableCell className="pl-4">
                <div className="min-w-[110px]">
                  <p className="font-medium">{formatYearLevelLabel(record.yearLevel)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSemesterLabel(record.semester)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className="block max-w-[200px] truncate text-sm"
                  title={record.curriculum}
                >
                  {record.curriculum}
                </span>
              </TableCell>
              <TableCell>
                <EvaluationStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                {record.counts.passed}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sky-700 dark:text-sky-300">
                {record.counts.eligible}
              </TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-300">
                {record.counts.blocked}
              </TableCell>
              <TableCell className="text-sm">
                {isEvaluationEvaluated(record.status) ? (
                  <div className="min-w-[140px]">
                    <p>
                      {formatEvaluatorLabel(
                        record.completedByName,
                        record.completedByPosition
                      )}
                    </p>
                    {evaluatedOn ? (
                      <p className="text-xs text-muted-foreground">{evaluatedOn}</p>
                    ) : null}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-sm">
                {isEvaluationApproved(record.status) ? (
                  <div className="min-w-[140px]">
                    <p>
                      {formatEvaluatorLabel(
                        record.approvedByName,
                        record.approvedByPosition
                      )}
                    </p>
                    {approvedOn ? (
                      <p className="text-xs text-muted-foreground">{approvedOn}</p>
                    ) : null}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="max-w-[220px] whitespace-normal pr-4 text-sm text-muted-foreground">
                {record.approvalRemarks || record.remarks || '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
