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
import type { PerformanceReportRow } from '@/features/dashboard/lib/report-types';

function riskLabel(rate: number, failures: number) {
  if (rate >= 30) return { label: 'High', variant: 'destructive' as const };
  if (rate >= 15) return { label: 'Moderate', variant: 'secondary' as const };
  if (failures > 0) return { label: 'Low', variant: 'secondary' as const };
  return { label: 'Clear', variant: 'outline' as const };
}

export default function FailedSubjects({ data }: { data: PerformanceReportRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((row) =>
      `${row.subjectCode} ${row.subjectDescription}`.toLowerCase().includes(needle)
    );
  }, [data, query]);

  if (!data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No grades recorded yet</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by subject code or title"
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {data.length} subjects
        </p>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-xl border print:max-h-none print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Failures</TableHead>
              <TableHead>Grades recorded</TableHead>
              <TableHead>Failure rate</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((record) => {
              const risk = riskLabel(record.failureRate, record.failureCount);
              return (
                <TableRow key={record.subjectCode}>
                  <TableCell className="font-medium">{record.subjectCode}</TableCell>
                  <TableCell>{record.subjectDescription}</TableCell>
                  <TableCell>
                    <Badge variant={record.failureCount > 0 ? 'destructive' : 'secondary'}>
                      {record.failureCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{record.totalEnrolled}</TableCell>
                  <TableCell className="tabular-nums">{record.failureRate.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge variant={risk.variant}>{risk.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
