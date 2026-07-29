import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { TenantContext } from "@/server/tenant-context";
import type { CompanyInfoInput } from "@/server/onboarding/schemas";

export class DuplicateTaxNumberError extends Error {
  constructor() {
    super("Bu vergi numarası başka bir firma tarafından kullanılıyor.");
    this.name = "DuplicateTaxNumberError";
  }
}

export const companySettingsRepository = {
  getProfile(ctx: TenantContext) {
    return prisma.company.findUniqueOrThrow({ where: { id: ctx.companyId } });
  },

  async updateProfile(ctx: TenantContext, input: CompanyInfoInput) {
    try {
      return await prisma.$transaction(async (tx) => {
        const before = await tx.company.findUniqueOrThrow({ where: { id: ctx.companyId } });
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
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: ctx.companyId,
            actorType: "USER",
            actorUserId: ctx.companyUserId,
            action: "COMPANY_PROFILE_UPDATE",
            entityType: "Company",
            entityId: company.id,
            before: { name: before.name, taxNumber: before.taxNumber },
            after: { name: company.name, taxNumber: company.taxNumber },
          },
        });

        return company;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateTaxNumberError();
      }
      throw error;
    }
  },

  async updateOwnUser(ctx: TenantContext, input: { name: string; email?: string; phone?: string }) {
    return prisma.companyUser.update({
      where: { id: ctx.companyUserId },
      data: { name: input.name, email: input.email, phone: input.phone },
    });
  },
};
