import { db } from "../lib/db";

async function main() {
  // Find the admin user
  const adminUser = await db.user.findUnique({
    where: { email: "admin@passcollege.com" },
  });

  if (!adminUser) {
    console.error("Admin user not found");
    process.exit(1);
  }

  // Find the BSCS curriculum
  const curriculum = await db.curriculum.findFirst({
    where: { programCode: "BSCS", batchYear: 2023 },
  });

  if (!curriculum) {
    console.error("BSCS curriculum not found");
    process.exit(1);
  }

  // Create a sample student linked to admin user
  const student = await db.student.upsert({
    where: { studentId: "CS-2023-001" },
    update: {
      userId: adminUser.id,
      fullName: "Admin Student",
      course: "BSCS",
      yearLevel: 1,
      curriculum: "BSCS 2023-2024",
      curriculumId: curriculum.id,
      email: adminUser.email || undefined,
    },
    create: {
      studentId: "CS-2023-001",
      userId: adminUser.id,
      fullName: "Admin Student",
      email: adminUser.email || undefined,
      course: "BSCS",
      yearLevel: 1,
      curriculum: "BSCS 2023-2024",
      curriculumId: curriculum.id,
    },
  });

  console.log(`✓ Created/linked student: ${student.studentId} (${student.fullName}) - Year ${student.yearLevel}`);
  console.log(`✓ Student linked to user: ${adminUser.email}`);
  console.log(`✓ Curriculum assigned: ${curriculum.title}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
