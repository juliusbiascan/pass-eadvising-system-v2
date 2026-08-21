"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  countSubjectsInProgramCodeGroups,
  groupSubjectsByProgramCode,
} from "@/lib/subject-catalog";
import EditSubjectDialog from "@/app/dashboard/curriculum/[id]/subjects/edit-subject-dialog";

export type SubjectCatalogRecord = {
  id: string;
  code: string;
  description: string;
  units: number;
  offeringsCount: number;
  programCodes: string[];
};

const columns: ColumnDef<SubjectCatalogRecord>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
  },
  {
    accessorKey: "units",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Units" />,
  },
  {
    accessorKey: "offeringsCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Offerings" />
    ),
    cell: ({ row }) => `${row.original.offeringsCount} offering(s)`,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <EditSubjectDialog
        compact
        subject={{
          subjectId: row.original.id,
          code: row.original.code,
          description: row.original.description,
          units: row.original.units,
        }}
      />
    ),
  },
];

function ProgramSubjectsTable({ data }: { data: SubjectCatalogRecord[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell className="p-2" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface SubjectsCatalogTableProps {
  data: SubjectCatalogRecord[];
}

const SubjectsCatalogTable = ({ data }: SubjectsCatalogTableProps) => {
  const [filter, setFilter] = useState("");

  const filteredSubjects = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return data;

    return data.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.programCodes.some((code) => code.toLowerCase().includes(query))
    );
  }, [data, filter]);

  const groups = useMemo(
    () => groupSubjectsByProgramCode(filteredSubjects),
    [filteredSubjects]
  );

  const visibleCount = countSubjectsInProgramCodeGroups(groups);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search code, description, or program..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {data.length} subject{data.length === 1 ? "" : "s"}
        </p>
      </div>

      {data.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No subjects in the catalog yet.
        </p>
      )}

      {data.length > 0 && visibleCount === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No subjects match your search.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.programCode} className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-tight">
              {group.programCode}
            </h3>
            <p className="text-sm text-muted-foreground">
              {group.items.length} subject{group.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <ProgramSubjectsTable data={group.items} />
        </section>
      ))}
    </div>
  );
};

export default SubjectsCatalogTable;
