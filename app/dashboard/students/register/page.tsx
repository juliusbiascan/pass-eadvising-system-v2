import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import RegisterStudentForm from "./register-student-form";

export const metadata: Metadata = {
  title: "Register Student",
  description: "Register a new student for academic advising",
};

export default async function RegisterStudentPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const curriculums = await db.curriculum.findMany({
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
  });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              Register Student
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add a new student record, assign a curriculum, and create a
              portal account for academic advising evaluation.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Link>
          </Button>
        </div>
        <RegisterStudentForm curriculums={curriculums} />
      </div>
    </div>
  );
}
