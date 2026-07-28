import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { TenantContext } from "@/server/tenant-context";
import { saveUploadedFile } from "@/server/storage/file-storage";
import type {
  BankInfoInput,
  CompanyInfoInput,
  PosInfoInput,
  TariffInfoInput,
} from "@/server/onboarding/schemas";

const DEFAULT_BRANCH_NAME = "Merkez Şube";

export async function getOnboardingState(ctx: TenantContext) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: ctx.companyId } });
  const bank = await prisma.bank.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: "asc" },
  });
  const pos = await prisma.posDevice.findFirst({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: "asc" },
  });
  const tariff = pos
    ? await prisma.tariffVersion.findFirst({
        where: { companyId: ctx.companyId, posId: pos.id },
        include: { singlePaymentRates: true, installmentRates: true, fees: true, documents: true },
        orderBy: { createdAt: "asc" },
      })
    : null;

  return { company, bank, pos, tariff };
}

export async function saveOnboardingDraft(ctx: TenantContext, draft: Prisma.InputJsonValue) {
  await prisma.company.update({
    where: { id: ctx.companyId },
    data: { onboardingDraft: draft },
  });
}

export async function completeCompanyStep(ctx: TenantContext, input: CompanyInfoInput) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.update({
      where: { id: ctx.companyId },
      data: {
        name: input.name,
        shortName: input.shortName,
        taxNumber: input.taxNumber,
        contactName: input.contactName,
        phone: input.phone,
        email: input.email,
        city: input.city,
        district: input.district,
        sector: input.sector,
        estimatedAnnualVolume: input.estimatedAnnualVolume,
        branchCount: input.branchCount,
        onboardingStep: 2,
        onboardingDraft: Prisma.JsonNull,
      },
    });

    const existingBranch = await tx.branch.findFirst({ where: { companyId: ctx.companyId } });
    if (!existingBranch) {
      await tx.branch.create({
        data: {
          companyId: ctx.companyId,
          name: DEFAULT_BRANCH_NAME,
          city: input.city,
          district: input.district,
          createdById: ctx.companyUserId,
        },
      });
    }

    return company;
  });
}

export async function completeBankStep(ctx: TenantContext, input: BankInfoInput) {
  return prisma.$transaction(async (tx) => {
    const bank = await tx.bank.create({
      data: {
        companyId: ctx.companyId,
        name: input.bankName,
        branchName: input.branchName,
        customerNumber: input.customerNumber,
        note: input.note,
        createdById: ctx.companyUserId,
        contacts: input.contactName
          ? {
              create: {
                name: input.contactName,
                phone: input.contactPhone,
                email: input.contactEmail || undefined,
                isPrimary: true,
                createdById: ctx.companyUserId,
              },
            }
          : undefined,
      },
    });

    await tx.company.update({
      where: { id: ctx.companyId },
      data: { onboardingStep: 3, onboardingDraft: Prisma.JsonNull },
    });

    return bank;
  });
}

export async function completePosStep(ctx: TenantContext, input: PosInfoInput) {
  const branch = await prisma.branch.findFirstOrThrow({ where: { companyId: ctx.companyId } });
  const bank = await prisma.bank.findFirstOrThrow({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: "asc" },
  });

  return prisma.$transaction(async (tx) => {
    const pos = await tx.posDevice.create({
      data: {
        companyId: ctx.companyId,
        branchId: branch.id,
        bankId: bank.id,
        name: input.posName,
        terminalNo: input.terminalNo,
        merchantNo: input.merchantNo,
        type: input.posType,
        isActive: input.isActive,
        createdById: ctx.companyUserId,
      },
    });

    await tx.company.update({
      where: { id: ctx.companyId },
      data: { onboardingStep: 4, onboardingDraft: Prisma.JsonNull },
    });

    return pos;
  });
}

export async function completeTariffStep(
  ctx: TenantContext,
  input: TariffInfoInput,
  documentFile: File | null,
) {
  const pos = await prisma.posDevice.findFirstOrThrow({
    where: { companyId: ctx.companyId },
    orderBy: { createdAt: "asc" },
  });

  const document = documentFile
    ? await saveUploadedFile(documentFile, `tariffs/${ctx.companyId}`)
    : null;

  return prisma.$transaction(async (tx) => {
    const tariff = await tx.tariffVersion.create({
      data: {
        companyId: ctx.companyId,
        posId: pos.id,
        bankId: pos.bankId,
        versionNumber: 1,
        campaignName: input.campaignName,
        startDate: input.startDate,
        status: "ACTIVE",
        createdById: ctx.companyUserId,
        singlePaymentRates: {
          create: {
            nextDayRate: input.nextDayRate,
            valor2DayRate: input.valor2DayRate,
            valor7DayRate: input.valor7DayRate,
            foreignCardRate: input.foreignCardRate,
            commercialCardRate: input.commercialCardRate,
          },
        },
        installmentRates: {
          create: input.installmentRates.map((rate) => ({
            installmentCount: rate.installmentCount,
            commissionRate: rate.commissionRate,
            valorDays: rate.valorDays,
          })),
        },
        fees:
          input.monthlyFee !== undefined
            ? { create: { feeType: "MONTHLY_POS", amount: input.monthlyFee } }
            : undefined,
        documents: document
          ? {
              create: {
                fileUrl: document.url,
                fileType: documentFile!.type === "application/pdf" ? "PDF" : "IMAGE",
                hasStamp: input.hasStamp,
                hasSignature: input.hasSignature,
                verifiedByUser: input.verifiedByUser,
                createdById: ctx.companyUserId,
              },
            }
          : undefined,
      },
    });

    await tx.company.update({
      where: { id: ctx.companyId },
      data: { onboardingStep: 5, onboardingDraft: Prisma.JsonNull },
    });

    await tx.auditLog.create({
      data: {
        companyId: ctx.companyId,
        actorType: "USER",
        actorUserId: ctx.companyUserId,
        action: "ONBOARDING_TARIFF_CREATE",
        entityType: "TariffVersion",
        entityId: tariff.id,
      },
    });

    return tariff;
  });
}

export class OnboardingIncompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingIncompleteError";
  }
}

export async function completeOnboarding(ctx: TenantContext) {
  const tariffCount = await prisma.tariffVersion.count({ where: { companyId: ctx.companyId } });
  if (tariffCount === 0) {
    // "Tarife olmadan kurulum tamamlanmasın"
    throw new OnboardingIncompleteError("Tarife girilmeden kurulum tamamlanamaz.");
  }

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.update({
      where: { id: ctx.companyId },
      data: { onboardingCompletedAt: new Date(), status: "ACTIVE" },
    });

    await tx.auditLog.create({
      data: {
        companyId: ctx.companyId,
        actorType: "USER",
        actorUserId: ctx.companyUserId,
        action: "ONBOARDING_COMPLETED",
        entityType: "Company",
        entityId: company.id,
      },
    });

    return company;
  });
}
