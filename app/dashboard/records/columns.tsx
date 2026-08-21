'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/common';
import { Progress } from '@/components/ui/progress';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';
import type { StudentRecordListItem } from '@/features/dashboard/lib/get-student-academic-record';

function gradePercent(entered: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((entered / total) * 100));
}

export const recordColumns: ColumnDef<StudentRecordListItem>[] = [
  {
    accessorKey: 'studentId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student ID" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium tabular-nums">
        {row.getValue('studentId')}
      </span>
    ),
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student" />
    ),
    cell: ({ row }) => (
      <p className="max-w-[220px] truncate font-medium">
        {row.original.fullName}
      </p>
    ),
  },
  {
    accessorKey: 'course',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Course" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue('course')}</Badge>
    ),
  },
  {
    id: 'term',
    accessorFn: (row) => `${row.yearLevel}-${row.currentSemester}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Current Term" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[110px]">
        <p className="font-medium">
          {formatYearLevelLabel(row.original.yearLevel)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatSemesterLabel(row.original.currentSemester)}
        </p>
      </div>
    ),
    sortingFn: (a, b) => {
      const yearDiff = a.original.yearLevel - b.original.yearLevel;
      if (yearDiff !== 0) {
        return yearDiff;
      }

      return a.original.currentSemester.localeCompare(
        b.original.currentSemester
      );
    },
  },
  {
    accessorKey: 'curriculum',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Curriculum" />
    ),
    cell: ({ row }) => {
      const curriculum = row.original.curriculum;
      const assigned =
        Boolean(row.original.curriculumId) && curriculum !== 'Not Assigned';

      if (!assigned) {
        return (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        );
      }

      return (
        <div className="min-w-[180px] space-y-1">
          <span
            className="block max-w-[220px] truncate text-sm"
            title={curriculum}
          >
            {curriculum}
          </span>
          {row.original.priorCurriculumCount > 0 && (
            <Badge variant="outline">
              {row.original.priorCurriculumCount === 1
                ? '1 prior course'
                : `${row.original.priorCurriculumCount} prior courses`}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'progress',
    accessorFn: (row) =>
      row.totalSubjects > 0 ? row.gradesEntered / row.totalSubjects : -1,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Grades" />
    ),
    cell: ({ row }) => {
      const { gradesEntered, totalSubjects, curriculumId } = row.original;

      if (!curriculumId) {
        return (
          <span className="text-sm text-muted-foreground">No curriculum</span>
        );
      }

      if (totalSubjects === 0) {
        return (
          <span className="text-sm text-muted-foreground">No subjects</span>
        );
      }

      const percent = gradePercent(gradesEntered, totalSubjects);

      return (
        <div className="min-w-[140px] space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="tabular-nums text-foreground">
              {gradesEntered} / {totalSubjects}
            </span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </div>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/records/${row.original.id}`}>
            Open Record
          </Link>
        </Button>
      </div>
    ),
  },
];
