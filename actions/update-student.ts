"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendStudentCredentialsEmail } from "@/lib/mail";
import { UpdateStudentSchema } from "@/schemas";
import {
  applyStudentCurriculumShift,
  studentCurriculumFields,
} from "@/lib/student-curriculum";

function revalidateStudentPaths(studentId: string) {
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/curriculum");
  revalidatePath("/default");
  revalidatePath(`/dashboard/students/${studentId}/edit`);
  revalidatePath(`/dashboard/students/${studentId}/shift`);
  revalidatePath(`/dashboard/students/${studentId}/evaluate`);
  revalidatePath(`/dashboard/records/${studentId}`);
}

export const updateStudent = async (
  values: z.infer<typeof UpdateStudentSchema>
) => {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = UpdateStudentSchema.safeParse(values);
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

  const normalizedData = {
    studentId: validated.data.studentId.trim().toUpperCase(),
    email: validated.data.email.trim().toLowerCase(),
    fullName: validated.data.fullName.trim().replace(/\s+/g, " "),
    yearLevel: validated.data.yearLevel,
    ...studentCurriculumFields(selectedCurriculum),
  };

  try {
    const existing = await db.student.findUnique({
      where: { id: validated.data.id },
      select: {
        id: true,
        userId: true,
        email: true,
        studentId: true,
        course: true,
        curriculum: true,
        curriculumId: true,
      },
    });

    if (!existing) {
      return { error: "Student not found" };
    }

    const conflict = await db.student.findFirst({
      where: {
        id: { not: validated.data.id },
        OR: [
          { studentId: normalizedData.studentId },
          { email: normalizedData.email },
        ],
      },
      select: { id: true },
    });

    if (conflict) {
      return { error: "Student ID or email already exists" };
    }

    if (!existing.userId) {
      return { error: "Student account link is missing" };
    }

    if (normalizedData.email !== (existing.email ?? "")) {
      const emailTaken = await db.user.findFirst({
        where: {
          email: normalizedData.email,
          NOT: { id: existing.userId },
        },
        select: { id: true },
      });

      if (emailTaken) {
        return { error: "A user account with this email already exists" };
      }
    }

    const userId = existing.userId;
    const didShift = existing.curriculumId !== selectedCurriculum.id;
    const emailChanged =
      normalizedData.email !== (existing.email ?? "").trim().toLowerCase();
    const temporaryPassword = emailChanged
      ? `PASS-${randomBytes(4).toString("hex")}`
      : null;
    const hashedPassword = temporaryPassword
      ? await bcrypt.hash(temporaryPassword, 10)
      : null;

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: validated.data.id },
        data: normalizedData,
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          name: normalizedData.fullName,
          email: normalizedData.email,
          ...(hashedPassword
            ? { password: hashedPassword, mustChangePassword: true }
            : {}),
        },
      });

      if (didShift) {
        await applyStudentCurriculumShift(tx, {
          studentId: validated.data.id,
          from: {
            curriculumId: existing.curriculumId,
            programCode: existing.course,
            curriculumLabel: existing.curriculum,
          },
          toCurriculum: selectedCurriculum,
        });
      }
    });

    revalidateStudentPaths(validated.data.id);

    const base = didShift
      ? "Student updated and shifted to the new curriculum"
      : "Student updated successfully";

    if (!emailChanged || !temporaryPassword) {
      return { success: base };
    }

    const emailSent = await sendStudentCredentialsEmail(
      normalizedData.email,
      normalizedData.fullName,
      temporaryPassword,
      true
    );

    if (!emailSent) {
      return {
        success: `${base}, but the new password email failed to send`,
      };
    }

    return {
      success: `${base}. A new temporary password was emailed`,
    };
  } catch (error) {
    console.error("Update student error:", error);
    return { error: "Failed to update student" };
  }
};
