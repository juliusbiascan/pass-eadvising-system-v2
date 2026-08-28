'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EvaluationReportRow } from '@/features/dashboard/lib/report-types';
import {
  EVALUATION_STATUS_LABEL,
  formatEvaluatorLabel,
  isEvaluationApproved,
} from '@/lib/evaluation';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

export default function EvaluationReport({ data }: { data: EvaluationReportRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((row) =>
      [row.studentId, row.fullName, row.course, row.curriculum]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [data, query]);

  if (!data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No evaluation submissions yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by student, course, or curriculum"
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {data.length} evaluations
        </p>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-xl border print:max-h-none print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Curriculum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Passed</TableHead>
              <TableHead>Eligible</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((record) => (
              <TableRow key={`${record.studentRecordId}-${record.yearLevel}-${record.semester}`}>
                <TableCell className="font-medium">{record.studentId}</TableCell>
                <TableCell>{record.fullName}</TableCell>
                <TableCell>{record.course}</TableCell>
                <TableCell>
                  {formatYearLevelLabel(record.yearLevel)} · {formatSemesterLabel(record.semester)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{record.curriculum}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      isEvaluationApproved(record.evaluationStatus) ? 'default' : 'secondary'
                    }
                  >
                    {EVALUATION_STATUS_LABEL[
                      record.evaluationStatus as keyof typeof EVALUATION_STATUS_LABEL
                    ] ?? record.evaluationStatus}
                    {isEvaluationApproved(record.evaluationStatus)
                      ? ` (${formatEvaluatorLabel(record.completedByName, record.completedByPosition)})`
                      : record.submittedBy
                        ? ` (${record.submittedBy === 'USER' ? 'Student' : record.submittedBy === 'HEAD' ? 'Head' : 'Admin'})`
                        : ''}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{record.passedCount}</TableCell>
                <TableCell className="tabular-nums">{record.eligibleCount}</TableCell>
                <TableCell className="tabular-nums">{record.blockedCount}</TableCell>
                <TableCell>
                  {record.completedAt
                    ? new Date(record.completedAt).toLocaleDateString('en-PH')
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right print:hidden">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${record.studentRecordId}/evaluate`}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
