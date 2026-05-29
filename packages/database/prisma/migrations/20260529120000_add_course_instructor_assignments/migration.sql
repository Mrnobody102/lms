CREATE TABLE "CourseInstructorAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseInstructorAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseInstructorAssignment_id_tenantId_key" ON "CourseInstructorAssignment"("id", "tenantId");
CREATE UNIQUE INDEX "CourseInstructorAssignment_tenantId_courseId_instructorId_key" ON "CourseInstructorAssignment"("tenantId", "courseId", "instructorId");
CREATE INDEX "CourseInstructorAssignment_tenantId_courseId_idx" ON "CourseInstructorAssignment"("tenantId", "courseId");
CREATE INDEX "CourseInstructorAssignment_tenantId_instructorId_idx" ON "CourseInstructorAssignment"("tenantId", "instructorId");

ALTER TABLE "CourseInstructorAssignment" ADD CONSTRAINT "CourseInstructorAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseInstructorAssignment" ADD CONSTRAINT "CourseInstructorAssignment_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseInstructorAssignment" ADD CONSTRAINT "CourseInstructorAssignment_instructorId_tenantId_fkey" FOREIGN KEY ("instructorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
