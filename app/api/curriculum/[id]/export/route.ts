import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { formatPrerequisiteDisplay } from "@/lib/curriculum-prerequisites";
import {
  type CurriculumExportOffering,
  type OfferingPrerequisiteDisplay,
} from "@/lib/curriculum-excel";
import { buildCurriculumExcelBuffer } from "@/lib/curriculum-excel-export";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const curriculum = await db.curriculum.findUnique({
    where: { id },
    include: {
      subjects: {
        include: {
          subject: {
            include: {
              dependentSubjects: {
                include: { prerequisite: { select: { code: true } } },
              },
            },
          },
        },
        orderBy: [
          { yearLevel: "asc" },
          { semester: "asc" },
          { displayOrder: "asc" },
        ],
      },
    },
  });

  if (!curriculum) {
    return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
  }

  const prerequisiteByOfferingId = new Map<string, OfferingPrerequisiteDisplay>();
  const offerings: CurriculumExportOffering[] = curriculum.subjects.map(
    (entry) => {
      const subjectCodes = entry.subject.dependentSubjects.map((link) =>
        link.prerequisite.code.trim()
      );

      prerequisiteByOfferingId.set(entry.id, {
        subjectCodes,
        standingLabel: entry.prerequisiteNote,
      });

      return {
        id: entry.id,
        yearLevel: entry.yearLevel,
        semester: entry.semester,
        displayOrder: entry.displayOrder,
        subject: {
          code: entry.subject.code,
          description: entry.subject.description,
          units: entry.subject.units,
          prerequisiteCodes: formatPrerequisiteDisplay(subjectCodes, entry.prerequisiteNote)
            .split(", ")
            .filter((part) => part !== "none"),
        },
      };
    }
  );

  const buffer = await buildCurriculumExcelBuffer({
    programCode: curriculum.programCode,
    title: curriculum.title,
    batchLabel: curriculum.batchLabel,
    batchYear: curriculum.batchYear,
    offerings,
    prerequisiteByOfferingId,
  });

  const filename = `${curriculum.programCode}-Curriculum-${curriculum.batchYear}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
