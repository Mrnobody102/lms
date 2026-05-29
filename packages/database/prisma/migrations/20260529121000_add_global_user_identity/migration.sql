CREATE TABLE "GlobalUserIdentity" (
    "id" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "displayName" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalUserIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalUserIdentity_normalizedEmail_key" ON "GlobalUserIdentity"("normalizedEmail");
CREATE INDEX "GlobalUserIdentity_normalizedEmail_idx" ON "GlobalUserIdentity"("normalizedEmail");

ALTER TABLE "User" ADD COLUMN "globalIdentityId" TEXT;

INSERT INTO "GlobalUserIdentity" (
    "id",
    "normalizedEmail",
    "displayName",
    "phoneNumber",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('identity-', MD5(LOWER("email"))),
    LOWER("email"),
    MIN("fullName"),
    MIN("phoneNumber"),
    MIN("createdAt"),
    CURRENT_TIMESTAMP
FROM "User"
GROUP BY LOWER("email");

UPDATE "User"
SET "globalIdentityId" = CONCAT('identity-', MD5(LOWER("email")))
WHERE "email" IS NOT NULL;

CREATE INDEX "User_globalIdentityId_idx" ON "User"("globalIdentityId");

ALTER TABLE "User" ADD CONSTRAINT "User_globalIdentityId_fkey" FOREIGN KEY ("globalIdentityId") REFERENCES "GlobalUserIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
