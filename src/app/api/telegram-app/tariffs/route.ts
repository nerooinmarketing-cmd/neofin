import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantContextFromInitData } from "@/server/telegram/verify-init-data";
import { processTariffFormData } from "@/server/tariff/process-submission";

/** Mini App'in "POS Bilgi Formu" gönderimi — kimlik doğrulama `initData` iledir, cookie kullanmaz. */
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const initData = String(formData.get("initData") ?? "");
  const ctx = await resolveTenantContextFromInitData(initData);
  if (!ctx) {
    return NextResponse.json({ error: "Bu Telegram hesabı bir firmaya bağlı değil." }, { status: 401 });
  }

  const result = await processTariffFormData(ctx, formData);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  }
  return NextResponse.json({ ok: true, tariffId: result.tariffId });
}
