import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { reportRepository } from "@/server/repositories/report-repository";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { statusFromDifference } from "@/server/payments/status-labels";

export default async function FarkRaporuPage() {
  const ctx = await requireTenantContext();
  const range = currentMonthRange();
  const report = await reportRepository.getDifferenceReport(ctx, range);
  await reportRepository.logGenerated(ctx, "DIFFERENCE_REPORT", range.start, range.end);
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Fark Raporu"
        description="Bu ay tespit edilen tüm beklenen/gerçekleşen ödeme farkları."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/api/reports/fark-raporu/csv">
                <Download className="size-4" /> CSV İndir
              </Link>
            </Button>
            <PrintButton />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Toplam fark kaydı</p>
          <p className="text-xl font-semibold text-foreground">{report.totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Toplam fark tutarı</p>
          <p className="tabular-money text-xl font-semibold text-foreground">{formatCurrency(report.totalAbs)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Durum dağılımı</p>
          {report.byStatus.map((s) => (
            <p key={s.status} className="text-sm text-foreground">
              {statusFromDifference(s.status).label}: {s.count} · {formatCurrency(s.totalAbs)}
            </p>
          ))}
        </div>
      </div>

      {report.items.length === 0 ? (
        <EmptyState title="Bu ayda fark kaydı yok" description="Gerçekleşen ödeme kaydettikçe farklar burada listelenecek." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {report.items.map((item) => {
            const status = statusFromDifference(item.status);
            return (
              <Card key={item.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {item.bankName} <span className="text-xs text-muted-foreground">· {item.posName}</span>
                    </p>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                  <p className="tabular-money text-sm text-foreground">{formatCurrency(item.differenceAmount)}</p>
                  <p className="text-xs text-muted-foreground">Satış {formatDate(item.saleDate)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
