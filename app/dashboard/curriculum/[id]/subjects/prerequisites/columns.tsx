'use client';

import { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { removeSubjectPrerequisite } from '@/actions/curriculum';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/common';

export type PrerequisiteRecord = {
  id: string;
  curriculumId: string;
  subjectCode: string;
  prerequisiteCode: string;
};

const PrerequisiteRowActions = ({ id, curriculumId }: { id: string; curriculumId: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(() => {
      removeSubjectPrerequisite(id).then(() => {
        router.refresh();
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/curriculum/${curriculumId}/subjects/prerequisites/create`}>
            Add Prerequisite
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleRemove}>
          Remove Prerequisite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<PrerequisiteRecord>[] = [
  {
    accessorKey: 'subjectCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
  },
  {
    accessorKey: 'prerequisiteCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prerequisite" />
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <PrerequisiteRowActions
        id={row.original.id}
        curriculumId={row.original.curriculumId}
      />
    ),
  },
];
