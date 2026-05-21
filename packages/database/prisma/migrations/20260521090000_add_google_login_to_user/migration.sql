ALTER TABLE "User" ADD COLUMN "googleSubject" TEXT;
ALTER TABLE "User" ADD COLUMN "googleEmailVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_tenantId_googleSubject_key" ON "User"("tenantId", "googleSubject");
