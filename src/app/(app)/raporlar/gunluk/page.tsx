import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { reportRepository } from "@/server/repositories/report-repository";

function parseDateParam(value: string | undefined): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function toDateParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function GunlukOzetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireTenantContext();
  const date = parseDateParam(params.date);

  const prevDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const report = await reportRepository.getDailySummary(ctx, date);
  await reportRepository.logGenerated(ctx, "DAILY_SUMMARY", date, date);

  return (
    <AppShell>
      <PageHeader
        title="Günlük Özet"
        description={formatDate(date)}
        action={<PrintButton label="PDF Olarak Yazdır" />}
      />

      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/raporlar/gunluk?date=${toDateParam(prevDay)}`}>
            <ChevronLeft className="size-4" /> Önceki gün
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/raporlar/gunluk?date=${toDateParam(nextDay)}`}>
            Sonraki gün <ChevronRight className="size-4" />
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
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Beklenen net</p>
          <p className="tabular-money text-xl font-semibold text-foreground">{formatCurrency(report.expectedNetTotal)}</p>
        </div>
      </div>

      {report.transactionCount === 0 ? (
        <EmptyState title="Bu tarihte satış girişi yok" description="Farklı bir gün seçin veya gün sonu girişi yapın." />
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Banka Bazlı Dağılım</h2>
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
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">POS Bazlı Dağılım</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {report.byPos.map((p) => (
                <div key={p.posName} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">
                    {p.posName} <span className="text-xs text-muted-foreground">· {p.bankName}</span>
                  </p>
                  <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Ciro</dt>
                      <dd className="tabular-money font-medium text-foreground">{formatCurrency(p.grossTotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Kesinti</dt>
                      <dd className="tabular-money font-medium text-foreground">
                        {formatCurrency(p.expectedDeductionTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">İşlem</dt>
                      <dd className="font-medium text-foreground">{p.transactionCount}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
