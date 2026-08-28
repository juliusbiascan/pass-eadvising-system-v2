import { db } from "@/lib/db";

/** Promotes the earliest admin to root when no root account exists. */
export async function ensureRootAdmin() {
  const existingRoot = await db.user.findFirst({
    where: { isRoot: true, role: "ADMIN" },
    select: { id: true },
  });

  if (existingRoot) {
    return existingRoot.id;
  }

  const firstAdmin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  if (!firstAdmin) {
    return null;
  }

  await db.user.update({
    where: { id: firstAdmin.id },
    data: { isRoot: true },
  });

  return firstAdmin.id;
}
