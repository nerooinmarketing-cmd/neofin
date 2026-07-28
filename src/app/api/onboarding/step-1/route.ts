import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { companyInfoSchema } from "@/server/onboarding/schemas";
import { completeCompanyStep } from "@/server/onboarding/onboarding-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = companyInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const company = await completeCompanyStep(ctx, parsed.data);
  return NextResponse.json({ ok: true, company });
}
