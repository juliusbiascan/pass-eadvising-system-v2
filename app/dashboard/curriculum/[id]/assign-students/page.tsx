import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import AssignStudentsManager from "./assign-students-manager";

export const metadata: Metadata = {
  title: "Assign Students",
  description: "Assign students to a curriculum",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CurriculumAssignStudentsPage({
  params,
}: PageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const curriculum = await db.curriculum.findUnique({
    where: { id },
    select: {
      id: true,
      programCode: true,
      title: true,
      batchLabel: true,
      versionTag: true,
      isActive: true,
    },
  });

  if (!curriculum) {
    notFound();
  }

  const students = await db.student.findMany({
    orderBy: [{ fullName: "asc" }, { studentId: "asc" }],
    select: {
      id: true,
      studentId: true,
      fullName: true,
      yearLevel: true,
      course: true,
      curriculum: true,
      curriculumId: true,
    },
  });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              Assign Students
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add or remove students for {curriculum.programCode} ·{" "}
              {curriculum.title}. Only this curriculum batch is affected.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/curriculum">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curriculum
            </Link>
          </Button>
        </div>
        <AssignStudentsManager curriculum={curriculum} students={students} />
      </div>
    </div>
  );
}
