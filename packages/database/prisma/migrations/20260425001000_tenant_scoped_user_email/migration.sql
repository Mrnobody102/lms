DROP INDEX IF EXISTS "User_email_key";

CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
