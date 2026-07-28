/**
 * Karşılaştırılabilir tarife/sözleşme alanları (bkz. Aşama 11 prompt paketi
 * ve UX dokümanı §16). Hem gerçek `TariffVersion` verisi ("Mevcut") hem de
 * sözleşme analizinden gelen mock/AI çıktısı ("Yeni") bu şekle eşlenir —
 * karşılaştırma motoru ikisinin de bu ortak şekilde olmasına güvenir.
 */
export interface ComparableTerms {
  singlePaymentRate: number | null;
  /** installmentCount (2-12) -> komisyon oranı (%) */
  installmentRates: Partial<Record<number, number>>;
  valorDays: number | null;
  monthlyDeviceFee: number | null;
  otherFixedFees: number | null;
  /** Aylık ciro taahhüdü (TL) — yoksa null. */
  volumeCommitmentMonthly: number | null;
  /** Erken fesih bedeli (TL) — yoksa null. */
  earlyTerminationFee: number | null;
  /** Otomatik yenileme var mı — bilinmiyorsa null. */
  autoRenewal: boolean | null;
  /** Ticari kart ek komisyon oranı (%) — yoksa/bilinmiyorsa null. */
  commercialCardExtraRate: number | null;
  /** Yabancı kart ek komisyon oranı (%) — yoksa/bilinmiyorsa null. */
  foreignCardExtraRate: number | null;
  /** Banka tek taraflı tarife değiştirebilir mi — bilinmiyorsa null. */
  tariffChangeAuthority: boolean | null;
}

export type ComparisonTone = "advantageous" | "disadvantageous" | "neutral";

export interface ComparisonRow {
  label: string;
  currentDisplay: string;
  newDisplay: string;
  tone: ComparisonTone;
}

export interface ContractComparisonResult {
  rows: ComparisonRow[];
  /** Doküman §16 örneğindeki gibi kısa, tarafsız bir sonuç cümlesi — karar vermez. */
  summary: string;
  projectedMonthlyImpact: number | null;
  projectedAnnualImpact: number | null;
}
