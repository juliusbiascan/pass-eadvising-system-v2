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
import { Columns3, GraduationCap, ListPlus, Search, X } from 'lucide-react';

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
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

import { createStudentColumns, type StudentRecord } from './columns';

interface StudentsTableProps {
  data: StudentRecord[];
  canRegister?: boolean;
  canManageProfile?: boolean;
}

const ALL_VALUE = 'all';

function columnLabel(columnId: string, fallback: string) {
  const labels: Record<string, string> = {
    studentId: 'Student ID',
    fullName: 'Student',
    course: 'Course',
    term: 'Current Term',
    curriculum: 'Curriculum',
    createdAt: 'Date Registered',
  };

  return labels[columnId] ?? fallback;
}

function matchesQuery(student: StudentRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    student.studentId,
    student.fullName,
    student.email ?? '',
    student.course,
    student.curriculum,
    formatYearLevelLabel(student.yearLevel),
    formatSemesterLabel(student.currentSemester),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

const StudentsTable = ({
  data,
  canRegister = true,
  canManageProfile = true,
}: StudentsTableProps) => {
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState(ALL_VALUE);
  const [yearFilter, setYearFilter] = useState(ALL_VALUE);
  const [semesterFilter, setSemesterFilter] = useState(ALL_VALUE);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo(
    () => createStudentColumns({ canManageProfile }),
    [canManageProfile]
  );

  const courses = useMemo(
    () => [...new Set(data.map((student) => student.course))].sort(),
    [data]
  );

  const yearLevels = useMemo(
    () =>
      [...new Set(data.map((student) => student.yearLevel))].sort(
        (a, b) => a - b
      ),
    [data]
  );

  const filteredData = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return data.filter((student) => {
      if (!matchesQuery(student, normalized)) {
        return false;
      }

      if (courseFilter !== ALL_VALUE && student.course !== courseFilter) {
        return false;
      }

      if (
        yearFilter !== ALL_VALUE &&
        student.yearLevel !== Number(yearFilter)
      ) {
        return false;
      }

      if (
        semesterFilter !== ALL_VALUE &&
        student.currentSemester !== semesterFilter
      ) {
        return false;
      }

      return true;
    });
  }, [courseFilter, data, query, semesterFilter, yearFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
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
    semesterFilter !== ALL_VALUE;

  const clearFilters = () => {
    setQuery('');
    setCourseFilter(ALL_VALUE);
    setYearFilter(ALL_VALUE);
    setSemesterFilter(ALL_VALUE);
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
              placeholder="Search name, ID, email, or curriculum..."
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
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No students registered</EmptyTitle>
              <EmptyDescription>
                {canRegister
                  ? 'Register a student to start evaluations, records, and advising.'
                  : 'No students are assigned to your departments yet.'}
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
              <EmptyTitle>No matching students</EmptyTitle>
              <EmptyDescription>
                Try a different name, student ID, course, or term filter.
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
              {filteredData.length === 1 ? 'student' : 'students'}
              {hasActiveFilters ? ` of ${data.length}` : ''}
            </span>
          </div>
          <DataTablePagination table={table} />
        </CardFooter>
      )}
    </Card>
  );
};

export default StudentsTable;
