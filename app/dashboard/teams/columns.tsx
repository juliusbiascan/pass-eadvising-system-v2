'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/common';

export type AdminRecord = {
  id: string;
  name: string;
  email: string;
  isRoot: boolean;
  isCurrentUser: boolean;
  createdAt: Date;
};

export const teamColumns: ColumnDef<AdminRecord>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Admin" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[180px] max-w-[280px]">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{row.original.name}</p>
          {row.original.isCurrentUser ? (
            <Badge variant="outline">You</Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.email}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'isRoot',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) =>
      row.original.isRoot ? (
        <Badge className="border-transparent bg-(--pass-gold)/20 text-(--pass-cod) dark:text-(--pass-gold)">
          Root
        </Badge>
      ) : (
        <Badge variant="secondary">Admin</Badge>
      ),
    sortingFn: (a, b) =>
      Number(b.original.isRoot) - Number(a.original.isRoot),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Intl.DateTimeFormat('en-PH', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }).format(new Date(row.original.createdAt))}
      </span>
    ),
  },
];
