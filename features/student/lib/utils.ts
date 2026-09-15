import { formatSemesterLabel } from '@/lib/semester-terms';

import { getTermIndex } from './graduation-outlook';
import type { CurriculumItem } from './types';

type GroupedCurriculumTerm = {
  key: string;
  label: string;
  yearLevel: number;
  items: CurriculumItem[];
};

export function groupByYearSemester(items: CurriculumItem[]): GroupedCurriculumTerm[] {
  const grouped = new Map<string, CurriculumItem[]>();

  for (const item of items) {
    const key = `${item.yearLevel}:${item.semester}`;
    const subjects = grouped.get(key);

    if (subjects) {
      subjects.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return [...grouped.entries()]
    .map(([key, subjects]) => {
      const yearLevel = subjects[0]?.yearLevel ?? 0;
      const semester = subjects[0]?.semester ?? '';

      return {
        key,
        label: `Year ${yearLevel} • ${formatSemesterLabel(semester)}`,
        yearLevel,
        items: [...subjects].sort((a, b) => a.displayOrder - b.displayOrder),
      };
    })
    .sort((a, b) => {
      const aTerm = a.items[0];
      const bTerm = b.items[0];

      return (
        getTermIndex(bTerm?.yearLevel ?? 0, bTerm?.semester ?? '') -
        getTermIndex(aTerm?.yearLevel ?? 0, aTerm?.semester ?? '')
      );
    });
}
