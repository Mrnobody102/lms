-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "levelId" TEXT;

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Program_tenantId_isActive_deletedAt_idx" ON "Program"("tenantId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Program_id_tenantId_key" ON "Program"("id", "tenantId");

-- CreateIndex
CREATE INDEX "Level_tenantId_programId_deletedAt_idx" ON "Level"("tenantId", "programId", "deletedAt");

-- CreateIndex
CREATE INDEX "Level_programId_order_idx" ON "Level"("programId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Level_id_tenantId_key" ON "Level"("id", "tenantId");

-- CreateIndex
CREATE INDEX "Course_levelId_idx" ON "Course"("levelId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_levelId_tenantId_fkey" FOREIGN KEY ("levelId", "tenantId") REFERENCES "Level"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_programId_tenantId_fkey" FOREIGN KEY ("programId", "tenantId") REFERENCES "Program"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
