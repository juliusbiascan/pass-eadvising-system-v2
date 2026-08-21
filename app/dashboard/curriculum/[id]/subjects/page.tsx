import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";

import { auth } from "@/auth";
import { formatPrerequisiteDisplay } from "@/lib/curriculum-prerequisites";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import CurriculumSubjectsByTerm from "./curriculum-subjects-by-term";
import type { SubjectOfferingRecord } from "./columns";

export const metadata: Metadata = {
  title: "Curriculum Subjects",
  description: "Manage subjects for selected curriculum",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CurriculumSubjectsPage({ params }: PageProps) {
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
      batchLabel: true,
      versionTag: true,
      title: true,
    },
  });

  if (!curriculum) {
    notFound();
  }

  const offerings = await db.curriculumSubject.findMany({
    where: { curriculumId: curriculum.id },
    orderBy: [{ yearLevel: "asc" }, { semester: "asc" }, { displayOrder: "asc" }],
    include: {
      subject: {
        select: {
          id: true,
          code: true,
          description: true,
          units: true,
          dependentSubjects: {
            include: {
              prerequisite: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  const subjects: SubjectOfferingRecord[] = offerings.map((item) => {
    const subjectCodes = item.subject.dependentSubjects.map((link) =>
      link.prerequisite.code.trim()
    );

    return {
      id: item.id,
      subjectId: item.subject.id,
      curriculumId: curriculum.id,
      subjectCode: item.subject.code,
      description: item.subject.description,
      units: item.subject.units,
      yearLevel: item.yearLevel,
      semester: item.semester,
      displayOrder: item.displayOrder,
      prerequisiteDisplay: formatPrerequisiteDisplay(
        subjectCodes,
        item.prerequisiteNote
      ),
    };
  });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
              <Link href="/dashboard/curriculum">← Curriculum Management</Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">
              {curriculum.programCode} · {curriculum.batchLabel}
            </h2>
            <p className="text-muted-foreground">
              {curriculum.title} ({curriculum.versionTag === "OLD" ? "Old" : "New"}{" "}
              Curriculum) · {subjects.length} subjects
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/api/curriculum/${curriculum.id}/export`} download>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/dashboard/curriculum/${curriculum.id}/subjects/prerequisites`}
              >
                Prerequisites
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/curriculum/${curriculum.id}/subjects/create`}>
                Add Subject
              </Link>
            </Button>
          </div>
        </div>

        <CurriculumSubjectsByTerm subjects={subjects} />
      </div>
    </div>
  );
}
