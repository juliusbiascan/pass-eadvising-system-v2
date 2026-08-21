import { db } from "@/lib/db";

export const hasAnyUsers = async (): Promise<boolean> => {
  try {
    const count = await db.user.count();
    return count > 0;
  } catch {
    return false;
  }
};
