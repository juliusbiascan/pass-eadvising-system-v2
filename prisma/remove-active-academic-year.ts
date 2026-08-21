/**
 * One-time script: remove deprecated activeAcademicYear system setting.
 * Run: npx tsx prisma/remove-active-academic-year.ts
 */
import { db } from '../lib/db';

async function main() {
  const result = await db.systemSetting.deleteMany({
    where: { key: 'activeAcademicYear' },
  });
  console.log(`Removed ${result.count} activeAcademicYear setting(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
