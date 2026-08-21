/**
 * One-time script: migrate SUMMER rows to SECOND, then apply schema without SUMMER enum.
 * Run: npx tsx prisma/remove-summer-term.ts
 */
import { db } from '../lib/db';

async function main() {
  await db.$executeRaw`
    UPDATE students SET current_semester = 'SECOND'::"SemesterTerm"
    WHERE current_semester::text = 'SUMMER'
  `;
  await db.$executeRaw`
    UPDATE curriculum_subjects SET semester = 'SECOND'::"SemesterTerm"
    WHERE semester::text = 'SUMMER'
  `;
  await db.$executeRaw`
    UPDATE evaluation_results SET semester = 'SECOND'::"SemesterTerm"
    WHERE semester::text = 'SUMMER'
  `;
  await db.$executeRaw`
    UPDATE system_settings SET value = 'SECOND'
    WHERE key = 'activeSemester' AND value = 'SUMMER'
  `;

  console.log('Migrated SUMMER records to SECOND.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
