import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { saveOnboardingDraft } from "@/server/onboarding/onboarding-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "geçersiz gövde" }, { status: 400 });
  }

  await saveOnboardingDraft(ctx, body);
  return NextResponse.json({ ok: true });
}
