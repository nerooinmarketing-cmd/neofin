-- CreateTable
CREATE TABLE "TariffTransactionSupport" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "ownBankCard" BOOLEAN NOT NULL DEFAULT true,
    "otherBankCard" BOOLEAN NOT NULL DEFAULT true,
    "commercialCard" BOOLEAN NOT NULL DEFAULT false,
    "foreignCard" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyPoints" BOOLEAN NOT NULL DEFAULT false,
    "refund" BOOLEAN NOT NULL DEFAULT true,
    "cancellation" BOOLEAN NOT NULL DEFAULT true,
    "mailOrder" BOOLEAN NOT NULL DEFAULT false,
    "contactless" BOOLEAN NOT NULL DEFAULT true,
    "qr" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffTransactionSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffPaymentTerms" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "paymentDay" TEXT,
    "holidayPaymentRule" TEXT,
    "weekendPaymentDay" TEXT,
    "partialPaymentRule" TEXT,
    "blockDurationDays" INTEGER,
    "blockReleaseCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffPaymentTerms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TariffTransactionSupport_tariffVersionId_key" ON "TariffTransactionSupport"("tariffVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TariffPaymentTerms_tariffVersionId_key" ON "TariffPaymentTerms"("tariffVersionId");

-- AddForeignKey
ALTER TABLE "TariffTransactionSupport" ADD CONSTRAINT "TariffTransactionSupport_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffPaymentTerms" ADD CONSTRAINT "TariffPaymentTerms_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
