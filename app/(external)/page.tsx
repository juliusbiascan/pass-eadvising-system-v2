'use server';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "../generated/prisma/client";

const RootPage = async () => {

  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  // If user was deleted from database, invalidate session and redirect to login
  if (!user) {
    return redirect('/api/auth/invalidate');
  }

  if (user?.role === UserRole.USER) {
    if (user.mustChangePassword) {
      redirect("/default/change-password");
    }
    redirect("/default");
  } else if (user?.role === UserRole.ADMIN || user?.role === UserRole.HEAD) {
    if (user.mustChangePassword) {
      redirect("/dashboard/change-password");
    }
    return redirect('/dashboard');
  }

}
export default RootPage;