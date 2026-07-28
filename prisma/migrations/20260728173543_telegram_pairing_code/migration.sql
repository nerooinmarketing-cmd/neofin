-- CreateTable
CREATE TABLE "TelegramPairingCode" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramPairingCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramPairingCode_token_key" ON "TelegramPairingCode"("token");

-- CreateIndex
CREATE INDEX "TelegramPairingCode_companyId_idx" ON "TelegramPairingCode"("companyId");

-- AddForeignKey
ALTER TABLE "TelegramPairingCode" ADD CONSTRAINT "TelegramPairingCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramPairingCode" ADD CONSTRAINT "TelegramPairingCode_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "CompanyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

