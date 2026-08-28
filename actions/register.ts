"use server";

import * as z from "zod/v4";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const userCount = await db.user.count();
  if (userCount > 0) {
    return { error: "Initial setup has already been completed." };
  }

  const { email, password, username } = validatedFields.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name: username,
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
      isRoot: true,
      emailVerified: new Date(),
    },
  });
  return { success: "Root admin account created! You can now log in." };
};
