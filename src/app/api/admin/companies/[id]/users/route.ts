import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { adminRepository } from "@/server/admin/admin-repository";
import { DuplicatePhoneError } from "@/server/errors";
import type { CompanyUserRole } from "@/generated/prisma/enums";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { name?: string; role?: CompanyUserRole; email?: string; phone?: string }
    | null;
  if (!body?.name || !body.role) {
    return NextResponse.json({ error: "Ad ve rol gerekli" }, { status: 400 });
  }

  try {
    const user = await adminRepository.createCompanyUser(id, {
      name: body.name.trim(),
      role: body.role,
      email: body.email,
      phone: body.phone,
    });
    return NextResponse.json({ ok: true, companyUserId: user.id });
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
