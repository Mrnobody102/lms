-- CreateEnum
CREATE TYPE "ReviewCardSource" AS ENUM ('PRACTICE_QUESTION', 'EXAM_QUESTION');

-- CreateEnum
CREATE TYPE "ReviewCardGrade" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateTable
CREATE TABLE "ReviewCard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "ReviewCardSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "skillCodes" TEXT[],
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "lastGrade" "ReviewCardGrade",
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewCard_tenantId_userId_dueAt_idx" ON "ReviewCard"("tenantId", "userId", "dueAt");

-- CreateIndex
CREATE INDEX "ReviewCard_tenantId_userId_isSuspended_idx" ON "ReviewCard"("tenantId", "userId", "isSuspended");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCard_tenantId_userId_sourceType_sourceId_key" ON "ReviewCard"("tenantId", "userId", "sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
