import { db } from "@/lib/db";
import { UserRole } from "../app/generated/prisma/client";

export const getUserByEmail = async (email: string) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};

export const getAllUsers = async (options?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}) => {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.search
        ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" as const } },
            { email: { contains: options.search, mode: "insensitive" as const } },
          ],
        }
        : {}),
      ...(options?.role ? { role: options.role } : {}),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          isTwoFactorEnabled: true,

        },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error updating user role:", error);
    return null;
  }
};
