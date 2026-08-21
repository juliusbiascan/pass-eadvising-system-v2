import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChangePasswordForm } from "@/features/student/components/change-password-form";

export const metadata = {
  title: "Set a new password",
  description: "Replace your temporary password to continue to the student portal",
};

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  if (!user?.mustChangePassword) {
    redirect("/default");
  }

  return <ChangePasswordForm />;
}
