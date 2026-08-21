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

interface FailedSubjectsProps {
  data: Array<{
    subjectCode: string;
    subjectDescription: string;
    failureCount: number;
    totalEnrolled: number;
    failureRate: number;
  }>;
}

export default function FailedSubjects({ data }: FailedSubjectsProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject Code</TableHead>
            <TableHead>Subject Description</TableHead>
            <TableHead>Failures</TableHead>
            <TableHead>Total Enrolled</TableHead>
            <TableHead>Failure Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.subjectCode}>
              <TableCell className="font-medium">{record.subjectCode}</TableCell>
              <TableCell>{record.subjectDescription}</TableCell>
              <TableCell>
                <Badge variant="destructive">{record.failureCount}</Badge>
              </TableCell>
              <TableCell>{record.totalEnrolled}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.failureRate > 30 ? 'destructive' : 'secondary'
                  }
                >
                  {record.failureRate.toFixed(1)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
