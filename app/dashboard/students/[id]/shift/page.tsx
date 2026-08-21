import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import ShiftCurriculumForm from "./shift-curriculum-form";

export const metadata: Metadata = {
  title: "Shift Curriculum",
  description: "Move a student to a different program or curriculum batch",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShiftStudentPage({ params }: PageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [student, curriculums] = await Promise.all([
    db.student.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        course: true,
        yearLevel: true,
        curriculum: true,
        curriculumId: true,
      },
    }),
    db.curriculum.findMany({
      orderBy: [{ programCode: "asc" }, { batchYear: "desc" }],
      select: {
        id: true,
        programCode: true,
        title: true,
        batchLabel: true,
        batchYear: true,
        versionTag: true,
        isActive: true,
      },
    }),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              Shift Curriculum
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Move {student.fullName} to a different program or curriculum
              batch. The previous course record stays in Record Management.
              Matching subject grades are copied to the new curriculum.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Link>
          </Button>
        </div>
        <ShiftCurriculumForm student={student} curriculums={curriculums} />
      </div>
    </div>
  );
}
