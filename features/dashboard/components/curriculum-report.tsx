'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CurriculumReportRow } from '@/features/dashboard/lib/report-types';

export default function CurriculumReport({ data }: { data: CurriculumReportRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((row) =>
      [row.programCode, row.title, row.batchLabel].join(' ').toLowerCase().includes(needle)
    );
  }, [data, query]);

  if (!data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No curriculum records found</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by program or batch"
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {data.length} curriculums
        </p>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-xl border print:max-h-none print:overflow-visible">
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
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.programCode}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>
                  {row.batchLabel} ({row.batchYear})
                </TableCell>
                <TableCell>{row.versionTag === 'OLD' ? 'Old' : 'New'}</TableCell>
                <TableCell className="tabular-nums">{row.subjectsCount}</TableCell>
                <TableCell className="tabular-nums">{row.studentsCount}</TableCell>
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
      </div>
    </div>
  );
}
