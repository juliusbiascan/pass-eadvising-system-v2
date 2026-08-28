"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { sendAdminCredentialsEmail } from "@/lib/mail";
import { requireAdmin } from "@/lib/staff-access";
import { AdminRegistrationSchema } from "@/schemas";

export const registerAdmin = async (
  values: z.infer<typeof AdminRegistrationSchema>
) => {
  const session = await requireAdmin();

  if (!session) {
    return { error: "Unauthorized" };
  }

  const validatedFields = AdminRegistrationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const temporaryPassword = `PASS-${randomBytes(4).toString("hex")}`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const normalizedData = {
    email: validatedFields.data.email.trim().toLowerCase(),
    fullName: validatedFields.data.fullName.trim().replace(/\s+/g, " "),
  };

  try {
    const existingUser = await db.user.findUnique({
      where: { email: normalizedData.email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "A user account with this email already exists" };
    }

    await db.user.create({
      data: {
        name: normalizedData.fullName,
        email: normalizedData.email,
        password: hashedPassword,
        emailVerified: new Date(),
        role: "ADMIN",
        isRoot: false,
        mustChangePassword: true,
      },
    });

    const emailSent = await sendAdminCredentialsEmail(
      normalizedData.email,
      normalizedData.fullName,
      temporaryPassword
    );

    revalidatePath("/dashboard/teams");

    if (!emailSent) {
      return {
        success: "Admin account created, but credentials email failed to send",
      };
    }

    return { success: "Admin registered successfully" };
  } catch (error) {
    console.error("Admin registration error:", error);
    return { error: "Failed to register admin" };
  }
};
