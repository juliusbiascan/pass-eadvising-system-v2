import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { GradeStatusBadge } from './grade-status-badge';
import { groupByYearSemester } from '../lib/utils';
import type { CurriculumItem, ExistingGrade } from '../lib/types';

interface CurriculumViewProps {
  yearLevel: number;
  curriculumData: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
}

export function CurriculumView({
  yearLevel,
  curriculumData,
  existingGrades,
}: CurriculumViewProps) {
  const priorYearCount = curriculumData.filter((s) => s.yearLevel < yearLevel).length;
  const showsPriorYears = priorYearCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {showsPriorYears
            ? `Curriculum — Years 1–${yearLevel}`
            : `Curriculum — Year ${yearLevel}`}
        </CardTitle>
        <CardDescription>
          {showsPriorYears
            ? 'Your standing includes earlier year levels. Prior terms show as read-only; enter grades for your current term under Grades.'
            : 'Subjects for your current year level, grouped by semester.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {curriculumData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No curriculum subjects found for your year level.
          </p>
        ) : (
          Object.entries(groupByYearSemester(curriculumData)).map(([group, items]) => {
            const termYearLevel = items[0]?.yearLevel ?? yearLevel;
            const isPriorTerm = termYearLevel < yearLevel;

            return (
            <div key={group} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium">{group}</div>
                {isPriorTerm ? (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Prior term
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                {items.map((subject) => {
                  const status = existingGrades[subject.id]?.status || 'PENDING';

                  return (
                    <div
                      key={subject.id}
                      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/60 p-3 transition-all duration-200 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{subject.code}</div>
                        <div className="text-sm text-muted-foreground">{subject.description}</div>
                        <div className="text-xs text-muted-foreground">{subject.units} units</div>
                      </div>
                      <GradeStatusBadge status={status} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })
        )}
      </CardContent>
    </Card>
  );
}
