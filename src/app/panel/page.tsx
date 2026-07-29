import Link from "next/link";
import { FileSearch2, TrendingDown, Wallet, Landmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { PaymentCard } from "@/components/shared/payment-card";
import { AlertBanner } from "@/components/shared/alert-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { BankCostSummary } from "@/components/dashboard/bank-cost-summary";
import { formatCurrency } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { dashboardRepository } from "@/server/repositories/dashboard-repository";
import { buildSmartSummary } from "@/server/dashboard/smart-summary";

export default async function HomePage() {
  const ctx = await requireTenantContext();

  const [
    todayExpected,
    todayActual,
    monthlyDeduction,
    differenceSummary,
    pendingPayments,
    recentAlerts,
    monthlyChartData,
    bankCostSummary,
    monthlySummaryFigures,
    identity,
  ] = await Promise.all([
    dashboardRepository.getTodayExpected(ctx),
    dashboardRepository.getTodayActual(ctx),
    dashboardRepository.getMonthlyDeduction(ctx),
    dashboardRepository.getDifferencesNeedingReview(ctx),
    dashboardRepository.getPendingPayments(ctx),
    dashboardRepository.getRecentAlerts(ctx),
    dashboardRepository.getMonthlyChartData(ctx),
    dashboardRepository.getBankCostSummary(ctx),
    dashboardRepository.getMonthlySummaryFigures(ctx),
    getShellIdentity(ctx),
  ]);

  const smartSummary = buildSmartSummary({
    monthlyGross: monthlySummaryFigures.monthlyGross,
    monthlyExpectedDeduction: monthlySummaryFigures.monthlyExpectedDeduction,
    monthlyActualDeduction: monthlySummaryFigures.monthlyActualDeduction,
    differenceCount: differenceSummary.count,
    differenceTotalAbs: differenceSummary.totalAbs,
  });

  const todayActualDiff = todayActual.expectedTotal - todayActual.total;

  return (
    <AppShell
      userName={identity.userName}
      companyName={identity.companyName}
      greeting={
        todayExpected.count > 0
          ? `Bugün takip etmeniz gereken ${todayExpected.count} ödeme bulunuyor.`
          : "Bugün için beklenen ödeme bulunmuyor."
      }
    >
      <PageHeader title="Genel Bakış" description="Bugünün özeti ve bekleyen işlemler." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bugün Beklenen"
          value={formatCurrency(todayExpected.total)}
          icon={<Wallet className="size-4" />}
          helperText={
            todayExpected.count > 0
              ? `${todayExpected.count} ödeme · ${todayExpected.bankNames.join(", ")}`
              : "Bugün için beklenen ödeme yok"
          }
          href="/panel/odemeler/beklenen"
        />
        <StatCard
          label="Bugün Hesaba Geçen"
          value={formatCurrency(todayActual.total)}
          icon={<Landmark className="size-4" />}
          helperText={
            todayActual.lastUpdatedAt
              ? `Son güncelleme ${todayActual.lastUpdatedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
              : "Henüz güncelleme yok"
          }
          trend={
            todayActual.lastUpdatedAt && todayActualDiff !== 0
              ? {
                  label:
                    todayActualDiff > 0
                      ? `Beklenenden ${formatCurrency(todayActualDiff)} az`
                      : `Beklenenden ${formatCurrency(Math.abs(todayActualDiff))} fazla`,
                  tone: todayActualDiff > 0 ? "warning" : "success",
                }
              : undefined
          }
          href="/panel/odemeler/gerceklesen"
        />
        <StatCard
          label="Bu Ay Toplam Kesinti"
          value={formatCurrency(monthlyDeduction.current)}
          icon={<TrendingDown className="size-4" />}
          helperText={monthlyDeduction.percentChange === null ? "Geçen aya ait veri yok" : undefined}
          trend={
            monthlyDeduction.percentChange !== null
              ? {
                  label: `Geçen aya göre ${monthlyDeduction.percentChange >= 0 ? "+" : ""}%${monthlyDeduction.percentChange.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`,
                  tone: monthlyDeduction.percentChange > 0 ? "warning" : "success",
                }
              : undefined
          }
          href="/panel/raporlar"
        />
        <StatCard
          label="Kontrol Edilmesi Gereken Fark"
          value={formatCurrency(differenceSummary.totalAbs)}
          icon={<FileSearch2 className="size-4" />}
          helperText={differenceSummary.count === 0 ? "Kontrol edilmesi gereken fark yok" : undefined}
          trend={
            differenceSummary.count > 0
              ? { label: `${differenceSummary.count} işlem`, tone: "danger" }
              : undefined
          }
          href="/panel/fark-analizi"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" asChild>
          <Link href="/panel/gun-sonu">Gün Sonu Gir</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/panel/odemeler/beklenen">Hesaba Geçeni Gir</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/panel/bankalar">Yeni POS Ekle</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/panel/sozlesmeler">Sözleşme Analiz Et</Link>
        </Button>
      </div>

      {differenceSummary.count > 0 ? (
        <AlertBanner
          tone="warning"
          title={`Bu ay ${formatCurrency(differenceSummary.totalAbs)} tutarında kontrol edilmesi gereken fark var`}
          description={
            differenceSummary.topBank
              ? `En yüksek fark ${differenceSummary.topBank} bankasında görülüyor. Kayıtlı koşullarla beklenen tutar arasındaki farkları inceleyin.`
              : "Kayıtlı koşullarla beklenen tutar arasındaki farkları inceleyin."
          }
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/panel/fark-analizi">İncele</Link>
            </Button>
          }
        />
      ) : null}

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Akıllı Özet</h2>
        <AlertBanner tone="info" title={smartSummary} />
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Bekleyen Ödemeler</h2>
        {pendingPayments.length === 0 ? (
          <EmptyState
            title="Bekleyen ödeme yok"
            description="Şu anda hesaba geçmesi beklenen bir ödeme bulunmuyor."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pendingPayments.map(({ payment, displayStatus }) => (
              <PaymentCard
                key={payment.id}
                bankName={payment.bank.name}
                posName={payment.pos.name}
                saleDate={payment.saleDate}
                paymentDate={payment.expectedPaymentDate}
                grossAmount={Number(payment.grossAmount)}
                expectedDeduction={Number(payment.expectedDeduction)}
                expectedNet={Number(payment.expectedNet)}
                status={displayStatus}
                markReceivedHref={`/panel/odemeler/beklenen/${payment.id}/kaydet`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Son Uyarılar</h2>
        {recentAlerts.length === 0 ? (
          <EmptyState title="Uyarı yok" description="Şu anda dikkat gerektiren bir durum bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <AlertBanner key={alert.id} tone={alert.tone} title={alert.title} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Aylık Ciro / Kesinti Grafiği</h2>
        <MonthlyChart data={monthlyChartData} />
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Banka Bazlı Maliyet Özeti</h2>
        <BankCostSummary banks={bankCostSummary} />
      </div>
    </AppShell>
  );
}
