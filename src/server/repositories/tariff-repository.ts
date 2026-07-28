import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { NotFoundError, TariffOverlapError } from "@/server/errors";
import type { TariffFeeType, DocumentFileType } from "@/generated/prisma/enums";

export interface CreateTariffVersionInput {
  posId: string;
  bankId: string;
  campaignName?: string;
  startDate: Date;
  bankOfficerName?: string;
  documentDate?: Date;

  // Bölüm 2 — Tek çekim oranları
  singlePaymentRates: {
    nextDayRate: number;
    valor2DayRate?: number;
    valor7DayRate?: number;
    blockedConditionNote?: string;
    foreignCardRate?: number;
    commercialCardRate?: number;
  };

  // Bölüm 3 — Taksit oranları
  installmentRates: Array<{
    installmentCount: number;
    commissionRate: number;
    valorDays: number;
    fixedFee?: number;
    campaignName?: string;
    validUntil?: Date;
  }>;

  // Bölüm 4 — Kart ve işlem türleri
  transactionSupport?: {
    ownBankCard: boolean;
    otherBankCard: boolean;
    commercialCard: boolean;
    foreignCard: boolean;
    loyaltyPoints: boolean;
    refund: boolean;
    cancellation: boolean;
    mailOrder: boolean;
    contactless: boolean;
    qr: boolean;
  };

  // Bölüm 5 — Sabit ücretler
  fees?: Array<{ feeType: TariffFeeType; amount: number; note?: string }>;

  // Bölüm 6 — Valör ve ödeme
  paymentTerms?: {
    paymentDay?: string;
    holidayPaymentRule?: string;
    weekendPaymentDay?: string;
    partialPaymentRule?: string;
    blockDurationDays?: number;
    blockReleaseCondition?: string;
  };

  // Bölüm 7 — Taahhütler
  commitments?: {
    monthlyVolumeCommitment?: number;
    annualVolumeCommitment?: number;
    productUsageCommitment?: string;
    salaryAgreementLink: boolean;
    creditLink: boolean;
    autoPaymentInstruction: boolean;
    breachPenalty?: number;
  };

  // Bölüm 8 — Belge ve onay
  document?: {
    fileUrl: string;
    fileType: DocumentFileType;
    hasStamp: boolean;
    hasSignature: boolean;
    verifiedByUser: boolean;
    note?: string;
  };
}

export const tariffRepository = {
  /**
   * İşlem tarihine göre geçerli olan tarife sürümünü bulur. Sürüm artık
   * SUPERSEDED olsa da geçmiş bir satış tarihi için doğru sürüm budur —
   * bu yüzden `status` değil, tarih aralığı esas alınır.
   */
  async findVersionForDate(ctx: TenantContext, posId: string, date: Date) {
    return prisma.tariffVersion.findFirst({
      where: {
        companyId: ctx.companyId,
        posId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      include: {
        singlePaymentRates: true,
        installmentRates: true,
        fees: true,
        paymentTerms: true,
      },
      orderBy: { versionNumber: "desc" },
    });
  },

  listVersions(ctx: TenantContext, posId: string) {
    return prisma.tariffVersion.findMany({
      where: { companyId: ctx.companyId, posId },
      orderBy: { versionNumber: "desc" },
    });
  },

  listByBank(ctx: TenantContext, bankId: string) {
    return prisma.tariffVersion.findMany({
      where: { companyId: ctx.companyId, bankId },
      include: { pos: true, documents: true },
      orderBy: [{ posId: "asc" }, { versionNumber: "desc" }],
    });
  },

  async getFullVersionOrThrow(ctx: TenantContext, versionId: string) {
    const version = await prisma.tariffVersion.findFirst({
      where: { id: versionId, companyId: ctx.companyId },
      include: {
        singlePaymentRates: true,
        installmentRates: { orderBy: { installmentCount: "asc" } },
        transactionSupport: true,
        fees: true,
        paymentTerms: true,
        commitments: true,
        documents: true,
        pos: true,
        bank: true,
      },
    });
    if (!version) throw new NotFoundError("TariffVersion", versionId);
    return version;
  },

  /**
   * Yeni tarife sürümü oluşturur. Aynı POS için açık uçlu (endDate: null)
   * bir önceki sürüm varsa, onu yeni sürümün başlangıç tarihinden bir gün
   * öncesinde kapatıp SUPERSEDED işaretler — hiçbir sürüm silinmez.
   * Kapalı (endDate dolu) bir sürümle tarih çakışması varsa reddedilir.
   */
  async createNewVersion(ctx: TenantContext, input: CreateTariffVersionInput) {
    const pos = await prisma.posDevice.findFirst({
      where: { id: input.posId, companyId: ctx.companyId, deletedAt: null },
    });
    if (!pos) throw new NotFoundError("PosDevice", input.posId);

    return prisma.$transaction(async (tx) => {
      const existingVersions = await tx.tariffVersion.findMany({
        where: { companyId: ctx.companyId, posId: input.posId },
        orderBy: { versionNumber: "desc" },
      });

      const openVersion = existingVersions.find((v) => v.endDate === null);
      const closedOverlap = existingVersions.find(
        (v) =>
          v.endDate !== null &&
          v.startDate <= input.startDate &&
          v.endDate >= input.startDate,
      );
      if (closedOverlap) {
        throw new TariffOverlapError(
          `Yeni tarife başlangıcı (${input.startDate.toISOString()}) mevcut sürüm ${closedOverlap.versionNumber} ile çakışıyor.`,
        );
      }

      const nextVersionNumber = (existingVersions[0]?.versionNumber ?? 0) + 1;

      const newVersion = await tx.tariffVersion.create({
        data: {
          companyId: ctx.companyId,
          posId: input.posId,
          bankId: input.bankId,
          versionNumber: nextVersionNumber,
          campaignName: input.campaignName,
          startDate: input.startDate,
          bankOfficerName: input.bankOfficerName,
          documentDate: input.documentDate,
          status: "ACTIVE",
          createdById: ctx.companyUserId,
          singlePaymentRates: { create: input.singlePaymentRates },
          installmentRates: { create: input.installmentRates },
          transactionSupport: input.transactionSupport
            ? { create: input.transactionSupport }
            : undefined,
          fees: input.fees?.length ? { create: input.fees } : undefined,
          paymentTerms: input.paymentTerms ? { create: input.paymentTerms } : undefined,
          commitments: input.commitments ? { create: input.commitments } : undefined,
          documents: input.document
            ? { create: { ...input.document, createdById: ctx.companyUserId } }
            : undefined,
        },
      });

      if (openVersion) {
        const supersededEndDate = new Date(input.startDate);
        supersededEndDate.setDate(supersededEndDate.getDate() - 1);

        await tx.tariffVersion.update({
          where: { id: openVersion.id },
          data: {
            endDate: supersededEndDate,
            status: "SUPERSEDED",
            supersededById: newVersion.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "TARIFF_VERSION_CREATE",
          entityType: "TariffVersion",
          entityId: newVersion.id,
          before: openVersion ? { supersededVersionId: openVersion.id } : undefined,
          after: { versionNumber: newVersion.versionNumber },
        },
      });

      return newVersion;
    });
  },
};
