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

interface CurriculumReportProps {
  data: Array<{
    programCode: string;
    title: string;
    batchLabel: string;
    batchYear: number;
    versionTag: string;
    isActive: boolean;
    subjectsCount: number;
    studentsCount: number;
    semesterBreakdown: Record<string, number>;
  }>;
}

export default function CurriculumReport({ data }: CurriculumReportProps) {
  if (!data.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No curriculum records found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Program</TableHead>
          <TableHead>Curriculum</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Subjects</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Offerings by term</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={`${row.programCode}-${row.batchYear}-${row.versionTag}`}>
            <TableCell className="font-medium">{row.programCode}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell>
              {row.batchLabel} ({row.batchYear})
            </TableCell>
            <TableCell>{row.versionTag === 'OLD' ? 'Old' : 'New'}</TableCell>
            <TableCell>{row.subjectsCount}</TableCell>
            <TableCell>{row.studentsCount}</TableCell>
            <TableCell>
              <Badge variant={row.isActive ? 'default' : 'secondary'}>
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs text-xs text-muted-foreground">
              {Object.entries(row.semesterBreakdown)
                .map(([term, count]) => `${term}: ${count}`)
                .join(' · ') || 'No subjects'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
