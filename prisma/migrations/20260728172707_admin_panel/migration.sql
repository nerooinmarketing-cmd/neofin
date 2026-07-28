-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('NONE', 'OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "packageTier" "PackageTier" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "supportStatus" "SupportStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SystemAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAdminSession" (
    "id" TEXT NOT NULL,
    "systemAdminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SystemAdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportNote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "systemAdminId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemAdmin_email_key" ON "SystemAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAdminSession_tokenHash_key" ON "SystemAdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "SystemAdminSession_systemAdminId_idx" ON "SystemAdminSession"("systemAdminId");

-- CreateIndex
CREATE INDEX "SupportNote_companyId_idx" ON "SupportNote"("companyId");

-- AddForeignKey
ALTER TABLE "SystemAdminSession" ADD CONSTRAINT "SystemAdminSession_systemAdminId_fkey" FOREIGN KEY ("systemAdminId") REFERENCES "SystemAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportNote" ADD CONSTRAINT "SupportNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportNote" ADD CONSTRAINT "SupportNote_systemAdminId_fkey" FOREIGN KEY ("systemAdminId") REFERENCES "SystemAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

