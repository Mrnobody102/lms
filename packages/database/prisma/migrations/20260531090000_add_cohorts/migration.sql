-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "instructorId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_id_tenantId_key" ON "Cohort"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_tenantId_name_key" ON "Cohort"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Cohort_tenantId_instructorId_idx" ON "Cohort"("tenantId", "instructorId");

-- CreateIndex
CREATE INDEX "Cohort_tenantId_isActive_deletedAt_idx" ON "Cohort"("tenantId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CohortMembership_cohortId_userId_key" ON "CohortMembership"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "CohortMembership_tenantId_userId_idx" ON "CohortMembership"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_instructorId_tenantId_fkey" FOREIGN KEY ("instructorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_cohortId_tenantId_fkey" FOREIGN KEY ("cohortId", "tenantId") REFERENCES "Cohort"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
