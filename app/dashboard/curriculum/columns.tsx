'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  BookOpen,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { DataTableColumnHeader } from '@/components/common';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type CurriculumRecord = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: 'OLD' | 'NEW';
  isActive: boolean;
  subjectsCount: number;
  studentsCount: number;
  createdAt: Date;
};

export const columns: ColumnDef<CurriculumRecord>[] = [
  {
    accessorKey: 'programCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Program" />
    ),
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Curriculum" />
    ),
  },
  {
    accessorKey: 'batchYear',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Batch" />
    ),
  },
  {
    accessorKey: 'versionTag',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Version" />
    ),
    cell: ({ row }) => {
      const versionTag = row.getValue('versionTag') as 'OLD' | 'NEW';
      return versionTag === 'OLD' ? 'Old Curriculum' : 'New Curriculum';
    },
  },
  {
    accessorKey: 'subjectsCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subjects" />
    ),
  },
  {
    accessorKey: 'studentsCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Students" />
    ),
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (row.getValue('isActive') ? 'Active' : 'Inactive'),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date;
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(new Date(createdAt));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CurriculumRowActions curriculum={row.original} />,
  },
];

function ActionLink({
  href,
  icon: Icon,
  label,
  tooltip,
  download,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  download?: boolean;
}) {
  const className = buttonVariants({ variant: 'outline', size: 'sm' });
  const content = (
    <>
      <Icon />
      <span className="hidden xl:inline">{label}</span>
      <span className="sr-only xl:hidden">{label}</span>
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {download ? (
          <a href={href} download className={className}>
            {content}
          </a>
        ) : (
          <Link href={href} className={className}>
            {content}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}

export function CurriculumRowActions({
  curriculum,
}: {
  curriculum: CurriculumRecord;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionLink
        href={`/dashboard/curriculum/${curriculum.id}/subjects`}
        icon={BookOpen}
        label="Subjects"
        tooltip="Open subjects"
      />
      <ActionLink
        href={`/dashboard/curriculum/${curriculum.id}/assign-students`}
        icon={UserPlus}
        label="Assign"
        tooltip="Assign students"
      />
      <ActionLink
        href={`/dashboard/curriculum/${curriculum.id}/edit`}
        icon={Pencil}
        label="Edit"
        tooltip="Edit curriculum"
      />
      <ActionLink
        href={`/api/curriculum/${curriculum.id}/export`}
        icon={Download}
        label="Excel"
        tooltip="Download Excel"
        download
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => navigator.clipboard.writeText(curriculum.id)}
          >
            <Copy />
            Copy Curriculum ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
