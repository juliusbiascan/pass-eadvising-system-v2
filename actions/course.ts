"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateCourseSchema, UpdateCourseSchema } from "@/schemas";

const ensureAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return false;
  }
  return true;
};

const revalidateCoursePaths = () => {
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard/curriculum");
  revalidatePath("/dashboard/curriculum/create");
  revalidatePath("/dashboard/students");
};

export const createCourse = async (values: z.infer<typeof CreateCourseSchema>) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = CreateCourseSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid course fields" };
  }

  const payload = {
    code: validated.data.code.trim().toUpperCase(),
    title: validated.data.title.trim(),
    isActive: validated.data.isActive,
  };

  try {
    await db.course.create({ data: payload });
    revalidateCoursePaths();
    return { success: "Course created" };
  } catch (error) {
    console.error("Create course error:", error);
    return { error: "A course with this code already exists" };
  }
};

export const updateCourse = async (values: z.infer<typeof UpdateCourseSchema>) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateCourseSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid course fields" };
  }

  const { id, ...rest } = validated.data;
  const payload = {
    code: rest.code.trim().toUpperCase(),
    title: rest.title.trim(),
    isActive: rest.isActive,
  };

  const existing = await db.course.findUnique({
    where: { id },
    select: { code: true },
  });

  if (!existing) {
    return { error: "Course not found" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.course.update({ where: { id }, data: payload });

      if (existing.code !== payload.code) {
        await tx.curriculum.updateMany({
          where: { courseId: id },
          data: { programCode: payload.code },
        });

        await tx.student.updateMany({
          where: { course: existing.code },
          data: { course: payload.code },
        });

        const curriculums = await tx.curriculum.findMany({
          where: { courseId: id },
          select: { id: true, batchLabel: true, versionTag: true },
        });

        for (const curriculum of curriculums) {
          await tx.student.updateMany({
            where: { curriculumId: curriculum.id },
            data: {
              curriculum: `${payload.code} - ${curriculum.batchLabel} (${curriculum.versionTag})`,
            },
          });
        }
      }
    });

    revalidateCoursePaths();
    return { success: "Course updated" };
  } catch (error) {
    console.error("Update course error:", error);
    return { error: "A course with this code already exists" };
  }
};

export const deleteCourse = async (id: string) => {
  if (!(await ensureAdmin())) {
    return { error: "Unauthorized" };
  }

  if (!id?.trim()) {
    return { error: "Course is required" };
  }

  const existing = await db.course.findUnique({
    where: { id },
    select: {
      code: true,
      _count: { select: { curriculums: true } },
    },
  });

  if (!existing) {
    return { error: "Course not found" };
  }

  if (existing._count.curriculums > 0) {
    return {
      error: `Cannot delete ${existing.code} because it still has curriculum versions. Remove or reassign those first.`,
    };
  }

  try {
    await db.course.delete({ where: { id } });
    revalidateCoursePaths();
    return { success: "Course deleted" };
  } catch (error) {
    console.error("Delete course error:", error);
    return { error: "Failed to delete course" };
  }
};
