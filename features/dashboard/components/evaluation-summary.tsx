'use client';

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

interface EvaluationSummaryProps {
  data: Array<{
    studentId: string;
    fullName: string;
    course: string;
    evaluationStatus: string;
    yearLevel?: number;
    semester?: string;
    completedAt?: string;
  }>;
}

export default function EvaluationSummary({ data }: EvaluationSummaryProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow key={`${record.studentId}-${record.completedAt}-${index}`}>
              <TableCell className="font-medium">{record.studentId}</TableCell>
              <TableCell>{record.fullName}</TableCell>
              <TableCell>{record.course}</TableCell>
              <TableCell>
                {record.yearLevel && record.semester
                  ? `Year ${record.yearLevel} • ${record.semester}`
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    isEvaluationApproved(record.evaluationStatus)
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {EVALUATION_STATUS_LABEL[
                    record.evaluationStatus as keyof typeof EVALUATION_STATUS_LABEL
                  ] ?? record.evaluationStatus}
                </Badge>
              </TableCell>
              <TableCell>
                {record.completedAt
                  ? new Date(record.completedAt).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
