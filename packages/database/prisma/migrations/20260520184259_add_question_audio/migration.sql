-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "audioMediaAssetId" TEXT,
ADD COLUMN     "audioReplayLimit" INTEGER;

-- AlterTable
ALTER TABLE "PracticeQuestion" ADD COLUMN     "audioMediaAssetId" TEXT,
ADD COLUMN     "audioReplayLimit" INTEGER;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_audioMediaAssetId_fkey" FOREIGN KEY ("audioMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_audioMediaAssetId_fkey" FOREIGN KEY ("audioMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
