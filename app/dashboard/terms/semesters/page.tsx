import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { isSemesterTerm } from "@/lib/semester-terms";

import SemestersOfferings, {
  type SemesterOffering,
} from "./semesters-offerings";

export const metadata: Metadata = {
  title: "Semesters",
  description: "Semester offering overview",
};

export default async function SemestersPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const rows = await db.curriculumSubject.findMany({
    select: {
      id: true,
      semester: true,
      yearLevel: true,
      displayOrder: true,
      curriculumId: true,
      curriculum: {
        select: {
          programCode: true,
          title: true,
          batchLabel: true,
          versionTag: true,
          isActive: true,
        },
      },
      subject: {
        select: {
          code: true,
          description: true,
          units: true,
        },
      },
    },
    orderBy: [
      { semester: "asc" },
      { yearLevel: "asc" },
      { displayOrder: "asc" },
    ],
  });

  const offerings: SemesterOffering[] = rows.flatMap((row) => {
    if (!isSemesterTerm(row.semester)) {
      return [];
    }

    return [
      {
        id: row.id,
        yearLevel: row.yearLevel,
        semester: row.semester,
        displayOrder: row.displayOrder,
        curriculumId: row.curriculumId,
        programCode: row.curriculum.programCode,
        programTitle: row.curriculum.title,
        batchLabel: row.curriculum.batchLabel,
        versionTag: row.curriculum.versionTag,
        isActive: row.curriculum.isActive,
        code: row.subject.code,
        description: row.subject.description,
        units: row.subject.units,
      },
    ];
  });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Semesters</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Browse every subject offering by 1st or 2nd semester, then by
              program, curriculum batch, and year level.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/terms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Terms
            </Link>
          </Button>
        </div>

        <SemestersOfferings offerings={offerings} />
      </div>
    </div>
  );
}
