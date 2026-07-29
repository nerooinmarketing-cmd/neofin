import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertBanner } from "@/components/shared/alert-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PrintButton } from "@/components/shared/print-button";
import { SendTelegramButton } from "@/components/reports/send-telegram-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { reportRepository } from "@/server/repositories/report-repository";
import { buildAnnualExecutiveSummary, buildBankNegotiationScript } from "@/server/reports/summary-text";

export default async function YillikPazarlikRaporuPage() {
  const ctx = await requireTenantContext();
  const report = await reportRepository.getAnnualNegotiationReport(ctx);
  await reportRepository.logGenerated(ctx, "ANNUAL_NEGOTIATION", report.periodStart, report.periodEnd);
  const identity = await getShellIdentity(ctx);

  const banksWithVolume = report.bankComparison.filter((b) => b.grossTotal > 0);

  if (banksWithVolume.length === 0) {
    return (
      <AppShell userName={identity.userName} companyName={identity.companyName}>
        <PageHeader title="Yıllık Maliyet ve Pazarlık Raporu" />
        <EmptyState
          title="Son 12 ayda satış verisi yok"
          description="Gün sonu girişi yaptıkça bu rapor otomatik olarak oluşacak."
        />
      </AppShell>
    );
  }

  const executiveSummary = buildAnnualExecutiveSummary({
    grossTotal: report.grossTotal,
    actualDeductionTotal: report.actualDeductionTotal,
    expectedDeductionTotal: report.expectedDeductionTotal,
    difference: report.difference,
  });

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      {/* 17.1 Kapak */}
      <PageHeader
        title="Yıllık Maliyet ve Pazarlık Raporu"
        description={`${report.company.name} · ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SendTelegramButton reportTitle="Yıllık Maliyet ve Pazarlık Raporu" reportPath="/panel/raporlar/yillik-pazarlik" />
            <PrintButton label="PDF Olarak Yazdır" />
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Bankalar</p>
            <p className="font-medium text-foreground">{report.company.banks.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Toplam POS cirosu</p>
            <p className="tabular-money font-medium text-foreground">{formatCurrency(report.grossTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Toplam kesinti</p>
            <p className="tabular-money font-medium text-foreground">
              {report.actualDeductionTotal !== null ? formatCurrency(report.actualDeductionTotal) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Beklenen kesinti</p>
            <p className="tabular-money font-medium text-foreground">{formatCurrency(report.expectedDeductionTotal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 17.2 Yönetici özeti */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Yönetici Özeti</h2>
        <AlertBanner tone="info" title={executiveSummary} />
      </div>

      {/* 17.3 Banka bazlı karşılaştırma */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Banka Bazlı Karşılaştırma</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {banksWithVolume.map((bank) => (
            <Card key={bank.bankId}>
              <CardContent className="space-y-2">
                <p className="font-medium text-foreground">{bank.bankName}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Ciro</dt>
                    <dd className="tabular-money text-foreground">{formatCurrency(bank.grossTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ortalama oran</dt>
                    <dd className="text-foreground">%{bank.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Beklenen kesinti</dt>
                    <dd className="tabular-money text-foreground">{formatCurrency(bank.expectedDeductionTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Fark</dt>
                    <dd className="tabular-money text-foreground">
                      {bank.difference !== null ? formatCurrency(bank.difference) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ortalama valör</dt>
                    <dd className="text-foreground">{bank.avgValorDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sabit ücret</dt>
                    <dd className="tabular-money text-foreground">{formatCurrency(bank.fixedFeeTotal)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 17.4 POS bazlı analiz */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">POS Bazlı Analiz</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.posComparison.highestCost ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En yüksek maliyetli POS</p>
              <p className="font-medium text-foreground">{report.posComparison.highestCost.posName}</p>
              <p className="tabular-money text-sm text-muted-foreground">
                {formatCurrency(report.posComparison.highestCost.expectedDeductionTotal)}
              </p>
            </div>
          ) : null}
          {report.posComparison.lowestCost ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En düşük maliyetli POS</p>
              <p className="font-medium text-foreground">{report.posComparison.lowestCost.posName}</p>
              <p className="tabular-money text-sm text-muted-foreground">
                {formatCurrency(report.posComparison.lowestCost.expectedDeductionTotal)}
              </p>
            </div>
          ) : null}
          {report.posComparison.mostDifference ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En fazla fark görülen POS</p>
              <p className="font-medium text-foreground">{report.posComparison.mostDifference.posName}</p>
              <p className="tabular-money text-sm text-muted-foreground">
                {formatCurrency(report.posComparison.mostDifference.totalDifferenceAbs)}
              </p>
            </div>
          ) : null}
          {report.posComparison.highestInstallmentCost ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En yüksek taksit maliyeti</p>
              <p className="font-medium text-foreground">{report.posComparison.highestInstallmentCost.posName}</p>
              <p className="text-sm text-muted-foreground">
                %{report.posComparison.highestInstallmentCost.maxInstallmentRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 17.5 Gelecek yıl tahmini */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Gelecek Yıl Tahmini</h2>
        <AlertBanner
          tone="neutral"
          title={`Mevcut koşullar ve benzer ciro ile gelecek 12 ay tahmini POS maliyeti: ${formatCurrency(report.forecastNextYear)}.`}
        />
      </div>

      {/* 17.6 Pazarlık özeti */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Pazarlık Özeti</h2>
        <Card>
          <CardContent className="space-y-4">
            {report.negotiation.rateRange ? (
              <div>
                <p className="text-sm font-medium text-foreground">Talep edilebilecek oran aralığı</p>
                <p className="text-sm text-muted-foreground">
                  {report.negotiation.rateRange.highestRateBank.bankName} bankasındaki oran (%
                  {report.negotiation.rateRange.highestRateBank.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })})
                  {" "}
                  {report.negotiation.rateRange.lowestRateBank.bankName} bankasındaki orana (%
                  {report.negotiation.rateRange.lowestRateBank.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}) yaklaştırılması talep edilebilir.
                </p>
              </div>
            ) : null}

            {report.negotiation.feesToNegotiate.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-foreground">Kaldırılması istenebilecek sabit ücretler</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.negotiation.feesToNegotiate.map((b) => (
                    <li key={b.bankId}>
                      {b.bankName}: {formatCurrency(b.fixedFeeTotal)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {report.negotiation.valorImprovementCandidates.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-foreground">Valör iyileştirme fırsatı</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.negotiation.valorImprovementCandidates.map((b) => (
                    <li key={b.bankId}>
                      {b.bankName}: ortalama {b.avgValorDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {report.negotiation.volumeCommitmentRisks.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-foreground">Ciro taahhüdü riski</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.negotiation.volumeCommitmentRisks.map((c, i) => (
                    <li key={i}>
                      {c.bankName} · {c.posName}: aylık {formatCurrency(c.monthlyVolumeCommitment)} taahhüt
                      {c.breachPenalty ? ` (ihlalde ${formatCurrency(c.breachPenalty)} ceza)` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Bankaya sunulacak kısa görüşme metni</p>
              {banksWithVolume.map((bank) => (
                <p key={bank.bankId} className="text-sm text-muted-foreground">
                  {buildBankNegotiationScript({
                    bankName: bank.bankName,
                    avgRate: bank.avgRate,
                    fixedFeeTotal: bank.fixedFeeTotal,
                    avgValorDays: bank.avgValorDays,
                  })}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 17.7 Veri kaynakları ve tarife sürümleri */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Veri Kaynakları ve Tarife Sürümleri</h2>
        <Card>
          <CardContent className="space-y-2">
            {report.tariffVersions.map((t, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                {t.bankName} · {t.posName} — v{t.versionNumber}
                {t.campaignName ? ` (${t.campaignName})` : ""} · {formatDate(t.startDate)}
                {t.endDate ? ` – ${formatDate(t.endDate)}` : " – güncel"} · {t.status === "ACTIVE" ? "Aktif" : "Kapandı"}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <AlertBanner
        tone="neutral"
        title="Bu rapor karar desteği amacıyla hazırlanır"
        description="Kayıtlı koşullarla beklenen tutar arasındaki farklar tarafsız dille sunulur; kaynak belge ve tarife sürümü her zaman belirtilir."
      />
    </AppShell>
  );
}
