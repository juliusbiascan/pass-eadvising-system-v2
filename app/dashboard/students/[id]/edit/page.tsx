import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import EditStudentForm from "./edit-student-form";

export const metadata: Metadata = {
  title: "Edit Student",
  description: "Update student details and curriculum assignment",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
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
        email: true,
        fullName: true,
        yearLevel: true,
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
            <h2 className="text-3xl font-bold tracking-tight">Edit Student</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Update {student.fullName}&apos;s record, year level, and
              curriculum. Changing the curriculum is a shift. The previous
              course record stays in Records, and matching subject grades are
              copied to the new curriculum.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/students/${student.id}/shift`}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Shift Curriculum
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/students">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Students
              </Link>
            </Button>
          </div>
        </div>
        <EditStudentForm student={student} curriculums={curriculums} />
      </div>
    </div>
  );
}
