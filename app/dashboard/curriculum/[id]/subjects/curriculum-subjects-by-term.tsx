"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatSemesterLabel } from "@/lib/semester-terms";
import {
  countOfferingsInGroup,
  formatYearLevelLabel,
  groupOfferingsByYearAndSemester,
} from "@/lib/group-curriculum-offerings";

import { termSubjectColumns, type SubjectOfferingRecord } from "./columns";

interface CurriculumSubjectsByTermProps {
  subjects: SubjectOfferingRecord[];
}

function TermSubjectsTable({ data }: { data: SubjectOfferingRecord[] }) {
  const table = useReactTable({
    data,
    columns: termSubjectColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No subjects assigned for this term.
      </p>
    );
  }

  const totalUnits = data.reduce((sum, item) => sum + item.units, 0);

  return (
    <div className="space-y-2">
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
      <p className="text-right text-xs text-muted-foreground">
        {data.length} subject{data.length === 1 ? "" : "s"} · {totalUnits} total units
      </p>
    </div>
  );
}

export default function CurriculumSubjectsByTerm({
  subjects,
}: CurriculumSubjectsByTermProps) {
  const [filter, setFilter] = useState("");

  const filteredSubjects = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return subjects;

    return subjects.filter(
      (item) =>
        item.subjectCode.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.prerequisiteDisplay.toLowerCase().includes(query)
    );
  }, [subjects, filter]);

  const groups = useMemo(
    () => groupOfferingsByYearAndSemester(filteredSubjects),
    [filteredSubjects]
  );

  const visibleCount = countOfferingsInGroup(groups);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search code, description, or prerequisite..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {subjects.length} subject
          {subjects.length === 1 ? "" : "s"}
        </p>
      </div>

      {subjects.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No subjects assigned to this curriculum yet.
        </p>
      )}

      {subjects.length > 0 && visibleCount === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No subjects match your search.
        </p>
      )}

      {groups.map((yearGroup) => (
        <section key={yearGroup.yearLevel} className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">
            {formatYearLevelLabel(yearGroup.yearLevel)}
          </h3>

          <div className="grid gap-6 lg:grid-cols-2">
            {yearGroup.semesters.map((semesterGroup) => (
              <div
                key={`${yearGroup.yearLevel}-${semesterGroup.semester}`}
                className="space-y-3"
              >
                <h4 className="text-sm font-medium text-muted-foreground">
                  {formatSemesterLabel(semesterGroup.semester)}
                </h4>
                <TermSubjectsTable data={semesterGroup.items} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
