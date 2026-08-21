'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/common';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

import StudentRowActions from './student-row-actions';

export type StudentRecord = {
  id: string;
  studentId: string;
  email: string | null;
  fullName: string;
  course: string;
  yearLevel: number;
  currentSemester: 'FIRST' | 'SECOND';
  curriculum: string;
  curriculumId: string | null;
  createdAt: Date;
};

export const createStudentColumns = ({
  canManageProfile = true,
}: {
  canManageProfile?: boolean;
} = {}): ColumnDef<StudentRecord>[] => [
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
    cell: ({ row }) => {
      const email = row.original.email;

      return (
        <div className="min-w-[180px] max-w-[260px]">
          <p className="truncate font-medium">{row.original.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {email || 'No email on file'}
          </p>
        </div>
      );
    },
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
        Boolean(row.original.curriculumId) &&
        curriculum !== 'Not Assigned';

      if (!assigned) {
        return (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        );
      }

      return (
        <span
          className="block max-w-[220px] truncate text-sm"
          title={curriculum}
        >
          {curriculum}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date;

      return (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('en-PH', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          }).format(new Date(createdAt))}
        </span>
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
        <StudentRowActions
          student={row.original}
          canManageProfile={canManageProfile}
        />
      </div>
    ),
  },
];
