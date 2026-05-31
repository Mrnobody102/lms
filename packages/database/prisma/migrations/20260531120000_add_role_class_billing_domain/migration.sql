CREATE TYPE "CourseInstructorRole" AS ENUM ('OWNER', 'CO_TEACHER', 'GRADER', 'ASSISTANT');
CREATE TYPE "CourseRunStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ENROLLING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RunEnrollmentStatus" AS ENUM ('ENROLLED', 'WAITLISTED', 'COMPLETED', 'DROPPED', 'REFUNDED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
CREATE TYPE "BillingPlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "UsageLedgerType" AS ENUM ('STORAGE_BYTES', 'AI_REQUEST', 'MEDIA_UPLOAD', 'ENROLLMENT_SEAT');

ALTER TABLE "Course" ADD COLUMN "subject" TEXT;
ALTER TABLE "Course" ADD COLUMN "languageCode" TEXT;
ALTER TABLE "Course" ADD COLUMN "proficiencyLevel" TEXT;
ALTER TABLE "CourseInstructorAssignment" ADD COLUMN "role" "CourseInstructorRole" NOT NULL DEFAULT 'OWNER';

CREATE TABLE "InstructorSpecialty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "languageCode" TEXT,
    "levelRange" TEXT,
    "skillTags" TEXT[],
    "certifications" JSONB,
    "bio" TEXT,
    "weeklyCapacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstructorSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cohortId" TEXT,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "status" "CourseRunStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "enrollmentOpensAt" TIMESTAMP(3),
    "enrollmentClosesAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "deliveryMode" TEXT NOT NULL DEFAULT 'online',
    "location" TEXT,
    "onlineMeetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "instructorId" TEXT,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "location" TEXT,
    "onlineMeetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RunSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunEnrollment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RunEnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RunEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "BillingPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxStudents" INTEGER,
    "maxCourses" INTEGER,
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 0,
    "aiRequestQuota" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT,
    "courseId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "amountMinor" INTEGER NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'one_time',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "priceId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 0,
    "aiRequestQuota" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "taxMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "priceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "amountMinor" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentProviderAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "publicKey" TEXT,
    "merchantId" TEXT,
    "webhookUrl" TEXT,
    "secretRef" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentProviderAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "providerAccountId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "amountMinor" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "providerPaymentId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" INTEGER NOT NULL,
    "reason" TEXT,
    "providerRefundId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "UsageLedgerType" NOT NULL,
    "quantity" BIGINT NOT NULL,
    "unit" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstructorSpecialty_id_tenantId_key" ON "InstructorSpecialty"("id", "tenantId");
CREATE UNIQUE INDEX "InstructorSpecialty_tenantId_instructorId_subject_languageCode_levelRange_key" ON "InstructorSpecialty"("tenantId", "instructorId", "subject", "languageCode", "levelRange");
CREATE INDEX "InstructorSpecialty_tenantId_instructorId_idx" ON "InstructorSpecialty"("tenantId", "instructorId");
CREATE INDEX "InstructorSpecialty_tenantId_languageCode_idx" ON "InstructorSpecialty"("tenantId", "languageCode");

CREATE UNIQUE INDEX "CourseRun_id_tenantId_key" ON "CourseRun"("id", "tenantId");
CREATE UNIQUE INDEX "CourseRun_tenantId_code_key" ON "CourseRun"("tenantId", "code");
CREATE INDEX "CourseRun_tenantId_courseId_status_idx" ON "CourseRun"("tenantId", "courseId", "status");
CREATE INDEX "CourseRun_tenantId_instructorId_startsAt_idx" ON "CourseRun"("tenantId", "instructorId", "startsAt");
CREATE INDEX "CourseRun_tenantId_cohortId_idx" ON "CourseRun"("tenantId", "cohortId");

CREATE UNIQUE INDEX "RunSession_id_tenantId_key" ON "RunSession"("id", "tenantId");
CREATE INDEX "RunSession_tenantId_runId_startsAt_idx" ON "RunSession"("tenantId", "runId", "startsAt");
CREATE INDEX "RunSession_tenantId_instructorId_startsAt_idx" ON "RunSession"("tenantId", "instructorId", "startsAt");
CREATE INDEX "RunSession_tenantId_lessonId_idx" ON "RunSession"("tenantId", "lessonId");

CREATE UNIQUE INDEX "RunEnrollment_runId_userId_key" ON "RunEnrollment"("runId", "userId");
CREATE UNIQUE INDEX "RunEnrollment_id_tenantId_key" ON "RunEnrollment"("id", "tenantId");
CREATE INDEX "RunEnrollment_tenantId_runId_status_idx" ON "RunEnrollment"("tenantId", "runId", "status");
CREATE INDEX "RunEnrollment_tenantId_userId_status_idx" ON "RunEnrollment"("tenantId", "userId", "status");

CREATE UNIQUE INDEX "Attendance_sessionId_userId_key" ON "Attendance"("sessionId", "userId");
CREATE UNIQUE INDEX "Attendance_id_tenantId_key" ON "Attendance"("id", "tenantId");
CREATE INDEX "Attendance_tenantId_sessionId_status_idx" ON "Attendance"("tenantId", "sessionId", "status");
CREATE INDEX "Attendance_tenantId_userId_idx" ON "Attendance"("tenantId", "userId");

CREATE UNIQUE INDEX "BillingPlan_id_tenantId_key" ON "BillingPlan"("id", "tenantId");
CREATE UNIQUE INDEX "BillingPlan_tenantId_code_key" ON "BillingPlan"("tenantId", "code");
CREATE INDEX "BillingPlan_tenantId_status_idx" ON "BillingPlan"("tenantId", "status");

CREATE UNIQUE INDEX "Price_id_tenantId_key" ON "Price"("id", "tenantId");
CREATE INDEX "Price_tenantId_planId_isActive_idx" ON "Price"("tenantId", "planId", "isActive");
CREATE INDEX "Price_tenantId_courseId_isActive_idx" ON "Price"("tenantId", "courseId", "isActive");

CREATE UNIQUE INDEX "TenantSubscription_id_tenantId_key" ON "TenantSubscription"("id", "tenantId");
CREATE INDEX "TenantSubscription_tenantId_status_idx" ON "TenantSubscription"("tenantId", "status");
CREATE INDEX "TenantSubscription_tenantId_planId_idx" ON "TenantSubscription"("tenantId", "planId");

CREATE UNIQUE INDEX "Invoice_id_tenantId_key" ON "Invoice"("id", "tenantId");
CREATE UNIQUE INDEX "Invoice_tenantId_number_key" ON "Invoice"("tenantId", "number");
CREATE INDEX "Invoice_tenantId_status_createdAt_idx" ON "Invoice"("tenantId", "status", "createdAt");

CREATE UNIQUE INDEX "InvoiceItem_id_tenantId_key" ON "InvoiceItem"("id", "tenantId");
CREATE INDEX "InvoiceItem_tenantId_invoiceId_idx" ON "InvoiceItem"("tenantId", "invoiceId");

CREATE UNIQUE INDEX "PaymentProviderAccount_id_tenantId_key" ON "PaymentProviderAccount"("id", "tenantId");
CREATE UNIQUE INDEX "PaymentProviderAccount_tenantId_provider_merchantId_key" ON "PaymentProviderAccount"("tenantId", "provider", "merchantId");
CREATE INDEX "PaymentProviderAccount_tenantId_provider_isActive_idx" ON "PaymentProviderAccount"("tenantId", "provider", "isActive");

CREATE UNIQUE INDEX "Payment_id_tenantId_key" ON "Payment"("id", "tenantId");
CREATE INDEX "Payment_tenantId_status_createdAt_idx" ON "Payment"("tenantId", "status", "createdAt");
CREATE INDEX "Payment_tenantId_invoiceId_idx" ON "Payment"("tenantId", "invoiceId");
CREATE INDEX "Payment_provider_providerPaymentId_idx" ON "Payment"("provider", "providerPaymentId");

CREATE UNIQUE INDEX "Refund_id_tenantId_key" ON "Refund"("id", "tenantId");
CREATE INDEX "Refund_tenantId_status_createdAt_idx" ON "Refund"("tenantId", "status", "createdAt");
CREATE INDEX "Refund_tenantId_paymentId_idx" ON "Refund"("tenantId", "paymentId");

CREATE UNIQUE INDEX "UsageLedger_id_tenantId_key" ON "UsageLedger"("id", "tenantId");
CREATE INDEX "UsageLedger_tenantId_type_occurredAt_idx" ON "UsageLedger"("tenantId", "type", "occurredAt");
CREATE INDEX "UsageLedger_tenantId_sourceType_sourceId_idx" ON "UsageLedger"("tenantId", "sourceType", "sourceId");

CREATE INDEX "Course_tenantId_languageCode_proficiencyLevel_idx" ON "Course"("tenantId", "languageCode", "proficiencyLevel");

ALTER TABLE "InstructorSpecialty" ADD CONSTRAINT "InstructorSpecialty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorSpecialty" ADD CONSTRAINT "InstructorSpecialty_instructorId_tenantId_fkey" FOREIGN KEY ("instructorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseRun" ADD CONSTRAINT "CourseRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseRun" ADD CONSTRAINT "CourseRun_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseRun" ADD CONSTRAINT "CourseRun_cohortId_tenantId_fkey" FOREIGN KEY ("cohortId", "tenantId") REFERENCES "Cohort"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "CourseRun" ADD CONSTRAINT "CourseRun_instructorId_tenantId_fkey" FOREIGN KEY ("instructorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_runId_tenantId_fkey" FOREIGN KEY ("runId", "tenantId") REFERENCES "CourseRun"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_instructorId_tenantId_fkey" FOREIGN KEY ("instructorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_lessonId_tenantId_fkey" FOREIGN KEY ("lessonId", "tenantId") REFERENCES "Lesson"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "RunEnrollment" ADD CONSTRAINT "RunEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunEnrollment" ADD CONSTRAINT "RunEnrollment_runId_tenantId_fkey" FOREIGN KEY ("runId", "tenantId") REFERENCES "CourseRun"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunEnrollment" ADD CONSTRAINT "RunEnrollment_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_tenantId_fkey" FOREIGN KEY ("sessionId", "tenantId") REFERENCES "RunSession"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_tenantId_fkey" FOREIGN KEY ("markedById", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "BillingPlan" ADD CONSTRAINT "BillingPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Price" ADD CONSTRAINT "Price_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Price" ADD CONSTRAINT "Price_planId_tenantId_fkey" FOREIGN KEY ("planId", "tenantId") REFERENCES "BillingPlan"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Price" ADD CONSTRAINT "Price_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_tenantId_fkey" FOREIGN KEY ("planId", "tenantId") REFERENCES "BillingPlan"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_priceId_tenantId_fkey" FOREIGN KEY ("priceId", "tenantId") REFERENCES "Price"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_tenantId_fkey" FOREIGN KEY ("subscriptionId", "tenantId") REFERENCES "TenantSubscription"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_tenantId_fkey" FOREIGN KEY ("invoiceId", "tenantId") REFERENCES "Invoice"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_priceId_tenantId_fkey" FOREIGN KEY ("priceId", "tenantId") REFERENCES "Price"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "PaymentProviderAccount" ADD CONSTRAINT "PaymentProviderAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_tenantId_fkey" FOREIGN KEY ("invoiceId", "tenantId") REFERENCES "Invoice"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_providerAccountId_tenantId_fkey" FOREIGN KEY ("providerAccountId", "tenantId") REFERENCES "PaymentProviderAccount"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Refund" ADD CONSTRAINT "Refund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_tenantId_fkey" FOREIGN KEY ("paymentId", "tenantId") REFERENCES "Payment"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
