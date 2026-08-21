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
import { Button } from '@/components/ui/button';
import {
  EVALUATION_STATUS_LABEL,
  formatEvaluatorLabel,
  isEvaluationApproved,
} from '@/lib/evaluation';

interface EvaluationReportProps {
  data: Array<{
    studentRecordId: string;
    studentId: string;
    fullName: string;
    course: string;
    yearLevel: number;
    semester: string;
    curriculum: string;
    evaluationStatus: string;
    submittedBy?: 'ADMIN' | 'HEAD' | 'USER' | null;
    completedByName?: string | null;
    completedByPosition?: string | null;
    remarks?: string | null;
    passedCount: number;
    eligibleCount: number;
    blockedCount: number;
    completedAt?: string;
  }>;
}

export default function EvaluationReport({ data }: EvaluationReportProps) {
  if (!data.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No evaluation submissions yet
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
          <TableHead>Term</TableHead>
          <TableHead>Curriculum</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Passed</TableHead>
          <TableHead>Eligible</TableHead>
          <TableHead>Blocked</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((record) => (
          <TableRow key={`${record.studentId}-${record.completedAt}`}>
            <TableCell className="font-medium">{record.studentId}</TableCell>
            <TableCell>{record.fullName}</TableCell>
            <TableCell>{record.course}</TableCell>
            <TableCell>
              Year {record.yearLevel} • {record.semester}
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
            <TableCell>{record.passedCount}</TableCell>
            <TableCell>{record.eligibleCount}</TableCell>
            <TableCell>{record.blockedCount}</TableCell>
            <TableCell>
              {record.completedAt
                ? new Date(record.completedAt).toLocaleDateString()
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
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
  );
}
