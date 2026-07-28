import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { adminRepository } from "@/server/admin/admin-repository";
import type { CompanyStatus, PackageTier, SupportStatus } from "@/generated/prisma/enums";

interface UpdateBody {
  status?: CompanyStatus;
  packageTier?: PackageTier;
  trialEndsAt?: string | null;
  supportStatus?: SupportStatus;
}

/** Firma alanlarını günceller — Aşama 15 destek araçları: "Firma aktif/pasif", "Paket değiştir", "Deneme süresi tanımla". */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body) return NextResponse.json({ error: "geçersiz istek" }, { status: 400 });

  if (body.status) await adminRepository.setCompanyStatus(id, body.status);
  if (body.packageTier) await adminRepository.setPackageTier(id, body.packageTier);
  if (body.trialEndsAt !== undefined) {
    await adminRepository.setTrialEndsAt(id, body.trialEndsAt ? new Date(body.trialEndsAt) : null);
  }
  if (body.supportStatus) await adminRepository.setSupportStatus(id, body.supportStatus);

  return NextResponse.json({ ok: true });
}
