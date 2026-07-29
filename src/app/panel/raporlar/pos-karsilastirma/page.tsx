import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";

export default async function PosKarsilastirmaPage() {
  const ctx = await requireTenantContext();
  const range = currentMonthRange();
  const report = await reportRepository.getPosComparison(ctx, range);
  await reportRepository.logGenerated(ctx, "POS_COMPARISON", range.start, range.end);
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="POS Karşılaştırma"
        description="Bu ay — en yüksek/düşük maliyetli POS ve en fazla fark görülen POS."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/api/reports/pos-karsilastirma/csv">
                <Download className="size-4" /> CSV İndir
              </Link>
            </Button>
            <PrintButton />
          </div>
        }
      />

      {report.rows.every((r) => r.grossTotal === 0) ? (
        <EmptyState title="Bu ayda satış girişi yok" description="Farklı bir dönemde tekrar deneyin." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.highestCost ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <StatusBadge label="En yüksek maliyetli" tone="warning" />
                <p className="mt-2 font-medium text-foreground">{report.highestCost.posName}</p>
                <p className="tabular-money text-sm text-muted-foreground">
                  {formatCurrency(report.highestCost.expectedDeductionTotal)}
                </p>
              </div>
            ) : null}
            {report.lowestCost ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <StatusBadge label="En düşük maliyetli" tone="success" />
                <p className="mt-2 font-medium text-foreground">{report.lowestCost.posName}</p>
                <p className="tabular-money text-sm text-muted-foreground">
                  {formatCurrency(report.lowestCost.expectedDeductionTotal)}
                </p>
              </div>
            ) : null}
            {report.mostDifference ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <StatusBadge label="En fazla fark" tone="danger" />
                <p className="mt-2 font-medium text-foreground">{report.mostDifference.posName}</p>
                <p className="tabular-money text-sm text-muted-foreground">
                  {formatCurrency(report.mostDifference.totalDifferenceAbs)}
                </p>
              </div>
            ) : null}
            {report.highestInstallmentCost ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <StatusBadge label="En yüksek taksit oranı" tone="info" />
                <p className="mt-2 font-medium text-foreground">{report.highestInstallmentCost.posName}</p>
                <p className="text-sm text-muted-foreground">
                  %{report.highestInstallmentCost.maxInstallmentRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.rows
              .filter((r) => r.grossTotal > 0)
              .map((pos) => (
                <Card key={pos.posId}>
                  <CardContent className="space-y-2">
                    <p className="font-medium text-foreground">
                      {pos.posName} <span className="text-xs text-muted-foreground">· {pos.bankName}</span>
                    </p>
                    <dl className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Ciro</dt>
                        <dd className="tabular-money font-medium text-foreground">{formatCurrency(pos.grossTotal)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Kesinti</dt>
                        <dd className="tabular-money font-medium text-foreground">
                          {formatCurrency(pos.expectedDeductionTotal)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Fark</dt>
                        <dd className="tabular-money font-medium text-foreground">
                          {formatCurrency(pos.totalDifferenceAbs)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
