import { SEMESTER_TERMS, type SemesterTermValue } from "@/lib/semester-terms";

export type CurriculumOfferingGroupItem<T> = {
  yearLevel: number;
  semesters: {
    semester: SemesterTermValue;
    items: T[];
  }[];
};

const YEAR_ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"] as const;

export function formatYearLevelLabel(yearLevel: number): string {
  const ordinal = YEAR_ORDINALS[yearLevel] ?? `${yearLevel}th`;
  return `${ordinal} Year`;
}

export function groupOfferingsByYearAndSemester<T extends { yearLevel: number; semester: SemesterTermValue }>(
  offerings: T[]
): CurriculumOfferingGroupItem<T>[] {
  const yearLevels = [...new Set(offerings.map((item) => item.yearLevel))].sort(
    (a, b) => a - b
  );

  return yearLevels.map((yearLevel) => ({
    yearLevel,
    semesters: SEMESTER_TERMS.map((semester) => ({
      semester,
      items: offerings
        .filter(
          (item) => item.yearLevel === yearLevel && item.semester === semester
        )
        .sort((a, b) => {
          const orderA = "displayOrder" in a ? Number(a.displayOrder) : 0;
          const orderB = "displayOrder" in b ? Number(b.displayOrder) : 0;
          return orderA - orderB;
        }),
    })),
  }));
}

export function countOfferingsInGroup<T>(
  groups: CurriculumOfferingGroupItem<T>[]
): number {
  return groups.reduce(
    (sum, year) =>
      sum + year.semesters.reduce((semSum, sem) => semSum + sem.items.length, 0),
    0
  );
}
