import type { ComparableTerms, ComparisonRow, ComparisonTone, ContractComparisonResult } from "./types";

function formatRate(value: number | null): string {
  return value === null ? "—" : `%${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDays(value: number | null): string {
  return value === null ? "—" : `${value} gün`;
}

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function formatBoolean(value: boolean | null, whenTrue: string, whenFalse: string): string {
  if (value === null) return "Belirtilmemiş";
  return value ? whenTrue : whenFalse;
}

/** Düşük değer avantajlı sayılan alanlar için (oranlar, ücretler, gün sayısı). */
function lowerIsBetterTone(current: number | null, next: number | null): ComparisonTone {
  if (current === null || next === null) return "neutral";
  if (next < current) return "advantageous";
  if (next > current) return "disadvantageous";
  return "neutral";
}

/** Yokluğu/false olması avantajlı sayılan alanlar için (taahhüt, ceza, otomatik yenileme, tek taraflı yetki). */
function presenceIsWorseTone(current: boolean | number | null, next: boolean | number | null): ComparisonTone {
  const currentActive = Boolean(current);
  const nextActive = Boolean(next);
  if (currentActive === nextActive) {
    // İkisi de mevcutsa büyüklük kıyaslanamıyorsa (bool alanlar) nötr kalır.
    if (typeof current === "number" && typeof next === "number") {
      return lowerIsBetterTone(current, next);
    }
    return "neutral";
  }
  return nextActive ? "disadvantageous" : "advantageous";
}

function allInstallmentCounts(current: ComparableTerms, next: ComparableTerms): number[] {
  const keys = new Set([
    ...Object.keys(current.installmentRates).map(Number),
    ...Object.keys(next.installmentRates).map(Number),
  ]);
  return [...keys].sort((a, b) => a - b);
}

/**
 * Mevcut (kayıtlı tarife) ve yeni (sözleşme analizi) koşullarını karşılaştırır.
 * Saf/deterministik — yapay zekâ kullanılmaz, "imzala/imzalama" kararı vermez
 * (bkz. Aşama 11 prompt paketi ve UX §16).
 */
export function compareTariffTerms(
  current: ComparableTerms,
  next: ComparableTerms,
  monthlyVolumeAssumption: number | null,
): ContractComparisonResult {
  const rows: ComparisonRow[] = [
    {
      label: "Tek çekim oranı",
      currentDisplay: formatRate(current.singlePaymentRate),
      newDisplay: formatRate(next.singlePaymentRate),
      tone: lowerIsBetterTone(current.singlePaymentRate, next.singlePaymentRate),
    },
    ...allInstallmentCounts(current, next).map((count) => ({
      label: `${count} taksit oranı`,
      currentDisplay: formatRate(current.installmentRates[count] ?? null),
      newDisplay: formatRate(next.installmentRates[count] ?? null),
      tone: lowerIsBetterTone(current.installmentRates[count] ?? null, next.installmentRates[count] ?? null),
    })),
    {
      label: "Valör",
      currentDisplay: formatDays(current.valorDays),
      newDisplay: formatDays(next.valorDays),
      tone: lowerIsBetterTone(current.valorDays, next.valorDays),
    },
    {
      label: "Aylık cihaz ücreti",
      currentDisplay: formatMoney(current.monthlyDeviceFee),
      newDisplay: formatMoney(next.monthlyDeviceFee),
      tone: lowerIsBetterTone(current.monthlyDeviceFee, next.monthlyDeviceFee),
    },
    {
      label: "Diğer sabit ücretler",
      currentDisplay: formatMoney(current.otherFixedFees),
      newDisplay: formatMoney(next.otherFixedFees),
      tone: lowerIsBetterTone(current.otherFixedFees, next.otherFixedFees),
    },
    {
      label: "Ciro taahhüdü",
      currentDisplay: current.volumeCommitmentMonthly ? formatMoney(current.volumeCommitmentMonthly) : "Yok",
      newDisplay: next.volumeCommitmentMonthly ? formatMoney(next.volumeCommitmentMonthly) : "Yok",
      tone: presenceIsWorseTone(current.volumeCommitmentMonthly, next.volumeCommitmentMonthly),
    },
    {
      label: "Erken fesih",
      currentDisplay: current.earlyTerminationFee ? formatMoney(current.earlyTerminationFee) : "Yok",
      newDisplay: next.earlyTerminationFee ? formatMoney(next.earlyTerminationFee) : "Yok",
      tone: presenceIsWorseTone(current.earlyTerminationFee, next.earlyTerminationFee),
    },
    {
      label: "Otomatik yenileme",
      currentDisplay: formatBoolean(current.autoRenewal, "Var", "Yok"),
      newDisplay: formatBoolean(next.autoRenewal, "Var", "Yok"),
      tone: presenceIsWorseTone(current.autoRenewal, next.autoRenewal),
    },
    {
      label: "Ticari kart",
      currentDisplay: formatRate(current.commercialCardExtraRate),
      newDisplay: formatRate(next.commercialCardExtraRate),
      tone: lowerIsBetterTone(current.commercialCardExtraRate, next.commercialCardExtraRate),
    },
    {
      label: "Yabancı kart",
      currentDisplay: formatRate(current.foreignCardExtraRate),
      newDisplay: formatRate(next.foreignCardExtraRate),
      tone: lowerIsBetterTone(current.foreignCardExtraRate, next.foreignCardExtraRate),
    },
    {
      label: "Tarife değişiklik yetkisi",
      currentDisplay: formatBoolean(current.tariffChangeAuthority, "Banka tek taraflı değiştirebilir", "Sabit"),
      newDisplay: formatBoolean(next.tariffChangeAuthority, "Banka tek taraflı değiştirebilir", "Sabit"),
      tone: presenceIsWorseTone(current.tariffChangeAuthority, next.tariffChangeAuthority),
    },
  ];

  let projectedMonthlyImpact: number | null = null;
  if (monthlyVolumeAssumption !== null && current.singlePaymentRate !== null && next.singlePaymentRate !== null) {
    const currentCost =
      (monthlyVolumeAssumption * current.singlePaymentRate) / 100 +
      (current.monthlyDeviceFee ?? 0) +
      (current.otherFixedFees ?? 0);
    const nextCost =
      (monthlyVolumeAssumption * next.singlePaymentRate) / 100 +
      (next.monthlyDeviceFee ?? 0) +
      (next.otherFixedFees ?? 0);
    projectedMonthlyImpact = nextCost - currentCost;
  }
  const projectedAnnualImpact = projectedMonthlyImpact !== null ? projectedMonthlyImpact * 12 : null;

  const reasons: string[] = [];
  const installmentRows = rows.filter((r) => r.label.endsWith("taksit oranı"));
  if (installmentRows.some((r) => r.tone === "disadvantageous")) reasons.push("taksitli satış");
  if (!current.volumeCommitmentMonthly && next.volumeCommitmentMonthly) reasons.push("ciro taahhüdü");
  if (!current.earlyTerminationFee && next.earlyTerminationFee) reasons.push("erken fesih bedeli");
  if (current.autoRenewal !== true && next.autoRenewal === true) reasons.push("otomatik yenileme");

  const singlePaymentTone = rows[0]!.tone;
  const toneLabel: Record<ComparisonTone, string> = {
    advantageous: "avantajlı",
    disadvantageous: "dezavantajlı",
    neutral: "benzer",
  };

  let summary = `Yeni teklif tek çekimde ${toneLabel[singlePaymentTone]}`;
  if (reasons.length > 0) {
    // Bu nedenler (taksit artışı, yeni taahhüt/ceza) tek çekim oranına dayalı
    // basit projeksiyonda yansımaz; var olmaları başlı başına maliyet riski
    // taşıdığından sonucu "daha yüksek olabilir" yönünde okuruz.
    summary += `, ancak ${reasons.join(" ve ")} nedeniyle toplam yıllık maliyet mevcut sözleşmeden daha yüksek olabilir.`;
  } else {
    summary +=
      projectedAnnualImpact === null
        ? "."
        : projectedAnnualImpact > 0
          ? ", ancak toplam yıllık maliyet mevcut sözleşmeden daha yüksek olabilir."
          : projectedAnnualImpact < 0
            ? " ve toplam yıllık maliyet mevcut sözleşmeden daha düşük olabilir."
            : ".";
  }

  return { rows, summary, projectedMonthlyImpact, projectedAnnualImpact };
}
