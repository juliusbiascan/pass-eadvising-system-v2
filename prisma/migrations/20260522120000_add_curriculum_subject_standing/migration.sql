-- AlterTable
ALTER TABLE "curriculum_subjects" ADD COLUMN IF NOT EXISTS "prerequisite_note" TEXT;
ALTER TABLE "curriculum_subjects" ADD COLUMN IF NOT EXISTS "min_year_standing" INTEGER;
ALTER TABLE "curriculum_subjects" ADD COLUMN IF NOT EXISTS "min_curriculum_units_percent" INTEGER;
