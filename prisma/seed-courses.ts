import { db } from "../lib/db";
import { DEFAULT_COURSES } from "../lib/courses";

async function seedCourses() {
  console.log("Seeding default courses...");

  for (const course of DEFAULT_COURSES) {
    await db.course.upsert({
      where: { code: course.code },
      update: {
        title: course.title,
        isActive: true,
      },
      create: {
        code: course.code,
        title: course.title,
        isActive: true,
      },
    });
    console.log(`✓ ${course.code} — ${course.title}`);
  }

  console.log("✓ Default courses seeded");
}

seedCourses()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
