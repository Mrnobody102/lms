-- Add tenant-aware unique keys for answer records used by feedback/explain flows.
CREATE UNIQUE INDEX "PracticeAnswer_id_tenantId_key" ON "PracticeAnswer"("id", "tenantId");
CREATE UNIQUE INDEX "PracticeAnswer_tenantId_attemptId_questionId_key" ON "PracticeAnswer"("tenantId", "attemptId", "questionId");

CREATE UNIQUE INDEX "ExamAnswer_id_tenantId_key" ON "ExamAnswer"("id", "tenantId");
CREATE UNIQUE INDEX "ExamAnswer_tenantId_attemptId_questionId_key" ON "ExamAnswer"("tenantId", "attemptId", "questionId");
