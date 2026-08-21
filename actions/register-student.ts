"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendStudentCredentialsEmail } from "@/lib/mail";
import { StudentRegistrationSchema } from "@/schemas";

export const registerStudent = async (
  values: z.infer<typeof StudentRegistrationSchema>
) => {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validatedFields = StudentRegistrationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const temporaryPassword = `PASS-${randomBytes(4).toString("hex")}`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const selectedCurriculum = await db.curriculum.findUnique({
    where: { id: validatedFields.data.curriculumId },
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
    studentId: validatedFields.data.studentId.trim().toUpperCase(),
    email: validatedFields.data.email.trim().toLowerCase(),
    fullName: validatedFields.data.fullName.trim().replace(/\s+/g, " "),
    course: selectedCurriculum.programCode.toUpperCase(),
    yearLevel: validatedFields.data.yearLevel,
    curriculum: `${selectedCurriculum.programCode} - ${selectedCurriculum.batchLabel} (${selectedCurriculum.versionTag})`,
    curriculumId: selectedCurriculum.id,
  };

  try {
    const existingStudent = await db.student.findFirst({
      where: {
        OR: [
          { studentId: normalizedData.studentId },
          { email: normalizedData.email },
        ],
      },
      select: { id: true },
    });

    if (existingStudent) {
      return { error: "Student ID or email already exists" };
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "A user account with this email already exists" };
    }

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: normalizedData.fullName,
          email: normalizedData.email,
          password: hashedPassword,
          emailVerified: new Date(),
          role: "USER",
          mustChangePassword: true,
        },
      });

      await tx.student.create({
        data: {
          ...normalizedData,
          userId: user.id,
        },
      });
    });

    const emailSent = await sendStudentCredentialsEmail(
      normalizedData.email,
      normalizedData.fullName,
      temporaryPassword
    );

    revalidatePath("/dashboard/students");

    if (!emailSent) {
      return {
        success: "Student and account created, but credentials email failed to send",
      };
    }

    return { success: "Student registered successfully" };
  } catch (error) {
    console.error("Student registration error:", error);
    return { error: "Failed to register student" };
  }
};
