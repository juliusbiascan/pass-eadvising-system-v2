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
import { ListPlus, Search, UserCog } from 'lucide-react';

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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { headColumns, type HeadRecord } from './columns';

interface HeadsTableProps {
  data: HeadRecord[];
}

function matchesQuery(head: HeadRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [head.fullName, head.email, ...head.departments]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

const HeadsTable = ({ data }: HeadsTableProps) => {
  const [query, setQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const filteredData = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.filter((head) => matchesQuery(head, normalized));
  }, [data, query]);

  const table = useReactTable({
    data: filteredData,
    columns: headColumns,
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

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="relative min-w-0 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or department..."
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {data.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserCog />
              </EmptyMedia>
              <EmptyTitle>No heads registered</EmptyTitle>
              <EmptyDescription>
                Register a department head and assign the courses they can view.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/heads/register">
                  <ListPlus className="h-4 w-4" />
                  Register Head
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : filteredData.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No matching heads</EmptyTitle>
              <EmptyDescription>
                Try a different name, email, or department.
              </EmptyDescription>
            </EmptyHeader>
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
                        header.id === 'fullName'
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
                        cell.column.id === 'fullName'
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
              {filteredData.length === 1 ? 'head' : 'heads'}
              {query.trim() ? ` of ${data.length}` : ''}
            </span>
          </div>
          <DataTablePagination table={table} />
        </CardFooter>
      )}
    </Card>
  );
};

export default HeadsTable;
