import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { statusFromDifference } from "@/server/payments/status-labels";
import { formatDate } from "@/lib/format";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const report = await reportRepository.getDifferenceReport(ctx, currentMonthRange());

  const csv = toCsv(
    ["Banka", "POS", "Satış Tarihi", "Fark Tutarı", "Durum"],
    report.items.map((item) => [
      item.bankName,
      item.posName,
      formatDate(item.saleDate),
      item.differenceAmount.toFixed(2),
      statusFromDifference(item.status).label,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fark-raporu.csv"',
    },
  });
}
