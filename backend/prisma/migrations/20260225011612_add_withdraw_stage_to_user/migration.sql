-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "avatarUrl" TEXT,
    "adminNotes" TEXT,
    "withdrawStage" TEXT NOT NULL DEFAULT 'BLOCKED',
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("adminNotes", "avatarUrl", "country", "createdAt", "email", "emailVerified", "firstName", "id", "kycStatus", "lastLoginAt", "lastLoginIp", "lastName", "passwordHash", "phone", "referralCode", "referredBy", "role", "status", "twoFactorEnabled", "twoFactorSecret", "updatedAt") SELECT "adminNotes", "avatarUrl", "country", "createdAt", "email", "emailVerified", "firstName", "id", "kycStatus", "lastLoginAt", "lastLoginIp", "lastName", "passwordHash", "phone", "referralCode", "referredBy", "role", "status", "twoFactorEnabled", "twoFactorSecret", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_role_idx" ON "users"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
