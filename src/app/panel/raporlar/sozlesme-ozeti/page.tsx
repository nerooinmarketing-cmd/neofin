import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { formatDate } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { reportRepository } from "@/server/repositories/report-repository";
import { contractStatusLabel } from "@/server/contract-analysis/status-labels";

export default async function SozlesmeOzetiPage() {
  const ctx = await requireTenantContext();
  const contracts = await reportRepository.getContractAnalysisSummary(ctx);
  const now = new Date();
  await reportRepository.logGenerated(ctx, "CONTRACT_ANALYSIS_SUMMARY", now, now);
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Sözleşme Analiz Özeti"
        description="Analiz edilmiş tüm sözleşmelerin güven skoru ve kritik madde özeti."
        action={<PrintButton label="PDF Olarak Yazdır" />}
      />

      {contracts.length === 0 ? (
        <EmptyState
          title="Henüz analiz edilmiş sözleşme yok"
          description="Sözleşme Analizi bölümünden bir sözleşme yükleyip analiz ettirin."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contracts.map((c) => {
            const status = contractStatusLabel(c.status);
            return (
              <Card key={c.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-semibold text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[c.bankName, c.posName].filter(Boolean).join(" · ") || "Banka/POS eşleşmesi yok"}
                      </p>
                    </div>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary60s}</p>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Güven skoru</dt>
                      <dd className="font-medium text-foreground">%{Math.round(c.confidenceScore * 100)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Kritik madde</dt>
                      <dd className="font-medium text-foreground">{c.criticalRiskCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Toplam bulgu</dt>
                      <dd className="font-medium text-foreground">{c.totalRiskCount}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">Analiz tarihi: {formatDate(c.analyzedAt)}</p>
                  <Link href={`/panel/sozlesmeler/${c.id}`} className="text-xs font-medium text-primary hover:underline print:hidden">
                    Sözleşmeyi Görüntüle →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
