import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileUp } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import CurriculumList from "./curriculum-list";

export const metadata: Metadata = {
  title: "Curriculum Management",
  description: "Manage curriculum versions, subjects, and prerequisites",
};

export default async function CurriculumPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const curriculums = await db.curriculum.findMany({
    orderBy: [{ programCode: "asc" }, { batchYear: "desc" }],
    include: {
      _count: {
        select: {
          subjects: true,
          students: true,
        },
      },
    },
  });

  const data = curriculums.map((item) => ({
    id: item.id,
    programCode: item.programCode,
    title: item.title,
    batchLabel: item.batchLabel,
    batchYear: item.batchYear,
    versionTag: item.versionTag,
    isActive: item.isActive,
    subjectsCount: item._count.subjects,
    studentsCount: item._count.students,
    createdAt: item.createdAt,
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Curriculum Management</h2>
            <p className="text-sm text-muted-foreground">
              Curricula are grouped by program so you can compare batches and versions together.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/curriculum/import">
                <FileUp className="mr-2 h-4 w-4" />
                Import Curriculum
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/courses">Manage Courses</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/curriculum/subjects">Subject Catalog</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/curriculum/create">Create Curriculum</Link>
            </Button>
          </div>
        </div>
        <CurriculumList data={data} />
      </div>
    </div>
  );
}
