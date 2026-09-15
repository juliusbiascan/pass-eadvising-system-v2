'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, ClipboardList, Search } from 'lucide-react';

import GradeForm from '@/app/dashboard/students/[id]/evaluate/grade-form';
import { Badge } from '@/components/ui/badge';
import { EvaluationStatusBadge, GradeStatusBadge } from '@/components/status-badge';
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RecordTermGroup } from '@/features/dashboard/lib/get-student-academic-record';
import { formatEvaluatorLabel, formatEvaluationDate, isEvaluationApproved, isEvaluationEvaluated } from '@/lib/evaluation';
import type { GradePassSettings } from '@/lib/grade-evaluation';
import type { GradeStatus } from '@/app/generated/prisma/enums';
import {
  countOfferingsInGroup,
  formatYearLevelLabel,
  groupOfferingsByYearAndSemester,
} from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';

type StudentRecordByTermProps = {
  studentId: string;
  studentName: string;
  studentCourse: string;
  curriculumId: string;
  terms: RecordTermGroup[];
  existingGrades: Record<string, { grade?: string; status?: string }>;
  gradePassSettings: GradePassSettings;
  currentTermKey: string;
  defaultCompleterName: string;
  staffRole?: 'ADMIN' | 'HEAD';
  readOnly?: boolean;
};

function formatSubmittedAt(value: string) {
  return formatEvaluationDate(value) ?? value;
}

