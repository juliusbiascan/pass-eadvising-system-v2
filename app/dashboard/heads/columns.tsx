'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { MoreHorizontal, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type HeadRecord = {
  id: string;
  email: string;
  fullName: string;
  departments: string[];
  createdAt: Date;
};

export const headColumns: ColumnDef<HeadRecord>[] = [
  {
    accessorKey: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Head" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[180px] max-w-[260px]">
        <p className="truncate font-medium">{row.original.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.email}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'departments',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Departments" />
    ),
    cell: ({ row }) => {
      const departments = row.original.departments;

      if (departments.length === 0) {
        return (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {departments.map((code) => (
            <Badge key={code} variant="secondary">
              {code}
            </Badge>
          ))}
        </div>
      );
    },
    sortingFn: (a, b) =>
      a.original.departments.join(',').localeCompare(
        b.original.departments.join(',')
      ),
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
  {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Open menu for {row.original.fullName}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/heads/${row.original.id}/edit`}>
                <Pencil />
                Edit Head
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
