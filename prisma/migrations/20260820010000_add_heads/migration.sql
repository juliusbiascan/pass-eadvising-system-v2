-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'HEAD';

-- CreateTable
CREATE TABLE "heads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "head_courses" (
    "id" TEXT NOT NULL,
    "head_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "head_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "heads_user_id_key" ON "heads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "heads_email_key" ON "heads"("email");

-- CreateIndex
CREATE INDEX "heads_user_id_idx" ON "heads"("user_id");

-- CreateIndex
CREATE INDEX "head_courses_course_id_idx" ON "head_courses"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "head_courses_head_id_course_id_key" ON "head_courses"("head_id", "course_id");

-- AddForeignKey
ALTER TABLE "heads" ADD CONSTRAINT "heads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "head_courses" ADD CONSTRAINT "head_courses_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "heads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "head_courses" ADD CONSTRAINT "head_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