export default function StudentRecordByTerm({
  studentId,
  studentName,
  studentCourse,
  curriculumId,
  terms,
  existingGrades,
  gradePassSettings,
  currentTermKey,
  defaultCompleterName,
  staffRole,
  readOnly = false,
}: StudentRecordByTermProps) {
  const [filter, setFilter] = useState('');

  const allSubjects = useMemo(
    () => terms.flatMap((term) => term.subjects),
    [terms]
  );

  const termByKey = useMemo(
    () => new Map(terms.map((term) => [term.key, term])),
    [terms]
  );

  const filteredSubjects = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return allSubjects;

    return allSubjects.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }, [allSubjects, filter]);

  const groups = useMemo(
    () => groupOfferingsByYearAndSemester(filteredSubjects),
    [filteredSubjects]
  );

  const visibleCount = countOfferingsInGroup(groups);

  if (allSubjects.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen />
          </EmptyMedia>
          <EmptyTitle>No subjects in this curriculum</EmptyTitle>
          <EmptyDescription>
            Add offerings under Curriculum management before entering grades.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search code or description..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {allSubjects.length} subject
          {allSubjects.length === 1 ? '' : 's'}
        </p>
      </div>

      {visibleCount === 0 && (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No matching subjects</EmptyTitle>
            <EmptyDescription>
              Try a different subject code or description.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {groups.map((yearGroup) => {
        const yearSubjectCount = yearGroup.semesters.reduce(
          (sum, semester) => sum + semester.items.length,
          0
        );

        return (
          <section key={yearGroup.yearLevel} className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight">
                {formatYearLevelLabel(yearGroup.yearLevel)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {yearSubjectCount} subject{yearSubjectCount === 1 ? '' : 's'}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {yearGroup.semesters.map((semesterGroup) => {
                const termKey = `${yearGroup.yearLevel}-${semesterGroup.semester}`;
                const term = termByKey.get(termKey);
                const canActOnTerm = !readOnly;
                const isCurrentTerm = canActOnTerm && termKey === currentTermKey;
                const items = semesterGroup.items;
                const termLabel =
                  term?.label ??
                  `${formatYearLevelLabel(yearGroup.yearLevel)} • ${formatSemesterLabel(semesterGroup.semester)}`;

                if (items.length === 0) {
                  if (filter.trim()) {
                    return null;
                  }

                  return (
                    <Card key={termKey} id={termKey}>
                      <CardHeader className="border-b">
                        <CardTitle>{formatSemesterLabel(semesterGroup.semester)}</CardTitle>
                        <CardDescription>No subjects assigned for this term.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Empty className="py-6">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <BookOpen />
                            </EmptyMedia>
                            <EmptyTitle>No subjects</EmptyTitle>
                            <EmptyDescription>
                              This term has no offerings in the assigned curriculum.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </CardContent>
                    </Card>
                  );
                }

                const filledCount = items.filter(
                  (subject) =>
                    existingGrades[subject.id]?.grade ||
                    existingGrades[subject.id]?.status !== 'PENDING'
                ).length;
                const percent = Math.round((filledCount / items.length) * 100);

                const offerings = items.map((subject) => ({
                  id: subject.id,
                  subjectId: subject.subjectId,
                  code: subject.code,
                  description: subject.description,
                  units: subject.units,
                }));

                return (
                  <Card key={termKey} id={termKey}>
                    <CardHeader className="border-b">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>
                              {formatSemesterLabel(semesterGroup.semester)}
                            </CardTitle>
                            {isCurrentTerm && (
                              <Badge
                                variant="outline"
                                className="border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                              >
                                Current term
                              </Badge>
                            )}
                            {term?.isMakeupTerm ? (
                              <Badge
                                variant="outline"
                                className="border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                              >
                                Makeup term
                              </Badge>
                            ) : null}
                            {term?.evaluationStatus && (
                              <EvaluationStatusBadge status={term.evaluationStatus} />
                            )}
                          </div>
                          <CardDescription>
                            {filledCount} of {items.length} with grades or status set
                            {term?.evaluationSubmittedAt
                              ? isEvaluationApproved(term.evaluationStatus)
                                ? ` · Approved ${formatSubmittedAt(term.evaluationApprovedAt || term.evaluationSubmittedAt)}`
                                : isEvaluationEvaluated(term.evaluationStatus)
                                  ? ` · Evaluated ${formatSubmittedAt(term.evaluationSubmittedAt)}`
                                  : ''
                              : ''}
                            {isEvaluationEvaluated(term?.evaluationStatus)
                              ? ` · ${formatEvaluatorLabel(
                                  term?.evaluationCompletedByName,
                                  term?.evaluationCompletedByPosition
                                )}`
                              : ''}
                          </CardDescription>
                          {term?.evaluationRemarks ? (
                            <p className="text-xs text-muted-foreground">
                              Remarks: {term.evaluationRemarks}
                            </p>
                          ) : null}
                        </div>
                        {isCurrentTerm && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/students/${studentId}/evaluate`}>
                              <ClipboardList className="h-4 w-4" />
                              {staffRole === 'ADMIN'
                                ? 'Review evaluation'
                                : 'Evaluate term'}
                            </Link>
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1 pt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Grade progress</span>
                          <span className="tabular-nums">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {readOnly ? (
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Code</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Units</TableHead>
                              <TableHead className="text-right">Grade</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((subject) => {
                              const saved = existingGrades[subject.id];
                              const status = (
                                saved?.status === 'PASSED' ||
                                saved?.status === 'FAILED' ||
                                saved?.status === 'INCOMPLETE' ||
                                saved?.status === 'PENDING'
                                  ? saved.status
                                  : 'PENDING'
                              ) as GradeStatus;

                              return (
                                <TableRow key={subject.id}>
                                  <TableCell className="font-medium">
                                    {subject.code}
                                  </TableCell>
                                  <TableCell>
                                    <p className="max-w-[220px] truncate">
                                      {subject.description}
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {subject.units}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {saved?.grade || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <GradeStatusBadge status={status} />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <GradeForm
                          studentId={studentId}
                          curriculumId={curriculumId}
                          semester={semesterGroup.semester}
                          termYearLevel={yearGroup.yearLevel}
                          termSemester={semesterGroup.semester}
                          offerings={offerings}
                          existingGrades={existingGrades}
                          isAdmin
                          staffRole={staffRole}
                          gradePassSettings={gradePassSettings}
                          evaluationStatus={term?.evaluationStatus ?? 'PENDING'}
                          evaluatedByName={term?.evaluationCompletedByName}
                          evaluatedByPosition={term?.evaluationCompletedByPosition}
                          evaluatedAt={term?.evaluationSubmittedAt}
                          showTermActions={canActOnTerm}
                          layout="table"
                          showHelpText={false}
                          studentName={studentName}
                          studentCourse={studentCourse}
                          termLabel={termLabel}
                          defaultCompleterName={defaultCompleterName}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
