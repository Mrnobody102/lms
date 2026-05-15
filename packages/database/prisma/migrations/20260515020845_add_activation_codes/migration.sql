-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "courseId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationRedemption" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "activationCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivationRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivationCode_tenantId_isActive_deletedAt_idx" ON "ActivationCode"("tenantId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "ActivationCode_courseId_idx" ON "ActivationCode"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_id_tenantId_key" ON "ActivationCode"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_tenantId_code_key" ON "ActivationCode"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ActivationRedemption_tenantId_userId_idx" ON "ActivationRedemption"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ActivationRedemption_activationCodeId_idx" ON "ActivationRedemption"("activationCodeId");

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRedemption" ADD CONSTRAINT "ActivationRedemption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRedemption" ADD CONSTRAINT "ActivationRedemption_activationCodeId_tenantId_fkey" FOREIGN KEY ("activationCodeId", "tenantId") REFERENCES "ActivationCode"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRedemption" ADD CONSTRAINT "ActivationRedemption_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
