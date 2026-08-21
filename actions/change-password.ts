"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChangePasswordSchema } from "@/schemas";

export const changePassword = async (
  values: z.infer<typeof ChangePasswordSchema>
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validatedFields = ChangePasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { currentPassword, password } = validatedFields.data;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      password: true,
      mustChangePassword: true,
      role: true,
    },
  });

  if (!user?.password) {
    return { error: "Unable to update password" };
  }

  if (!user.mustChangePassword) {
    return { error: "Password change is not required" };
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.password);

  if (!currentMatches) {
    return { error: "Current password is incorrect" };
  }

  const reusedPassword = await bcrypt.compare(password, user.password);

  if (reusedPassword) {
    return { error: "Choose a different password from your temporary one" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  redirect(user.role === "USER" ? "/default" : "/dashboard");
};
