import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await reportRepository.getBankComparison(ctx, currentMonthRange());

  const csv = toCsv(
    ["Banka", "Ciro", "Ortalama Oran (%)", "Beklenen Kesinti", "Gerçekleşen Kesinti", "Fark", "Ortalama Valör (gün)", "Sabit Ücret"],
    rows.map((r) => [
      r.bankName,
      r.grossTotal.toFixed(2),
      r.avgRate.toFixed(2),
      r.expectedDeductionTotal.toFixed(2),
      r.actualDeductionTotal !== null ? r.actualDeductionTotal.toFixed(2) : "",
      r.difference !== null ? r.difference.toFixed(2) : "",
      r.avgValorDays.toFixed(1),
      r.fixedFeeTotal.toFixed(2),
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="banka-karsilastirma.csv"',
    },
  });
}
