import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/errors";
import type { QuoteRequestStatus } from "@/generated/prisma/enums";

export interface CreateQuoteRequestInput {
  name: string;
  phone: string;
  companyName?: string;
  message?: string;
}

/**
 * Halka açık tanıtım sayfasındaki "Teklif Alın" formunun veri katmanı.
 * `TenantContext` almaz — bkz. `prisma/TENANT_SECURITY.md` §7 ("Firma
 * eşleştirmesi öncesi tablolar"). Okuma/durum güncelleme yalnızca yönetici
 * paneli üzerinden, `requireSystemAdminContext()` ile korunur.
 */
export const quoteRequestRepository = {
  create(input: CreateQuoteRequestInput) {
    return prisma.quoteRequest.create({
      data: {
        name: input.name,
        phone: input.phone,
        companyName: input.companyName || undefined,
        message: input.message || undefined,
      },
    });
  },

  listAll() {
    return prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { contactedBy: { select: { name: true } } },
    });
  },

  async setStatus(id: string, status: QuoteRequestStatus, systemAdminId: string) {
    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("QuoteRequest", id);

    return prisma.quoteRequest.update({
      where: { id },
      data: {
        status,
        contactedById: status === "NEW" ? null : systemAdminId,
        contactedAt: status === "NEW" ? null : new Date(),
      },
    });
  },
};
