-- AlterEnum
ALTER TYPE "LoginApprovalStatus" ADD VALUE 'NOT_LINKED';

-- DropForeignKey
ALTER TABLE "LoginApproval" DROP CONSTRAINT "LoginApproval_telegramAccountId_fkey";

-- AlterTable
ALTER TABLE "LoginApproval" ALTER COLUMN "telegramAccountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdViaLoginApprovalId" TEXT,
    "isDevSession" BOOLEAN NOT NULL DEFAULT false,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_createdViaLoginApprovalId_key" ON "Session"("createdViaLoginApprovalId");

-- CreateIndex
CREATE INDEX "Session_companyId_idx" ON "Session"("companyId");

-- CreateIndex
CREATE INDEX "Session_companyUserId_idx" ON "Session"("companyUserId");

-- AddForeignKey
ALTER TABLE "LoginApproval" ADD CONSTRAINT "LoginApproval_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "CompanyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_createdViaLoginApprovalId_fkey" FOREIGN KEY ("createdViaLoginApprovalId") REFERENCES "LoginApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
