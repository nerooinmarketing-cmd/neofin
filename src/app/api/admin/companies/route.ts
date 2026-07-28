import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { adminRepository } from "@/server/admin/admin-repository";
import type { PackageTier } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { name?: string; phone?: string; packageTier?: PackageTier }
    | null;
  if (!body?.name || !body.phone) {
    return NextResponse.json({ error: "Firma adı ve telefon gerekli" }, { status: 400 });
  }

  const company = await adminRepository.createCompany({
    name: body.name.trim(),
    phone: body.phone.trim(),
    packageTier: body.packageTier ?? "BASIC",
  });

  return NextResponse.json({ ok: true, companyId: company.id });
}
