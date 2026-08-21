import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { listCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";

import ImportCurriculumForm from "./import-curriculum-form";

export const metadata: Metadata = {
  title: "Import Curriculum",
  description: "Import one or more curricula from an Excel workbook",
};

export default async function ImportCurriculumPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await listCourses({ activeOnly: true });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              Import Curriculum
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Upload a PASS Excel workbook with one curriculum per worksheet.
              Matching programs are detected automatically, and existing
              curricula require confirmation before codes are changed or
              replaced.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/curriculum">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curriculum
            </Link>
          </Button>
        </div>
        <ImportCurriculumForm courses={courses} />
      </div>
    </div>
  );
}
