import { readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "../lib/db";
import { DEFAULT_COURSES } from "../lib/courses";
import { buildPrerequisiteNote } from "../lib/curriculum-prerequisites";
import { parseCurriculumExcelBuffer } from "../lib/curriculum-excel";

async function seedCurriculum() {
  try {
    console.log("Starting curriculum seed...");

    const filePath = path.join(process.cwd(), "BSCS-Curriculum.xlsx");
    const buffer = await readFile(filePath);
    const parsed = parseCurriculumExcelBuffer(buffer);

    console.log(`Found ${parsed.subjects.size} unique subjects`);
    console.log(`Curriculum structure has ${parsed.offerings.length} entries`);

    for (const item of DEFAULT_COURSES) {
      await db.course.upsert({
        where: { code: item.code },
        update: {
          title: item.title,
          isActive: true,
        },
        create: {
          code: item.code,
          title: item.title,
          isActive: true,
        },
      });
    }

    const course = await db.course.findUniqueOrThrow({
      where: { code: "BSCS" },
    });

    const curriculum = await db.curriculum.upsert({
      where: {
        programCode_batchYear: {
          programCode: "BSCS",
          batchYear: parsed.batchYear,
        },
      },
      update: {
        courseId: course.id,
        title: parsed.title,
        batchLabel: parsed.batchLabel,
        versionTag: "NEW",
        isActive: true,
      },
      create: {
        courseId: course.id,
        programCode: "BSCS",
        title: parsed.title,
        batchLabel: parsed.batchLabel,
        batchYear: parsed.batchYear,
        versionTag: "NEW",
        isActive: true,
      },
    });

    console.log(`✓ Created/Updated curriculum: ${curriculum.id}`);

    const subjectMap = new Map<string, string>();
    for (const subject of parsed.subjects.values()) {
      const dbSubject = await db.subject.upsert({
        where: { code: subject.code },
        update: {
          description: subject.description,
          units: subject.units,
        },
        create: {
          code: subject.code,
          description: subject.description,
          units: subject.units,
        },
      });
      subjectMap.set(subject.code, dbSubject.id);
      console.log(`✓ Subject: ${subject.code} - ${subject.description}`);
    }

    for (const entry of parsed.offerings) {
      const subjectId = subjectMap.get(entry.code);
      if (!subjectId) {
        console.warn(`Subject not found: ${entry.code}`);
        continue;
      }

      await db.curriculumSubject.upsert({
        where: {
          curriculumId_subjectId: {
            curriculumId: curriculum.id,
            subjectId,
          },
        },
        update: {
          yearLevel: entry.yearLevel,
          semester: entry.semester,
          displayOrder: entry.displayOrder,
          prerequisiteNote: buildPrerequisiteNote({
            standing: entry.standing,
            curriculumUnits: entry.curriculumUnits,
          }),
          minYearStanding: entry.standing?.minYearLevel ?? null,
          minCurriculumUnitsPercent: entry.curriculumUnits?.minPercent ?? null,
        },
        create: {
          curriculumId: curriculum.id,
          subjectId,
          yearLevel: entry.yearLevel,
          semester: entry.semester,
          displayOrder: entry.displayOrder,
          prerequisiteNote: buildPrerequisiteNote({
            standing: entry.standing,
            curriculumUnits: entry.curriculumUnits,
          }),
          minYearStanding: entry.standing?.minYearLevel ?? null,
          minCurriculumUnitsPercent: entry.curriculumUnits?.minPercent ?? null,
        },
      });
    }

    console.log(
      `✓ Created/Updated ${parsed.offerings.length} curriculum subject entries`
    );

    let prereqCount = 0;
    for (const entry of parsed.offerings) {
      const subjectId = subjectMap.get(entry.code);
      if (!subjectId) continue;

      for (const prereqCode of entry.subjectPrerequisiteCodes) {
        const prereqId = subjectMap.get(prereqCode);
        if (!prereqId) {
          console.warn(`Prerequisite not found: ${prereqCode} for ${entry.code}`);
          continue;
        }

        try {
          await db.subjectPrerequisite.upsert({
            where: {
              subjectId_prerequisiteId: {
                subjectId,
                prerequisiteId: prereqId,
              },
            },
            update: {},
            create: {
              subjectId,
              prerequisiteId: prereqId,
            },
          });
          prereqCount++;
        } catch (error) {
          if (!(error instanceof Error && error.message.includes("Unique"))) {
            console.error(
              `Error creating prerequisite ${entry.code} -> ${prereqCode}:`,
              error
            );
          }
        }
      }
    }

    console.log(`✓ Created ${prereqCount} prerequisite relationships`);
    console.log("✓ Curriculum seed completed successfully!");
  } catch (error) {
    console.error("Error seeding curriculum:", error);
    throw error;
  }
}

seedCurriculum()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
