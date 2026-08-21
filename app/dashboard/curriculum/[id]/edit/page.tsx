import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { listCourses } from "@/lib/courses";

import EditCurriculumForm from "./edit-curriculum-form";

export const metadata: Metadata = {
  title: "Edit Curriculum",
  description: "Update curriculum version details",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCurriculumPage({ params }: PageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [curriculum, courses] = await Promise.all([
    db.curriculum.findUnique({
      where: { id },
      select: {
        id: true,
        programCode: true,
        title: true,
        batchLabel: true,
        batchYear: true,
        versionTag: true,
        isActive: true,
        notes: true,
      },
    }),
    listCourses(),
  ]);

  if (!curriculum) {
    notFound();
  }

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Curriculum</h2>
          <p className="text-sm text-muted-foreground">
            Update program details for {curriculum.programCode} ({curriculum.batchLabel}).
          </p>
        </div>
        <EditCurriculumForm curriculum={curriculum} courses={courses} />
      </div>
    </div>
  );
}
