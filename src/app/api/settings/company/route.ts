import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { companyInfoSchema } from "@/server/onboarding/schemas";
import {
  companySettingsRepository,
  DuplicateTaxNumberError,
} from "@/server/repositories/company-settings-repository";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";

export async function PATCH(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const actor = await userRepository.getCurrent(ctx);
  if (!canManageUsers(actor.role)) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = companyInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const company = await companySettingsRepository.updateProfile(ctx, parsed.data);
    return NextResponse.json({ ok: true, company });
  } catch (error) {
    if (error instanceof DuplicateTaxNumberError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
