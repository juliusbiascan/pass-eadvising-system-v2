-- AlterEnum
ALTER TYPE "EvaluationStatus" ADD VALUE 'EVALUATED';

-- AlterTable
ALTER TABLE "evaluation_results" ADD COLUMN "approved_by" "UserRole";
ALTER TABLE "evaluation_results" ADD COLUMN "approved_at" TIMESTAMP(3);
