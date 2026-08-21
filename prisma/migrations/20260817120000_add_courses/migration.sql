-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- Seed default degree programs used by curriculum import
INSERT INTO "courses" ("id", "code", "title", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'BSCS', 'Bachelor of Science in Computer Science', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BSA', 'Bachelor of Science in Accountancy', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BSBA', 'Bachelor of Science in Business Administration', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BSC', 'Bachelor of Science in Criminology', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BEED', 'Bachelor of Elementary Education', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Capture any extra program codes already stored on curriculums
INSERT INTO "courses" ("id", "code", "title", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, UPPER(c.program_code), c.title, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (UPPER(program_code)) program_code, title
  FROM "curriculums"
  ORDER BY UPPER(program_code), "created_at"
) c
WHERE NOT EXISTS (
  SELECT 1 FROM "courses" WHERE "code" = UPPER(c.program_code)
);

-- AlterTable
ALTER TABLE "curriculums" ADD COLUMN "course_id" TEXT;

UPDATE "curriculums" cu
SET "course_id" = co.id
FROM "courses" co
WHERE UPPER(cu."program_code") = co."code";

ALTER TABLE "curriculums" ALTER COLUMN "course_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "curriculums_course_id_idx" ON "curriculums"("course_id");
