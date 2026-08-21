'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  Search,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

import {
  CurriculumRowActions,
  type CurriculumRecord,
} from './columns';

type ProgramGroup = {
  programCode: string;
  title: string;
  batches: CurriculumRecord[];
  activeCount: number;
  totalSubjects: number;
  totalStudents: number;
};

function groupByProgram(curriculums: CurriculumRecord[]): ProgramGroup[] {
  const groups = new Map<string, ProgramGroup>();

  for (const curriculum of curriculums) {
    const existing = groups.get(curriculum.programCode);

    if (existing) {
      existing.batches.push(curriculum);
      existing.activeCount += curriculum.isActive ? 1 : 0;
      existing.totalSubjects += curriculum.subjectsCount;
      existing.totalStudents += curriculum.studentsCount;
      continue;
    }

    groups.set(curriculum.programCode, {
      programCode: curriculum.programCode,
      title: curriculum.title,
      batches: [curriculum],
      activeCount: curriculum.isActive ? 1 : 0,
      totalSubjects: curriculum.subjectsCount,
      totalStudents: curriculum.studentsCount,
    });
  }

  return Array.from(groups.values())
    .map((group) => {
      const batches = [...group.batches].sort((a, b) => {
        if (b.batchYear !== a.batchYear) return b.batchYear - a.batchYear;
        return a.versionTag.localeCompare(b.versionTag);
      });

      return {
        ...group,
        title: batches[0]?.title ?? group.title,
        batches,
      };
    })
    .sort((a, b) => a.programCode.localeCompare(b.programCode));
}

function matchesQuery(curriculum: CurriculumRecord, query: string) {
  const haystack = [
    curriculum.programCode,
    curriculum.title,
    curriculum.batchLabel,
    String(curriculum.batchYear),
    curriculum.versionTag === 'OLD' ? 'old curriculum' : 'new curriculum',
    curriculum.isActive ? 'active' : 'inactive',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

interface CurriculumListProps {
  data: CurriculumRecord[];
}

const CurriculumList = ({ data }: CurriculumListProps) => {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? data.filter((curriculum) => matchesQuery(curriculum, normalized))
      : data;

    return groupByProgram(filtered);
  }, [data, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search program, batch, or version..."
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap />
            </EmptyMedia>
            <EmptyTitle>
              {query.trim() ? 'No matching curricula' : 'No curricula yet'}
            </EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? 'Try a different program code, batch year, or version.'
                : 'Create or import a curriculum to start grouping batches by program.'}
            </EmptyDescription>
          </EmptyHeader>
          {!query.trim() && (
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/curriculum/create">Create Curriculum</Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="space-y-4">
          {groups.map((program) => (
            <Card key={program.programCode}>
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-xs font-semibold tracking-wide text-primary">
                      {program.programCode}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-lg">{program.title}</CardTitle>
                      <CardDescription>
                        {program.batches.length} batch
                        {program.batches.length === 1 ? '' : 'es'} ·{' '}
                        {program.activeCount} active · {program.totalStudents}{' '}
                        student{program.totalStudents === 1 ? '' : 's'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{program.programCode}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Batch</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Subjects
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Students
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {program.batches.map((curriculum) => (
                      <TableRow key={curriculum.id}>
                        <TableCell className="pl-4">
                          <div className="space-y-0.5">
                            <p className="font-medium">{curriculum.batchYear}</p>
                            <p className="text-xs text-muted-foreground">
                              {curriculum.batchLabel}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              curriculum.versionTag === 'NEW'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {curriculum.versionTag === 'OLD'
                              ? 'Old Curriculum'
                              : 'New Curriculum'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" />
                            {curriculum.subjectsCount}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {curriculum.studentsCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={curriculum.isActive ? 'secondary' : 'outline'}
                          >
                            {curriculum.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4 whitespace-nowrap">
                          <CurriculumRowActions curriculum={curriculum} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumList;
