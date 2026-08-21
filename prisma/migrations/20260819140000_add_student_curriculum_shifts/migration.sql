-- CreateTable
CREATE TABLE "student_curriculum_shifts" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_curriculum_id" TEXT,
    "to_curriculum_id" TEXT NOT NULL,
    "from_program_code" TEXT NOT NULL,
    "from_curriculum_label" TEXT NOT NULL,
    "to_program_code" TEXT NOT NULL,
    "to_curriculum_label" TEXT NOT NULL,
    "copied_grades" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_curriculum_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_curriculum_shifts_student_id_created_at_idx" ON "student_curriculum_shifts"("student_id", "created_at");

-- AddForeignKey
ALTER TABLE "student_curriculum_shifts" ADD CONSTRAINT "student_curriculum_shifts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_curriculum_shifts" ADD CONSTRAINT "student_curriculum_shifts_from_curriculum_id_fkey" FOREIGN KEY ("from_curriculum_id") REFERENCES "curriculums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_curriculum_shifts" ADD CONSTRAINT "student_curriculum_shifts_to_curriculum_id_fkey" FOREIGN KEY ("to_curriculum_id") REFERENCES "curriculums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
