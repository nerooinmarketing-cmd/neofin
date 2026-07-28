import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";

function parseMonthParam(value: string | undefined): Date {
  if (!value) return new Date();
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return new Date();
  return new Date(year, month - 1, 1);
}

function toMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AylikMaliyetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireTenantContext();
  const anchor = parseMonthParam(params.month);

  const prevMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);

  const report = await reportRepository.getMonthlyCost(ctx, anchor);
  const { start: monthStart, end: monthEnd } = currentMonthRange(anchor);
  await reportRepository.logGenerated(ctx, "MONTHLY_COST", monthStart, monthEnd);

  return (
    <AppShell>
      <PageHeader
        title="Aylık Maliyet"
        description={report.monthLabel}
        action={<PrintButton label="PDF Olarak Yazdır" />}
      />

      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/raporlar/aylik?month=${toMonthParam(prevMonth)}`}>
            <ChevronLeft className="size-4" /> Önceki ay
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/raporlar/aylik?month=${toMonthParam(nextMonth)}`}>
            Sonraki ay <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Brüt ciro</p>
          <p className="tabular-money text-xl font-semibold text-foreground">{formatCurrency(report.grossTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Beklenen kesinti</p>
          <p className="tabular-money text-xl font-semibold text-foreground">
            {formatCurrency(report.expectedDeductionTotal)}
          </p>
          {report.percentChangeVsPreviousMonth !== null ? (
            <StatusBadge
              className="mt-2"
              label={`Geçen aya göre ${report.percentChangeVsPreviousMonth >= 0 ? "+" : ""}%${report.percentChangeVsPreviousMonth.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`}
              tone={report.percentChangeVsPreviousMonth > 0 ? "warning" : "success"}
            />
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Beklenen net</p>
          <p className="tabular-money text-xl font-semibold text-foreground">{formatCurrency(report.expectedNetTotal)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Banka Bazlı Dağılım</h2>
        {report.byBank.length === 0 ? (
          <EmptyState title="Bu ayda satış girişi yok" description="Farklı bir ay seçin." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.byBank.map((b) => (
              <div key={b.bankName} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{b.bankName}</p>
                <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Ciro</dt>
                    <dd className="tabular-money font-medium text-foreground">{formatCurrency(b.grossTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Beklenen kesinti</dt>
                    <dd className="tabular-money font-medium text-foreground">
                      {formatCurrency(b.expectedDeductionTotal)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
