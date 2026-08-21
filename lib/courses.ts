import { db } from "@/lib/db";

export type CourseOption = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
};

export const DEFAULT_COURSES = [
  { code: "BEED", title: "Bachelor of Elementary Education" },
  { code: "BSCS", title: "Bachelor of Science in Computer Science" },
  { code: "BSCRIM", title: "Bachelor of Science in Criminology" },
  { code: "BSTM", title: "Bachelor of Science in Tourism Management" },
  { code: "BSHM", title: "Bachelor of Science in Hospitality Management" },
  { code: "BSA", title: "Bachelor of Science in Accountancy" },
  { code: "BSBA", title: "Bachelor of Science in Business Administration" },
] as const;

export async function listCourses(options?: {
  activeOnly?: boolean;
}): Promise<CourseOption[]> {
  return db.course.findMany({
    where: options?.activeOnly ? { isActive: true } : undefined,
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      isActive: true,
    },
  });
}

export async function findCourseByCode(code: string) {
  return db.course.findUnique({
    where: { code: code.trim().toUpperCase() },
    select: {
      id: true,
      code: true,
      title: true,
      isActive: true,
    },
  });
}
