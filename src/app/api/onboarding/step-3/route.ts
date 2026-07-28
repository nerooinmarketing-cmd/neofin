import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { posInfoSchema } from "@/server/onboarding/schemas";
import { completePosStep } from "@/server/onboarding/onboarding-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = posInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const pos = await completePosStep(ctx, parsed.data);
  return NextResponse.json({ ok: true, pos });
}
