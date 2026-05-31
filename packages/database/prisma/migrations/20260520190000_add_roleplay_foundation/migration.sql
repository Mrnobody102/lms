-- CreateEnum
CREATE TYPE "RoleplaySessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "RoleplaySession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "status" "RoleplaySessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "feedback" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleplaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleplayMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "audioMediaAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleplayMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleplaySession_id_tenantId_key" ON "RoleplaySession"("id", "tenantId");

-- CreateIndex
CREATE INDEX "RoleplaySession_tenantId_userId_startedAt_idx" ON "RoleplaySession"("tenantId", "userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoleplayMessage_id_tenantId_key" ON "RoleplayMessage"("id", "tenantId");

-- CreateIndex
CREATE INDEX "RoleplayMessage_sessionId_createdAt_idx" ON "RoleplayMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "RoleplaySession" ADD CONSTRAINT "RoleplaySession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplaySession" ADD CONSTRAINT "RoleplaySession_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayMessage" ADD CONSTRAINT "RoleplayMessage_sessionId_tenantId_fkey" FOREIGN KEY ("sessionId", "tenantId") REFERENCES "RoleplaySession"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayMessage" ADD CONSTRAINT "RoleplayMessage_audioMediaAssetId_fkey" FOREIGN KEY ("audioMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
