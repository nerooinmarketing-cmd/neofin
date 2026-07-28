import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { tariffInfoSchema } from "@/server/onboarding/schemas";
import { completeTariffStep } from "@/server/onboarding/onboarding-service";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const installmentRatesRaw = formData.get("installmentRates");
  let installmentRates: unknown = [];
  try {
    installmentRates = installmentRatesRaw ? JSON.parse(String(installmentRatesRaw)) : [];
  } catch {
    return NextResponse.json({ error: "taksit oranları çözümlenemedi" }, { status: 400 });
  }

  const raw = {
    campaignName: formData.get("campaignName") || undefined,
    startDate: formData.get("startDate"),
    nextDayRate: formData.get("nextDayRate"),
    valor2DayRate: formData.get("valor2DayRate") || undefined,
    valor7DayRate: formData.get("valor7DayRate") || undefined,
    foreignCardRate: formData.get("foreignCardRate") || undefined,
    commercialCardRate: formData.get("commercialCardRate") || undefined,
    installmentRates,
    monthlyFee: formData.get("monthlyFee") || undefined,
    hasStamp: formData.get("hasStamp") === "true",
    hasSignature: formData.get("hasSignature") === "true",
    verifiedByUser: formData.get("verifiedByUser") === "true",
  };

  const parsed = tariffInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const documentEntry = formData.get("document");
  const documentFile = documentEntry instanceof File && documentEntry.size > 0 ? documentEntry : null;

  const tariff = await completeTariffStep(ctx, parsed.data, documentFile);
  return NextResponse.json({ ok: true, tariff });
}
