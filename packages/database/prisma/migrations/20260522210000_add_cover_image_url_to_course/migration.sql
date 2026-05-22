-- AlterTable: Add coverImageUrl to Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
