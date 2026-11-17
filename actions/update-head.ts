"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { sendHeadCredentialsEmail } from "@/lib/mail";
import { requireAdmin } from "@/lib/staff-access";
import { UpdateHeadSchema } from "@/schemas";

export const updateHead = async (values: z.infer<typeof UpdateHeadSchema>) => {
  const session = await requireAdmin();

  if (!session) {
    return { error: "Unauthorized" };
  }

  const validatedFields = UpdateHeadSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const normalizedData = {
    id: validatedFields.data.id,
    email: validatedFields.data.email.trim().toLowerCase(),
    fullName: validatedFields.data.fullName.trim().replace(/\s+/g, " "),
    courseIds: [...new Set(validatedFields.data.courseIds)],
  };

  try {
    const existingHead = await db.head.findUnique({
      where: { id: normalizedData.id },
      select: { id: true, userId: true, email: true },
    });

    if (!existingHead) {
      return { error: "Head record not found" };
    }

    const courses = await db.course.findMany({
      where: { id: { in: normalizedData.courseIds } },
      select: { id: true, code: true, title: true },
    });

    if (courses.length !== normalizedData.courseIds.length) {
      return { error: "One or more selected departments do not exist" };
    }

    const emailOwner = await db.user.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== existingHead.userId) {
      return { error: "A user account with this email already exists" };
    }

    const headEmailOwner = await db.head.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (headEmailOwner && headEmailOwner.id !== existingHead.id) {
      return { error: "A head account with this email already exists" };
    }

    const emailChanged =
      normalizedData.email !== existingHead.email.trim().toLowerCase();
    const temporaryPassword = emailChanged
      ? `PASS-${randomBytes(4).toString("hex")}`
      : null;
    const hashedPassword = temporaryPassword
      ? await bcrypt.hash(temporaryPassword, 10)
      : null;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingHead.userId },
        data: {
          name: normalizedData.fullName,
          email: normalizedData.email,
          ...(hashedPassword
            ? { password: hashedPassword, mustChangePassword: true }
            : {}),
        },
      });

      await tx.head.update({
        where: { id: existingHead.id },
        data: {
          fullName: normalizedData.fullName,
          email: normalizedData.email,
        },
      });

      await tx.headCourse.deleteMany({
        where: { headId: existingHead.id },
      });

      await tx.headCourse.createMany({
        data: courses.map((course) => ({
          headId: existingHead.id,
          courseId: course.id,
        })),
      });
    });

    revalidatePath("/dashboard/heads");
    revalidatePath(`/dashboard/heads/${existingHead.id}/edit`);

    if (!emailChanged || !temporaryPassword) {
      return { success: "Head updated successfully" };
    }

    const emailSent = await sendHeadCredentialsEmail(
      normalizedData.email,
      normalizedData.fullName,
      temporaryPassword,
      courses.map((course) => `${course.code} — ${course.title}`),
      true
    );

    if (!emailSent) {
      return {
        success: "Head updated successfully, but the new password email failed to send",
      };
    }

    return {
      success: "Head updated successfully. A new temporary password was emailed",
    };
  } catch (error) {
    console.error("Head update error:", error);
    return { error: "Failed to update head" };
  }
};
