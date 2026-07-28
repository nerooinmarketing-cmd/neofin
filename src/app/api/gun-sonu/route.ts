import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { dailySaleFormSchema } from "@/server/daily-sale/schemas";
import { dailySaleRepository } from "@/server/repositories/daily-sale-repository";
import { serializeSummary } from "@/server/daily-sale/serialize-summary";
import { MissingTariffError, UnsupportedInstallmentError } from "@/lib/tariff-engine";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = dailySaleFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { dailySale, summary } = await dailySaleRepository.create(ctx, parsed.data);
    return NextResponse.json({
      ok: true,
      dailySaleId: dailySale.id,
      summary: serializeSummary(summary),
    });
  } catch (error) {
    if (error instanceof MissingTariffError || error instanceof UnsupportedInstallmentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
