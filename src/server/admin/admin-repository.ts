import { prisma } from "@/lib/prisma";
import type { CompanyStatus, CompanyUserRole, PackageTier } from "@/generated/prisma/enums";

/**
 * Yönetici paneli (Aşama 15) veri katmanı — kasıtlı olarak `TenantContext`
 * ALMAZ ve `companyId` ile sınırlamaz. Bu, `prisma/TENANT_SECURITY.md`'deki
 * "her sorguda companyId zorunlu" kuralının istisnasıdır: sistem yöneticisi
 * tanım gereği tüm firmaları görebilmelidir. Erişim
 * `requireSystemAdminContext()` (ayrı oturum/route) ile korunur — tenant
 * oturumundan tamamen bağımsızdır. Bu dosya dışındaki hiçbir repository
 * `companyId` filtresiz sorgu çalıştırmamalıdır.
 */
export const adminRepository = {
  async listCompanies() {
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        telegramAccounts: { where: { companyUserId: { not: null } } },
        banks: { where: { deletedAt: null } },
        posDevices: { where: { deletedAt: null, isActive: true } },
        companyUsers: { where: { deletedAt: null }, include: { sessions: { orderBy: { lastSeenAt: "desc" }, take: 1 } } },
      },
    });

    return companies.map((c) => {
      const lastSeenDates = c.companyUsers.flatMap((u) => u.sessions.map((s) => s.lastSeenAt));
      const lastLoginAt = lastSeenDates.length > 0 ? new Date(Math.max(...lastSeenDates.map((d) => d.getTime()))) : null;

      return {
        id: c.id,
        name: c.shortName ?? c.name ?? c.phone,
        phone: c.phone,
        packageTier: c.packageTier,
        status: c.status,
        supportStatus: c.supportStatus,
        trialEndsAt: c.trialEndsAt,
        onboardingCompleted: c.onboardingCompletedAt !== null,
        telegramLinkedCount: c.telegramAccounts.length,
        activeBankCount: c.banks.length,
        activePosCount: c.posDevices.length,
        lastLoginAt,
        createdAt: c.createdAt,
      };
    });
  },

  async getCompanyDetail(companyId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        companyUsers: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        banks: { where: { deletedAt: null } },
        posDevices: { where: { deletedAt: null }, include: { bank: true, branch: true } },
        telegramAccounts: { orderBy: { createdAt: "desc" } },
        supportNotes: { orderBy: { createdAt: "desc" }, include: { systemAdmin: true } },
      },
    });
    if (!company) return null;

    const [tariffVersionCount, recentSales, latestReport, criticalDifferences] = await Promise.all([
      prisma.tariffVersion.count({ where: { companyId } }),
      prisma.dailySale.findMany({
        where: { companyId },
        orderBy: { saleDate: "desc" },
        take: 10,
        select: { saleDate: true },
      }),
      prisma.report.findFirst({ where: { companyId }, orderBy: { generatedAt: "desc" } }),
      prisma.paymentDifference.count({
        where: { companyId, status: { in: ["NEEDS_REVIEW", "DIFFERENCE_FOUND"] } },
      }),
    ]);

    return {
      company,
      tariffVersionCount,
      recentSaleDates: recentSales.map((s) => s.saleDate),
      latestReport,
      criticalDifferenceCount: criticalDifferences,
    };
  },

  async listAuditLogs(take = 100) {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { company: true },
    });
    return logs.map((log) => ({
      id: log.id,
      companyName: log.company?.shortName ?? log.company?.name ?? log.company?.phone ?? "—",
      actorType: log.actorType,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
    }));
  },

  // --- Destek araçları -------------------------------------------------

  async createCompany(input: { name: string; phone: string; packageTier: PackageTier }) {
    return prisma.company.create({
      data: { name: input.name, shortName: input.name, phone: input.phone, packageTier: input.packageTier, status: "TRIAL" },
    });
  },

  setCompanyStatus(companyId: string, status: CompanyStatus) {
    return prisma.company.update({ where: { id: companyId }, data: { status } });
  },

  setPackageTier(companyId: string, packageTier: PackageTier) {
    return prisma.company.update({ where: { id: companyId }, data: { packageTier } });
  },

  setTrialEndsAt(companyId: string, trialEndsAt: Date | null) {
    return prisma.company.update({ where: { id: companyId }, data: { trialEndsAt } });
  },

  async addSupportNote(companyId: string, systemAdminId: string, note: string) {
    const [supportNote] = await prisma.$transaction([
      prisma.supportNote.create({ data: { companyId, systemAdminId, note } }),
      prisma.company.update({ where: { id: companyId }, data: { supportStatus: "OPEN" } }),
    ]);
    return supportNote;
  },

  setSupportStatus(companyId: string, supportStatus: "NONE" | "OPEN" | "RESOLVED") {
    return prisma.company.update({ where: { id: companyId }, data: { supportStatus } });
  },

  createCompanyUser(companyId: string, input: { name: string; role: CompanyUserRole; email?: string; phone?: string }) {
    return prisma.companyUser.create({
      data: { companyId, name: input.name, role: input.role, email: input.email, phone: input.phone },
    });
  },

  deactivateCompanyUser(companyUserId: string) {
    return prisma.companyUser.update({
      where: { id: companyUserId },
      data: { isActive: false, deletedAt: new Date() },
    });
  },

  promoteToOwner(companyUserId: string) {
    return prisma.companyUser.update({ where: { id: companyUserId }, data: { role: "OWNER" } });
  },
};
