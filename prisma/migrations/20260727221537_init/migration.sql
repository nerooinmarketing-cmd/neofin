-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIAL');

-- CreateEnum
CREATE TYPE "CompanyUserRole" AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "LoginApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PosType" AS ENUM ('PHYSICAL', 'VIRTUAL', 'MOBILE', 'QR');

-- CreateEnum
CREATE TYPE "TariffStatus" AS ENUM ('ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "TariffFeeType" AS ENUM ('MONTHLY_POS', 'DEVICE_MAINTENANCE', 'SIM_LINE', 'STATEMENT', 'SOFTWARE', 'INACTIVITY', 'MIN_VOLUME_PENALTY', 'EARLY_TERMINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentFileType" AS ENUM ('PDF', 'IMAGE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('USER_INPUT', 'BANK_DOCUMENT', 'AI_EXTRACTED', 'MANUAL_EDIT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'USER_VERIFIED', 'BANK_VERIFIED');

-- CreateEnum
CREATE TYPE "SaleTransactionType" AS ENUM ('SINGLE', 'INSTALLMENT', 'FOREIGN_CARD', 'COMMERCIAL_CARD', 'REFUND', 'CANCEL');

-- CreateEnum
CREATE TYPE "ExpectedPaymentStatus" AS ENUM ('WAITING', 'DUE_TODAY', 'DELAYED', 'PARTIALLY_PAID', 'FULLY_PAID', 'DIFFERENCE_FOUND');

-- CreateEnum
CREATE TYPE "DifferenceStatus" AS ENUM ('MATCHED', 'NEEDS_REVIEW', 'DELAYED', 'PARTIALLY_PAID', 'DIFFERENCE_FOUND');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('UPLOADED', 'EXTRACTING_TEXT', 'CLASSIFYING_CLAUSES', 'CALCULATING_IMPACT', 'COMPLETED', 'NEEDS_MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY_SUMMARY', 'MONTHLY_COST', 'BANK_COMPARISON', 'POS_COMPARISON', 'DIFFERENCE_REPORT', 'ANNUAL_NEGOTIATION', 'CONTRACT_ANALYSIS_SUMMARY');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'HTML');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE_TOMORROW', 'PAYMENT_DUE_TODAY', 'PAYMENT_DELAYED', 'PAYMENT_BELOW_EXPECTED', 'TARIFF_EXPIRING', 'CAMPAIGN_EXPIRING', 'VOLUME_COMMITMENT_RISK', 'MONTHLY_REPORT_READY', 'NEW_DEVICE_LOGIN', 'CRITICAL_SETTING_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'AI');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "estimatedAnnualVolume" DECIMAL(14,2),
    "branchCount" INTEGER NOT NULL DEFAULT 1,
    "status" "CompanyStatus" NOT NULL DEFAULT 'TRIAL',
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "CompanyUserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAccount" (
    "id" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "companyId" TEXT,
    "companyUserId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginApproval" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegramAccountId" TEXT NOT NULL,
    "companyId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "status" "LoginApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchName" TEXT,
    "customerNumber" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankContact" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "BankContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosDevice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "terminalNo" TEXT NOT NULL,
    "merchantNo" TEXT NOT NULL,
    "type" "PosType" NOT NULL DEFAULT 'PHYSICAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "PosDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffVersion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "posId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "campaignName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "TariffStatus" NOT NULL DEFAULT 'ACTIVE',
    "supersededById" TEXT,
    "bankOfficerName" TEXT,
    "documentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "TariffVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffSinglePaymentRate" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "nextDayRate" DECIMAL(6,3) NOT NULL,
    "valor2DayRate" DECIMAL(6,3),
    "valor7DayRate" DECIMAL(6,3),
    "blockedConditionNote" TEXT,
    "foreignCardRate" DECIMAL(6,3),
    "commercialCardRate" DECIMAL(6,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffSinglePaymentRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffInstallmentRate" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "commissionRate" DECIMAL(6,3) NOT NULL,
    "valorDays" INTEGER NOT NULL,
    "fixedFee" DECIMAL(14,2),
    "campaignName" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffInstallmentRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffFee" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "feeType" "TariffFeeType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffCommitment" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "monthlyVolumeCommitment" DECIMAL(14,2),
    "annualVolumeCommitment" DECIMAL(14,2),
    "productUsageCommitment" TEXT,
    "salaryAgreementLink" BOOLEAN NOT NULL DEFAULT false,
    "creditLink" BOOLEAN NOT NULL DEFAULT false,
    "autoPaymentInstruction" BOOLEAN NOT NULL DEFAULT false,
    "breachPenalty" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffDocument" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "DocumentFileType" NOT NULL,
    "hasStamp" BOOLEAN NOT NULL DEFAULT false,
    "hasSignature" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByUser" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "TariffDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySale" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "posId" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "saleDate" DATE NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'USER_INPUT',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "DailySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySaleItem" (
    "id" TEXT NOT NULL,
    "dailySaleId" TEXT NOT NULL,
    "transactionType" "SaleTransactionType" NOT NULL,
    "installmentCount" INTEGER,
    "amount" DECIMAL(14,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 1,
    "cardType" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpectedPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "posId" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "dailySaleId" TEXT,
    "dailySaleItemId" TEXT,
    "saleDate" DATE NOT NULL,
    "expectedPaymentDate" DATE NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "expectedDeduction" DECIMAL(14,2) NOT NULL,
    "expectedNet" DECIMAL(14,2) NOT NULL,
    "status" "ExpectedPaymentStatus" NOT NULL DEFAULT 'WAITING',
    "sourceType" "SourceType" NOT NULL DEFAULT 'USER_INPUT',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ExpectedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expectedPaymentId" TEXT NOT NULL,
    "receivedAmount" DECIMAL(14,2) NOT NULL,
    "receivedDate" DATE NOT NULL,
    "bankDescription" TEXT,
    "documentUrl" TEXT,
    "sourceType" "SourceType" NOT NULL DEFAULT 'USER_INPUT',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "ActualPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentDifference" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expectedPaymentId" TEXT NOT NULL,
    "actualPaymentId" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "differenceAmount" DECIMAL(14,2) NOT NULL,
    "differencePercentage" DECIMAL(8,3) NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "estimatedAppliedRate" DECIMAL(6,3),
    "roundingTolerance" DECIMAL(14,2) NOT NULL DEFAULT 1,
    "status" "DifferenceStatus" NOT NULL,
    "ruleExplanations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "PaymentDifference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankId" TEXT,
    "posId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'UPLOADED',
    "sourceType" "SourceType" NOT NULL DEFAULT 'USER_INPUT',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractPage" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAnalysis" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "summary60s" TEXT NOT NULL,
    "advantages" JSONB NOT NULL,
    "attentionPoints" JSONB NOT NULL,
    "commissionSummary" JSONB,
    "valorSummary" TEXT,
    "volumeCommitmentNote" TEXT,
    "earlyTerminationNote" TEXT,
    "autoRenewalNote" TEXT,
    "unilateralChangeNote" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ContractAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractRisk" (
    "id" TEXT NOT NULL,
    "contractAnalysisId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "sourcePageNumber" INTEGER,
    "sourceClauseRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractQuestion" (
    "id" TEXT NOT NULL,
    "contractAnalysisId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "fileUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyUserId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_taxNumber_key" ON "Company"("taxNumber");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_companyId_email_key" ON "CompanyUser"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAccount_telegramUserId_key" ON "TelegramAccount"("telegramUserId");

-- CreateIndex
CREATE INDEX "TelegramAccount_companyId_idx" ON "TelegramAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginApproval_token_key" ON "LoginApproval"("token");

-- CreateIndex
CREATE INDEX "LoginApproval_companyId_idx" ON "LoginApproval"("companyId");

-- CreateIndex
CREATE INDEX "LoginApproval_status_expiresAt_idx" ON "LoginApproval"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Bank_companyId_idx" ON "Bank"("companyId");

-- CreateIndex
CREATE INDEX "BankContact_bankId_idx" ON "BankContact"("bankId");

-- CreateIndex
CREATE INDEX "PosDevice_companyId_idx" ON "PosDevice"("companyId");

-- CreateIndex
CREATE INDEX "PosDevice_bankId_idx" ON "PosDevice"("bankId");

-- CreateIndex
CREATE UNIQUE INDEX "PosDevice_companyId_terminalNo_key" ON "PosDevice"("companyId", "terminalNo");

-- CreateIndex
CREATE UNIQUE INDEX "TariffVersion_supersededById_key" ON "TariffVersion"("supersededById");

-- CreateIndex
CREATE INDEX "TariffVersion_companyId_idx" ON "TariffVersion"("companyId");

-- CreateIndex
CREATE INDEX "TariffVersion_posId_startDate_endDate_idx" ON "TariffVersion"("posId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "TariffVersion_posId_versionNumber_key" ON "TariffVersion"("posId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TariffSinglePaymentRate_tariffVersionId_key" ON "TariffSinglePaymentRate"("tariffVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TariffInstallmentRate_tariffVersionId_installmentCount_key" ON "TariffInstallmentRate"("tariffVersionId", "installmentCount");

-- CreateIndex
CREATE INDEX "TariffFee_tariffVersionId_idx" ON "TariffFee"("tariffVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TariffCommitment_tariffVersionId_key" ON "TariffCommitment"("tariffVersionId");

-- CreateIndex
CREATE INDEX "TariffDocument_tariffVersionId_idx" ON "TariffDocument"("tariffVersionId");

-- CreateIndex
CREATE INDEX "DailySale_companyId_idx" ON "DailySale"("companyId");

-- CreateIndex
CREATE INDEX "DailySale_posId_saleDate_idx" ON "DailySale"("posId", "saleDate");

-- CreateIndex
CREATE INDEX "DailySaleItem_dailySaleId_idx" ON "DailySaleItem"("dailySaleId");

-- CreateIndex
CREATE INDEX "ExpectedPayment_companyId_idx" ON "ExpectedPayment"("companyId");

-- CreateIndex
CREATE INDEX "ExpectedPayment_posId_expectedPaymentDate_idx" ON "ExpectedPayment"("posId", "expectedPaymentDate");

-- CreateIndex
CREATE INDEX "ExpectedPayment_status_idx" ON "ExpectedPayment"("status");

-- CreateIndex
CREATE INDEX "ActualPayment_companyId_idx" ON "ActualPayment"("companyId");

-- CreateIndex
CREATE INDEX "ActualPayment_expectedPaymentId_idx" ON "ActualPayment"("expectedPaymentId");

-- CreateIndex
CREATE INDEX "PaymentDifference_companyId_idx" ON "PaymentDifference"("companyId");

-- CreateIndex
CREATE INDEX "PaymentDifference_expectedPaymentId_idx" ON "PaymentDifference"("expectedPaymentId");

-- CreateIndex
CREATE INDEX "Contract_companyId_idx" ON "Contract"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractPage_contractId_pageNumber_key" ON "ContractPage"("contractId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAnalysis_contractId_key" ON "ContractAnalysis"("contractId");

-- CreateIndex
CREATE INDEX "ContractAnalysis_contractId_idx" ON "ContractAnalysis"("contractId");

-- CreateIndex
CREATE INDEX "ContractRisk_contractAnalysisId_idx" ON "ContractRisk"("contractAnalysisId");

-- CreateIndex
CREATE INDEX "ContractQuestion_contractAnalysisId_idx" ON "ContractQuestion"("contractAnalysisId");

-- CreateIndex
CREATE INDEX "Report_companyId_idx" ON "Report"("companyId");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "CompanyUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginApproval" ADD CONSTRAINT "LoginApproval_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginApproval" ADD CONSTRAINT "LoginApproval_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bank" ADD CONSTRAINT "Bank_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankContact" ADD CONSTRAINT "BankContact_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "TariffVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffSinglePaymentRate" ADD CONSTRAINT "TariffSinglePaymentRate_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffInstallmentRate" ADD CONSTRAINT "TariffInstallmentRate_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffFee" ADD CONSTRAINT "TariffFee_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffCommitment" ADD CONSTRAINT "TariffCommitment_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffDocument" ADD CONSTRAINT "TariffDocument_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySaleItem" ADD CONSTRAINT "DailySaleItem_dailySaleId_fkey" FOREIGN KEY ("dailySaleId") REFERENCES "DailySale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_dailySaleId_fkey" FOREIGN KEY ("dailySaleId") REFERENCES "DailySale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedPayment" ADD CONSTRAINT "ExpectedPayment_dailySaleItemId_fkey" FOREIGN KEY ("dailySaleItemId") REFERENCES "DailySaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualPayment" ADD CONSTRAINT "ActualPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualPayment" ADD CONSTRAINT "ActualPayment_expectedPaymentId_fkey" FOREIGN KEY ("expectedPaymentId") REFERENCES "ExpectedPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDifference" ADD CONSTRAINT "PaymentDifference_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDifference" ADD CONSTRAINT "PaymentDifference_expectedPaymentId_fkey" FOREIGN KEY ("expectedPaymentId") REFERENCES "ExpectedPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDifference" ADD CONSTRAINT "PaymentDifference_actualPaymentId_fkey" FOREIGN KEY ("actualPaymentId") REFERENCES "ActualPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDifference" ADD CONSTRAINT "PaymentDifference_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_posId_fkey" FOREIGN KEY ("posId") REFERENCES "PosDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPage" ADD CONSTRAINT "ContractPage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAnalysis" ADD CONSTRAINT "ContractAnalysis_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRisk" ADD CONSTRAINT "ContractRisk_contractAnalysisId_fkey" FOREIGN KEY ("contractAnalysisId") REFERENCES "ContractAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractQuestion" ADD CONSTRAINT "ContractQuestion_contractAnalysisId_fkey" FOREIGN KEY ("contractAnalysisId") REFERENCES "ContractAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
