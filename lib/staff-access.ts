import { auth } from "@/auth";
import { db } from "@/lib/db";

export type StaffRole = "ADMIN" | "HEAD";

export type AssignedCourse = {
  id: string;
  code: string;
  title: string;
};

export type DashboardAccess = {
  userId: string;
  role: StaffRole;
  /** `null` means unrestricted (admin). */
  courseCodes: string[] | null;
  courses: AssignedCourse[];
};

export function isAdminRole(role?: string | null): role is "ADMIN" {
  return role === "ADMIN";
}

export function isHeadRole(role?: string | null): role is "HEAD" {
  return role === "HEAD";
}

export function isDashboardStaffRole(role?: string | null): role is StaffRole {
  return isAdminRole(role) || isHeadRole(role);
}

export function canEvaluateTerm(role?: string | null) {
  return isHeadRole(role);
}

export function canApproveTerm(role?: string | null) {
  return isAdminRole(role);
}

export function studentScopeWhere(courseCodes: string[] | null) {
  if (courseCodes === null) {
    return {};
  }

  return { course: { in: courseCodes } };
}

export function canAccessStudentCourse(
  access: DashboardAccess,
  course: string
) {
  if (access.courseCodes === null) {
    return true;
  }

  return access.courseCodes.includes(course);
}

export async function getDashboardAccess(): Promise<DashboardAccess | null> {
  const session = await auth();

  if (!session?.user?.id || !isDashboardStaffRole(session.user.role)) {
    return null;
  }

  if (session.user.role === "ADMIN") {
    return {
      userId: session.user.id,
      role: "ADMIN",
      courseCodes: null,
      courses: [],
    };
  }

  const head = await db.head.findUnique({
    where: { userId: session.user.id },
    select: {
      courses: {
        select: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: {
          course: { code: "asc" },
        },
      },
    },
  });

  const courses = head?.courses.map((assignment) => assignment.course) ?? [];

  return {
    userId: session.user.id,
    role: "HEAD",
    courseCodes: courses.map((course) => course.code),
    courses,
  };
}

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function requireStudentRecordAccess(studentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      email: true,
      course: true,
      curriculumId: true,
      yearLevel: true,
      currentSemester: true,
    },
  });

  if (!student) {
    return { error: "Student not found" as const };
  }

  if (session.user.role === "ADMIN") {
    return { session, student, access: "staff" as const };
  }

  if (session.user.role === "HEAD") {
    const access = await getDashboardAccess();
    if (!access || !canAccessStudentCourse(access, student.course)) {
      return { error: "Unauthorized" as const };
    }

    return { session, student, access: "staff" as const };
  }

  if (session.user.role === "USER" && student.email === session.user.email) {
    return { session, student, access: "self" as const };
  }

  return { error: "Unauthorized" as const };
}
