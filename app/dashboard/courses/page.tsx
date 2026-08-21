import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import CoursesManager from "./courses-manager";

export const metadata: Metadata = {
  title: "Courses",
  description: "Manage degree programs used by curriculum and students",
};

export default async function CoursesPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await db.course.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: { curriculums: true },
      },
    },
  });

  const data = courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    isActive: course.isActive,
    curriculumsCount: course._count.curriculums,
    createdAt: course.createdAt,
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
            <p className="text-sm text-muted-foreground">
              Degree programs (BSCS, BSA, and others) used when creating or importing a
              curriculum. Add a course here instead of hardcoding program codes.
            </p>
          </div>
        </div>
        <CoursesManager courses={data} />
      </div>
    </div>
  );
}
