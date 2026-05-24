-- CreateEnum
CREATE TYPE "MarketplaceResourceType" AS ENUM ('COURSE', 'MEDIA_ASSET');

-- CreateEnum
CREATE TYPE "MarketplacePricingModel" AS ENUM ('FREE', 'MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "ResourceSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarketplaceUsageEventType" AS ENUM ('SUBSCRIPTION_STARTED', 'COURSE_PACKAGE_VIEWED', 'MEDIA_SIGNED_URL', 'MEDIA_STREAM_SECONDS');

-- CreateEnum
CREATE TYPE "VideoEngagementEventType" AS ENUM ('PLAY', 'PAUSE', 'SEEK', 'WATCH_SEGMENT', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AdaptiveLearningPathItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "StudentRiskSnapshot" ADD COLUMN "churnProbability" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StudentRiskSnapshot" ADD COLUMN "predictedChurnLabel" TEXT;

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "ownerTenantId" TEXT NOT NULL,
    "resourceType" "MarketplaceResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pricingModel" "MarketplacePricingModel" NOT NULL DEFAULT 'FREE',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "revenueShareBps" INTEGER NOT NULL DEFAULT 7000,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceSubscription" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "providerTenantId" TEXT NOT NULL,
    "subscriberTenantId" TEXT NOT NULL,
    "status" "ResourceSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceUsageEvent" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "providerTenantId" TEXT NOT NULL,
    "subscriberTenantId" TEXT NOT NULL,
    "userId" TEXT,
    "resourceType" "MarketplaceResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventType" "MarketplaceUsageEventType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "seconds" INTEGER,
    "revenueShareCents" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoEngagementEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceTenantId" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "mediaAssetId" TEXT,
    "eventType" "VideoEngagementEventType" NOT NULL,
    "positionSeconds" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "segmentStartSeconds" INTEGER,
    "segmentEndSeconds" INTEGER,
    "playbackRate" DOUBLE PRECISION,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoEngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptiveLearningPathItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sourceSkillCode" TEXT NOT NULL,
    "sourceAttemptId" TEXT,
    "questionIds" TEXT[],
    "status" "AdaptiveLearningPathItemStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdaptiveLearningPathItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplaceItem_ownerTenantId_resourceType_isPublished_idx" ON "MarketplaceItem"("ownerTenantId", "resourceType", "isPublished");

-- CreateIndex
CREATE INDEX "MarketplaceItem_resourceType_resourceId_idx" ON "MarketplaceItem"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "MarketplaceItem_isPublished_publishedAt_idx" ON "MarketplaceItem"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceSubscription_marketplaceItemId_subscriberTenantId_key" ON "ResourceSubscription"("marketplaceItemId", "subscriberTenantId");

-- CreateIndex
CREATE INDEX "ResourceSubscription_providerTenantId_status_idx" ON "ResourceSubscription"("providerTenantId", "status");

-- CreateIndex
CREATE INDEX "ResourceSubscription_subscriberTenantId_status_idx" ON "ResourceSubscription"("subscriberTenantId", "status");

-- CreateIndex
CREATE INDEX "ResourceSubscription_endsAt_idx" ON "ResourceSubscription"("endsAt");

-- CreateIndex
CREATE INDEX "MarketplaceUsageEvent_marketplaceItemId_occurredAt_idx" ON "MarketplaceUsageEvent"("marketplaceItemId", "occurredAt");

-- CreateIndex
CREATE INDEX "MarketplaceUsageEvent_providerTenantId_occurredAt_idx" ON "MarketplaceUsageEvent"("providerTenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "MarketplaceUsageEvent_subscriberTenantId_occurredAt_idx" ON "MarketplaceUsageEvent"("subscriberTenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "MarketplaceUsageEvent_eventType_occurredAt_idx" ON "MarketplaceUsageEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "VideoEngagementEvent_tenantId_userId_occurredAt_idx" ON "VideoEngagementEvent"("tenantId", "userId", "occurredAt");

-- CreateIndex
CREATE INDEX "VideoEngagementEvent_sourceTenantId_lessonId_occurredAt_idx" ON "VideoEngagementEvent"("sourceTenantId", "lessonId", "occurredAt");

-- CreateIndex
CREATE INDEX "VideoEngagementEvent_sourceTenantId_mediaAssetId_occurredAt_idx" ON "VideoEngagementEvent"("sourceTenantId", "mediaAssetId", "occurredAt");

-- CreateIndex
CREATE INDEX "VideoEngagementEvent_eventType_occurredAt_idx" ON "VideoEngagementEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AdaptiveLearningPathItem_tenantId_userId_status_priority_idx" ON "AdaptiveLearningPathItem"("tenantId", "userId", "status", "priority");

-- CreateIndex
CREATE INDEX "AdaptiveLearningPathItem_tenantId_courseId_sourceSkillCode_idx" ON "AdaptiveLearningPathItem"("tenantId", "courseId", "sourceSkillCode");

-- CreateIndex
CREATE INDEX "AdaptiveLearningPathItem_sourceAttemptId_idx" ON "AdaptiveLearningPathItem"("sourceAttemptId");

-- AddForeignKey
ALTER TABLE "MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_ownerTenantId_fkey" FOREIGN KEY ("ownerTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSubscription" ADD CONSTRAINT "ResourceSubscription_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSubscription" ADD CONSTRAINT "ResourceSubscription_providerTenantId_fkey" FOREIGN KEY ("providerTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSubscription" ADD CONSTRAINT "ResourceSubscription_subscriberTenantId_fkey" FOREIGN KEY ("subscriberTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceUsageEvent" ADD CONSTRAINT "MarketplaceUsageEvent_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceUsageEvent" ADD CONSTRAINT "MarketplaceUsageEvent_providerTenantId_fkey" FOREIGN KEY ("providerTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceUsageEvent" ADD CONSTRAINT "MarketplaceUsageEvent_subscriberTenantId_fkey" FOREIGN KEY ("subscriberTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoEngagementEvent" ADD CONSTRAINT "VideoEngagementEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoEngagementEvent" ADD CONSTRAINT "VideoEngagementEvent_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptiveLearningPathItem" ADD CONSTRAINT "AdaptiveLearningPathItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptiveLearningPathItem" ADD CONSTRAINT "AdaptiveLearningPathItem_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptiveLearningPathItem" ADD CONSTRAINT "AdaptiveLearningPathItem_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
