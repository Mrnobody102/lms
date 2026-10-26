-- Keep learner-specific adaptive practice sets separate from the public catalog.
ALTER TABLE "PracticeExerciseSet" ADD COLUMN "adaptivePathItemId" TEXT;
CREATE UNIQUE INDEX "AdaptiveLearningPathItem_id_tenantId_key" ON "AdaptiveLearningPathItem"("id", "tenantId");
CREATE UNIQUE INDEX "PracticeExerciseSet_adaptivePathItemId_tenantId_key" ON "PracticeExerciseSet"("adaptivePathItemId", "tenantId");
ALTER TABLE "PracticeExerciseSet" ADD CONSTRAINT "PracticeExerciseSet_adaptivePathItemId_tenantId_fkey"
  FOREIGN KEY ("adaptivePathItemId", "tenantId") REFERENCES "AdaptiveLearningPathItem"("id", "tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;
