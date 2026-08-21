import type { CurriculumItem } from './types';

export function groupByYearSemester(items: CurriculumItem[]) {
  const grouped: Record<string, CurriculumItem[]> = {};
  for (const item of items) {
    const key = `Year ${item.yearLevel} • ${item.semester}`;
    grouped[key] ||= [];
    grouped[key].push(item);
  }
  return grouped;
}
