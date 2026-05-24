-- Add tenant-aware unique keys so tenant-scoped reads and writes can include tenantId.
CREATE UNIQUE INDEX "CourseEnrollment_id_tenantId_key" ON "CourseEnrollment"("id", "tenantId");
CREATE UNIQUE INDEX "CourseEnrollment_tenantId_userId_courseId_key" ON "CourseEnrollment"("tenantId", "userId", "courseId");
