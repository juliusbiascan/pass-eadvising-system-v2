import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { GradeStatusBadge } from './grade-status-badge';
import { groupByYearSemester } from '../lib/utils';
import type { CurriculumItem, ExistingGrade, GradeStatus } from '../lib/types';

interface CurriculumViewProps {
  yearLevel: number;
  curriculumData: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
  maxYearLevel?: number;
}

function getCurriculumCopy(yearLevel: number, showsPriorYears: boolean, maxYearLevel?: number) {
  const displayYear =
    maxYearLevel != null ? Math.min(yearLevel, maxYearLevel) : yearLevel;
  const makeup = maxYearLevel != null && yearLevel > maxYearLevel;

  if (makeup) {
    return {
      title: `Curriculum — Years 1–${displayYear}`,
      description:
        'You are in a makeup term for leftover or failed subjects. Curriculum years below stay read-only; enter makeup grades under Grades.',
    };
  }

  if (showsPriorYears) {
    return {
      title: `Curriculum — Years 1–${displayYear}`,
      description:
        'Your standing includes earlier year levels. Prior terms show as read-only; enter grades for your current term under Grades.',
    };
  }

  return {
    title: `Curriculum — Year ${displayYear}`,
    description: 'Subjects for your current year level, grouped by semester.',
  };
}

function CurriculumSubjectRow({
  subject,
  status,
}: {
  subject: CurriculumItem;
  status: GradeStatus;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/60 p-3 transition-all duration-200 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <div className="font-medium">{subject.code}</div>
        <div className="text-sm text-muted-foreground">{subject.description}</div>
        <div className="text-xs text-muted-foreground">{subject.units} units</div>
      </div>
      <GradeStatusBadge status={status} />
    </div>
  );
}

function CurriculumTermGroup({
  label,
  items,
  yearLevel,
  existingGrades,
}: {
  label: string;
  items: CurriculumItem[];
  yearLevel: number;
  existingGrades: Record<string, ExistingGrade>;
}) {
  const termYearLevel = items[0]?.yearLevel ?? yearLevel;
  const isPriorTerm = termYearLevel < yearLevel;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        {isPriorTerm ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Prior term
          </span>
        ) : null}
      </div>
      <div className="grid gap-2">
        {items.map((subject) => (
          <CurriculumSubjectRow
            key={subject.id}
            subject={subject}
            status={existingGrades[subject.id]?.status || 'PENDING'}
          />
        ))}
      </div>
    </section>
  );
}

export function CurriculumView({
  yearLevel,
  curriculumData,
  existingGrades,
  maxYearLevel,
}: CurriculumViewProps) {
  const showsPriorYears = curriculumData.some((subject) => subject.yearLevel < yearLevel);
  const { title, description } = getCurriculumCopy(yearLevel, showsPriorYears, maxYearLevel);
  const groupedCurriculum = groupByYearSemester(curriculumData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {curriculumData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No curriculum subjects found for your year level.
          </p>
        ) : (
          groupedCurriculum.map(({ key, label, items }) => (
            <CurriculumTermGroup
              key={key}
              label={label}
              items={items}
              yearLevel={yearLevel}
              existingGrades={existingGrades}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
