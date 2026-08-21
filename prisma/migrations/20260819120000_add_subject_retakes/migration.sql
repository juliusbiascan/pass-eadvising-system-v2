-- CreateEnum
CREATE TYPE "RetakeSchedule" AS ENUM ('NEXT_SEMESTER', 'NEXT_YEAR');

-- CreateEnum
CREATE TYPE "RetakeStatus" AS ENUM ('CONFIRMED', 'COMPLETED');

-- CreateTable
CREATE TABLE "subject_retakes" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "curriculum_subject_id" TEXT NOT NULL,
    "status" "RetakeStatus" NOT NULL DEFAULT 'CONFIRMED',
    "schedule" "RetakeSchedule" NOT NULL,
    "target_year_level" INTEGER NOT NULL,
    "target_semester" "SemesterTerm" NOT NULL,
    "failed_at_year_level" INTEGER NOT NULL,
    "failed_at_semester" "SemesterTerm" NOT NULL,
    "original_grade" DECIMAL(5,2),
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_retakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_retakes_student_id_curriculum_subject_id_key" ON "subject_retakes"("student_id", "curriculum_subject_id");

-- CreateIndex
CREATE INDEX "subject_retakes_student_id_status_target_year_level_target_semester_idx" ON "subject_retakes"("student_id", "status", "target_year_level", "target_semester");

-- AddForeignKey
ALTER TABLE "subject_retakes" ADD CONSTRAINT "subject_retakes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_retakes" ADD CONSTRAINT "subject_retakes_curriculum_subject_id_fkey" FOREIGN KEY ("curriculum_subject_id") REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
