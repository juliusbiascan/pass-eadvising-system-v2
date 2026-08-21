'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common';
import SubjectRowActions from './subject-row-actions';

export type SubjectOfferingRecord = {
  id: string;
  subjectId: string;
  curriculumId: string;
  subjectCode: string;
  description: string;
  units: number;
  yearLevel: number;
  semester: 'FIRST' | 'SECOND';
  displayOrder: number;
  prerequisiteDisplay: string;
};

export const termSubjectColumns: ColumnDef<SubjectOfferingRecord>[] = [
  {
    accessorKey: 'subjectCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
  },
  {
    accessorKey: 'units',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Units" />
    ),
    cell: ({ row }) => row.getValue('units'),
  },
  {
    accessorKey: 'prerequisiteDisplay',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pre-Req." />
    ),
    cell: ({ row }) => {
      const value = row.getValue('prerequisiteDisplay') as string;
      return (
        <span className="text-muted-foreground">
          {value === 'none' ? '—' : value}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <SubjectRowActions offering={row.original} />,
  },
];

/** @deprecated Use termSubjectColumns with grouped term tables */
export const columns = termSubjectColumns;
