import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";

export default async function BankaKarsilastirmaPage() {
  const ctx = await requireTenantContext();
  const range = currentMonthRange();
  const rows = await reportRepository.getBankComparison(ctx, range);
  const withVolume = rows.filter((r) => r.grossTotal > 0);
  await reportRepository.logGenerated(ctx, "BANK_COMPARISON", range.start, range.end);
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Banka Karşılaştırma"
        description="Bu ay — ciro, ortalama oran, kesinti, fark, valör ve sabit ücret."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/api/reports/banka-karsilastirma/csv">
                <Download className="size-4" /> CSV İndir
              </Link>
            </Button>
            <PrintButton />
          </div>
        }
      />

      {withVolume.length === 0 ? (
        <EmptyState title="Bu ayda satış girişi yok" description="Farklı bir dönemde tekrar deneyin." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {withVolume.map((bank) => (
            <Card key={bank.bankId}>
              <CardContent className="space-y-3">
                <p className="font-heading font-semibold text-foreground">{bank.bankName}</p>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Ciro</dt>
                    <dd className="tabular-money font-medium text-foreground">{formatCurrency(bank.grossTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ortalama oran</dt>
                    <dd className="font-medium text-foreground">
                      %{bank.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Beklenen kesinti</dt>
                    <dd className="tabular-money font-medium text-foreground">
                      {formatCurrency(bank.expectedDeductionTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Gerçekleşen kesinti</dt>
                    <dd className="tabular-money font-medium text-foreground">
                      {bank.actualDeductionTotal !== null ? formatCurrency(bank.actualDeductionTotal) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Fark</dt>
                    <dd className="tabular-money font-medium text-foreground">
                      {bank.difference !== null ? formatCurrency(bank.difference) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ortalama valör</dt>
                    <dd className="font-medium text-foreground">
                      {bank.avgValorDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sabit ücret</dt>
                    <dd className="tabular-money font-medium text-foreground">{formatCurrency(bank.fixedFeeTotal)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
