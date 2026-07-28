import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const report = await reportRepository.getPosComparison(ctx, currentMonthRange());

  const csv = toCsv(
    ["POS", "Banka", "Ciro", "Beklenen Kesinti", "Toplam Fark", "En Yüksek Taksit Oranı (%)"],
    report.rows.map((r) => [
      r.posName,
      r.bankName,
      r.grossTotal.toFixed(2),
      r.expectedDeductionTotal.toFixed(2),
      r.totalDifferenceAbs.toFixed(2),
      r.maxInstallmentRate.toFixed(2),
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pos-karsilastirma.csv"',
    },
  });
}
