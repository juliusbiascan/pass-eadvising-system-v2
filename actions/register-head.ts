"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { sendHeadCredentialsEmail } from "@/lib/mail";
import { requireAdmin } from "@/lib/staff-access";
import { HeadRegistrationSchema } from "@/schemas";

export const registerHead = async (
  values: z.infer<typeof HeadRegistrationSchema>
) => {
  const session = await requireAdmin();

  if (!session) {
    return { error: "Unauthorized" };
  }

  const validatedFields = HeadRegistrationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const temporaryPassword = `PASS-${randomBytes(4).toString("hex")}`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const normalizedData = {
    email: validatedFields.data.email.trim().toLowerCase(),
    fullName: validatedFields.data.fullName.trim().replace(/\s+/g, " "),
    courseIds: [...new Set(validatedFields.data.courseIds)],
  };

  try {
    const courses = await db.course.findMany({
      where: { id: { in: normalizedData.courseIds } },
      select: { id: true, code: true, title: true, isActive: true },
    });

    if (courses.length !== normalizedData.courseIds.length) {
      return { error: "One or more selected departments do not exist" };
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "A user account with this email already exists" };
    }

    const existingHead = await db.head.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (existingHead) {
      return { error: "A head account with this email already exists" };
    }

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: normalizedData.fullName,
          email: normalizedData.email,
          password: hashedPassword,
          emailVerified: new Date(),
          role: "HEAD",
          mustChangePassword: true,
        },
      });

      await tx.head.create({
        data: {
          email: normalizedData.email,
          fullName: normalizedData.fullName,
          userId: user.id,
          courses: {
            create: courses.map((course) => ({
              courseId: course.id,
            })),
          },
        },
      });
    });

    const emailSent = await sendHeadCredentialsEmail(
      normalizedData.email,
      normalizedData.fullName,
      temporaryPassword,
      courses.map((course) => `${course.code} — ${course.title}`)
    );

    revalidatePath("/dashboard/heads");

    if (!emailSent) {
      return {
        success: "Head account created, but credentials email failed to send",
      };
    }

    return { success: "Head registered successfully" };
  } catch (error) {
    console.error("Head registration error:", error);
    return { error: "Failed to register head" };
  }
};
