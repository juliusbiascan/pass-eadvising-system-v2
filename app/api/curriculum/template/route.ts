import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildCurriculumExcelTemplateBuffer } from "@/lib/curriculum-excel-export";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buffer = await buildCurriculumExcelTemplateBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Curriculum-Template.xlsx"',
    },
  });
}
