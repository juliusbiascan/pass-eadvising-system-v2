'use client';

import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EVALUATION_STATUS_LABEL, isEvaluationApproved } from '@/lib/evaluation';
import { Button } from '@/components/ui/button';

interface AcademicProgressReportProps {
  data: Array<{
    studentRecordId: string;
    studentId: string;
    fullName: string;
    course: string;
    yearLevel: number;
    curriculum: string;
    passed: number;
    failed: number;
    remaining: number;
    totalSubjects: number;
    progressPercentage: number;
    latestEvaluationStatus: string;
  }>;
}

export default function AcademicProgressReport({ data }: AcademicProgressReportProps) {
  if (!data.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No students with assigned curriculum found
      </div>
    );
  }

  return (
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
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.studentRecordId}>
            <TableCell className="font-medium">{row.studentId}</TableCell>
            <TableCell>{row.fullName}</TableCell>
            <TableCell>{row.course}</TableCell>
            <TableCell>{row.yearLevel}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${row.progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {row.progressPercentage}%
                </span>
              </div>
            </TableCell>
            <TableCell>{row.passed}</TableCell>
            <TableCell>{row.failed}</TableCell>
            <TableCell>{row.remaining}</TableCell>
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
            <TableCell className="text-right">
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
  );
}
