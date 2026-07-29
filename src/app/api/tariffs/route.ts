import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { processTariffFormData } from "@/server/tariff/process-submission";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const result = await processTariffFormData(ctx, formData);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  }
  return NextResponse.json({ ok: true, tariffId: result.tariffId });
}
