-- Add tenant-aware unique keys so progress reads and writes can include tenantId.
CREATE UNIQUE INDEX "UserLessonProgress_id_tenantId_key" ON "UserLessonProgress"("id", "tenantId");
CREATE UNIQUE INDEX "UserLessonProgress_tenantId_userId_lessonId_key" ON "UserLessonProgress"("tenantId", "userId", "lessonId");
