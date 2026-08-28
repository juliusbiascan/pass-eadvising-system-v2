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
import type { ProgressReportRow } from '@/features/dashboard/lib/report-types';
import { EVALUATION_STATUS_LABEL, isEvaluationApproved } from '@/lib/evaluation';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';

export default function AcademicProgressReport({ data }: { data: ProgressReportRow[] }) {
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
        No students with assigned curriculum found
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
          {filtered.length} of {data.length} students
        </p>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-xl border print:max-h-none print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Passed</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Evaluation</TableHead>
              <TableHead className="text-right print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.studentRecordId}>
                <TableCell className="font-medium">{row.studentId}</TableCell>
                <TableCell>{row.fullName}</TableCell>
                <TableCell>{row.course}</TableCell>
                <TableCell>{formatYearLevelLabel(row.yearLevel)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${row.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {row.progressPercentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{row.passed}</TableCell>
                <TableCell className="tabular-nums">{row.failed}</TableCell>
                <TableCell className="tabular-nums">{row.remaining}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      isEvaluationApproved(row.latestEvaluationStatus) ? 'default' : 'secondary'
                    }
                  >
                    {EVALUATION_STATUS_LABEL[
                      row.latestEvaluationStatus as keyof typeof EVALUATION_STATUS_LABEL
                    ] ?? row.latestEvaluationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right print:hidden">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${row.studentRecordId}/evaluate`}>
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
