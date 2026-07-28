import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertBanner } from "@/components/shared/alert-banner";
import { ContractComparisonTable } from "@/components/contracts/contract-comparison-table";
import { PrintButton } from "@/components/shared/print-button";
import { formatCurrency } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { contractComparisonRepository } from "@/server/repositories/contract-comparison-repository";
import type { ContractComparisonUnavailableReason } from "@/server/repositories/contract-comparison-repository";

const UNAVAILABLE_MESSAGES: Record<ContractComparisonUnavailableReason, { title: string; description: string }> = {
  ANALYSIS_PENDING: {
    title: "Sözleşme analizi henüz tamamlanmadı",
    description: "Karşılaştırma için önce sözleşme analizinin tamamlanması gerekir.",
  },
  NO_POS_LINKED: {
    title: "Bu sözleşme bir POS ile ilişkilendirilmemiş",
    description: "Karşılaştırma yapabilmek için sözleşmeyi yüklerken bir banka/POS seçilmesi gerekir.",
  },
  NO_ACTIVE_TARIFF: {
    title: "Karşılaştırılacak aktif tarife bulunamadı",
    description: "Bu POS için kayıtlı bir aktif tarife yok — önce resmî tarifeyi kaydedin.",
  },
};

export default async function SozlesmeKarsilastirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  const result = await contractComparisonRepository.getComparison(ctx, id);

  if (!result.available) {
    const message = UNAVAILABLE_MESSAGES[result.reason];
    return (
      <AppShell>
        <PageHeader title="Sözleşme Karşılaştırma" />
        <EmptyState
          title={message.title}
          description={message.description}
          action={
            <Button asChild>
              <Link href={`/sozlesmeler/${id}`}>Sözleşmeye Dön</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const { comparison } = result;

  return (
    <AppShell>
      <PageHeader
        title="Sözleşme Karşılaştırma"
        description={`${result.bankName ?? "Banka belirtilmemiş"} · ${result.posName ?? "POS belirtilmemiş"}`}
        action={<PrintButton label="PDF Yönetici Özeti (Yazdır)" />}
      />

      <AlertBanner tone="info" title={comparison.summary} />

      {comparison.projectedMonthlyImpact !== null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Tahmini aylık etki</p>
            <p className="tabular-money text-xl font-semibold text-foreground">
              {formatCurrency(comparison.projectedMonthlyImpact)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Tahmini yıllık etki</p>
            <p className="tabular-money text-xl font-semibold text-foreground">
              {formatCurrency(comparison.projectedAnnualImpact ?? 0)}
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Ciro senaryosu: aylık {formatCurrency(result.monthlyVolumeAssumption ?? 0)} POS satışı varsayılmıştır
        (gerçek satış verisi yoksa sözleşmedeki ciro taahhüdü esas alınır).
      </p>

      <ContractComparisonTable
        rows={comparison.rows}
        currentLabel={`Mevcut (${result.currentTariffLabel})`}
        newLabel={`Yeni (${result.contractTitle})`}
      />

      <AlertBanner
        tone="neutral"
        title="Bu karşılaştırma karar desteği amacıyla hazırlanır"
        description="Sistem sizin adınıza 'imzalayın' veya 'imzalamayın' kararı vermez. Hukukî veya finansal danışmanlık yerine geçmez."
      />
    </AppShell>
  );
}
