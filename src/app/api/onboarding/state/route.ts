import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { getOnboardingState } from "@/server/onboarding/onboarding-service";

export async function GET(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { bank, pos, tariff } = await getOnboardingState(ctx);
  if (!bank || !pos || !tariff) {
    return NextResponse.json({ error: "Kurulum henüz tamamlanmadı" }, { status: 409 });
  }

  const singleRate = tariff.singlePaymentRates;
  const document = tariff.documents[0];

  return NextResponse.json({
    bankName: bank.name,
    posName: pos.name,
    terminalNo: pos.terminalNo,
    nextDayRate: singleRate ? Number(singleRate.nextDayRate) : 0,
    installmentRates: tariff.installmentRates
      .sort((a, b) => a.installmentCount - b.installmentCount)
      .map((r) => ({
        installmentCount: r.installmentCount,
        commissionRate: Number(r.commissionRate),
        valorDays: r.valorDays,
      })),
    monthlyFee: tariff.fees[0] ? Number(tariff.fees[0].amount) : null,
    startDate: tariff.startDate.toISOString(),
    documentUrl: document?.fileUrl ?? null,
    hasStamp: document?.hasStamp ?? false,
    hasSignature: document?.hasSignature ?? false,
  });
}
