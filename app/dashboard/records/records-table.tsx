'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Columns3, FolderOpen, ListPlus, Search, X } from 'lucide-react';

import { DataTablePagination } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StudentRecordListItem } from '@/features/dashboard/lib/get-student-academic-record';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

import { recordColumns } from './columns';

interface RecordsTableProps {
  data: StudentRecordListItem[];
  canRegister?: boolean;
}

const ALL_VALUE = 'all';

type ProgressFilter = 'all' | 'complete' | 'incomplete' | 'unassigned';

function columnLabel(columnId: string, fallback: string) {
  const labels: Record<string, string> = {
    studentId: 'Student ID',
    fullName: 'Student',
    course: 'Course',
    term: 'Current Term',
    curriculum: 'Curriculum',
    progress: 'Grades',
  };

  return labels[columnId] ?? fallback;
}

function isAssigned(record: StudentRecordListItem) {
  return Boolean(record.curriculumId) && record.curriculum !== 'Not Assigned';
}

function matchesProgress(record: StudentRecordListItem, filter: ProgressFilter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'unassigned') {
    return !isAssigned(record);
  }

  if (!isAssigned(record) || record.totalSubjects === 0) {
    return false;
  }

  const complete = record.gradesEntered >= record.totalSubjects;

  if (filter === 'complete') {
    return complete;
  }

  return !complete;
}

function matchesQuery(record: StudentRecordListItem, query: string) {
  if (!query) {
    return true;
  }

  if (query === 'shifted' || query === 'prior') {
    return record.priorCurriculumCount > 0;
  }

  const haystack = [
    record.studentId,
    record.fullName,
    record.course,
    record.curriculum,
    formatYearLevelLabel(record.yearLevel),
    formatSemesterLabel(record.currentSemester),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export default function RecordsTable({
  data,
  canRegister = true,
}: RecordsTableProps) {
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState(ALL_VALUE);
  const [yearFilter, setYearFilter] = useState(ALL_VALUE);
  const [semesterFilter, setSemesterFilter] = useState(ALL_VALUE);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const courses = useMemo(
    () => [...new Set(data.map((record) => record.course))].sort(),
    [data]
  );

  const yearLevels = useMemo(
    () =>
      [...new Set(data.map((record) => record.yearLevel))].sort((a, b) => a - b),
    [data]
  );

  const filteredData = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return data.filter((record) => {
      if (!matchesQuery(record, normalized)) {
        return false;
      }

      if (courseFilter !== ALL_VALUE && record.course !== courseFilter) {
        return false;
      }

      if (yearFilter !== ALL_VALUE && record.yearLevel !== Number(yearFilter)) {
        return false;
      }

      if (
        semesterFilter !== ALL_VALUE &&
        record.currentSemester !== semesterFilter
      ) {
        return false;
      }

      return matchesProgress(record, progressFilter);
    });
  }, [
    courseFilter,
    data,
    progressFilter,
    query,
    semesterFilter,
    yearFilter,
  ]);

  const table = useReactTable({
    data: filteredData,
    columns: recordColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const hasActiveFilters =
    query.trim().length > 0 ||
    courseFilter !== ALL_VALUE ||
    yearFilter !== ALL_VALUE ||
    semesterFilter !== ALL_VALUE ||
    progressFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setCourseFilter(ALL_VALUE);
    setYearFilter(ALL_VALUE);
    setSemesterFilter(ALL_VALUE);
    setProgressFilter('all');
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, ID, course, or curriculum..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[140px]" size="sm">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[140px]" size="sm">
                <SelectValue placeholder="Year level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All years</SelectItem>
                {yearLevels.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {formatYearLevelLabel(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[150px]" size="sm">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All semesters</SelectItem>
                <SelectItem value="FIRST">1st Semester</SelectItem>
                <SelectItem value="SECOND">2nd Semester</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={progressFilter}
              onValueChange={(value) =>
                setProgressFilter(value as ProgressFilter)
              }
            >
              <SelectTrigger className="w-[150px]" size="sm">
                <SelectValue placeholder="Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnLabel(column.id, column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {data.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>No academic records yet</EmptyTitle>
              <EmptyDescription>
                {canRegister
                  ? 'Register a student to start managing grades and evaluations by term.'
                  : 'No academic records are available for your assigned departments yet.'}
              </EmptyDescription>
            </EmptyHeader>
            {canRegister ? (
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/students/register">
                    <ListPlus className="h-4 w-4" />
                    Register Student
                  </Link>
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : filteredData.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No matching records</EmptyTitle>
              <EmptyDescription>
                Try a different name, student ID, course, term, or grade status.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={
                        header.id === 'studentId'
                          ? 'pl-4'
                          : header.id === 'actions'
                            ? 'pr-4'
                            : undefined
                      }
                    >
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
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === 'studentId'
                          ? 'pl-4'
                          : cell.column.id === 'actions'
                            ? 'pr-4'
                            : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {filteredData.length > 0 && (
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{filteredData.length}</Badge>
            <span>
              {filteredData.length === 1 ? 'record' : 'records'}
              {hasActiveFilters ? ` of ${data.length}` : ''}
            </span>
          </div>
          <DataTablePagination table={table} />
        </CardFooter>
      )}
    </Card>
  );
}
