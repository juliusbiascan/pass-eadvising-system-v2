"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ShiftStudentCurriculumSchema } from "@/schemas";
import {
  applyStudentCurriculumShift,
  formatCurriculumAssignmentLabel,
  studentCurriculumFields,
} from "@/lib/student-curriculum";

export const shiftStudentCurriculum = async (
  values: z.infer<typeof ShiftStudentCurriculumSchema>
) => {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = ShiftStudentCurriculumSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid fields" };
  }

  const selectedCurriculum = await db.curriculum.findUnique({
    where: { id: validated.data.curriculumId },
    select: {
      id: true,
      programCode: true,
      batchLabel: true,
      versionTag: true,
    },
  });

  if (!selectedCurriculum) {
    return { error: "Selected curriculum does not exist" };
  }

  try {
    const existing = await db.student.findUnique({
      where: { id: validated.data.id },
      select: {
        id: true,
        course: true,
        curriculum: true,
        curriculumId: true,
      },
    });

    if (!existing) {
      return { error: "Student not found" };
    }

    if (existing.curriculumId === selectedCurriculum.id) {
      return { error: "Student is already in this curriculum" };
    }

    const summary = await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: validated.data.id },
        data: studentCurriculumFields(selectedCurriculum),
      });

      return applyStudentCurriculumShift(tx, {
        studentId: validated.data.id,
        from: {
          curriculumId: existing.curriculumId,
          programCode: existing.course,
          curriculumLabel: existing.curriculum,
        },
        toCurriculum: selectedCurriculum,
      });
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/curriculum");
    revalidatePath("/default");
    revalidatePath(`/dashboard/students/${validated.data.id}/edit`);
    revalidatePath(`/dashboard/students/${validated.data.id}/shift`);
    revalidatePath(`/dashboard/students/${validated.data.id}/evaluate`);
    revalidatePath(`/dashboard/records/${validated.data.id}`);

    const destination = formatCurriculumAssignmentLabel(selectedCurriculum);
    const carried =
      summary.copiedGrades === 1
        ? "1 subject grade copied to the new curriculum"
        : `${summary.copiedGrades} subject grades copied to the new curriculum`;

    return {
      success: `Student shifted to ${destination}. Previous course record was kept. ${carried}.`,
    };
  } catch (error) {
    console.error("Shift student curriculum error:", error);
    return { error: "Failed to shift student curriculum" };
  }
};
