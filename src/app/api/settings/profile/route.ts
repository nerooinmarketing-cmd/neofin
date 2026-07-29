import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { companySettingsRepository } from "@/server/repositories/company-settings-repository";

const ownProfileSchema = z.object({
  name: z.string().min(2, "Ad gerekli"),
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export async function PATCH(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = ownProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await companySettingsRepository.updateOwnUser(ctx, {
    name: parsed.data.name,
    email: parsed.data.email || undefined,
    phone: parsed.data.phone || undefined,
  });
  return NextResponse.json({ ok: true, user });
}
