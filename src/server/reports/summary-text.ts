import { formatCurrency } from "@/lib/format";

export interface AnnualSummaryInput {
  grossTotal: number;
  actualDeductionTotal: number | null;
  expectedDeductionTotal: number;
  difference: number | null;
}

/**
 * Doküman §17.2'deki örnek yönetici özeti kalıbını üretir — deterministik,
 * yapay zekâ kullanılmaz. Tarafsız dil kuralına uyar: "hatalı kesinti"
 * yerine "kontrol edilmelidir" der.
 */
export function buildAnnualExecutiveSummary(input: AnnualSummaryInput): string {
  const sentences = [
    `Son 12 ayda ${formatCurrency(input.grossTotal)} POS cirosu oluştu.`,
    `Kayıtlı tarifelere göre beklenen kesinti ${formatCurrency(input.expectedDeductionTotal)} idi.`,
  ];

  if (input.actualDeductionTotal !== null) {
    sentences.splice(
      1,
      0,
      `Toplam ${formatCurrency(input.actualDeductionTotal)} kesinti gerçekleşti.`,
    );
  }

  if (input.difference !== null && Math.abs(input.difference) > 0) {
    sentences.push(`${formatCurrency(Math.abs(input.difference))} tutarındaki fark kontrol edilmelidir.`);
  }

  return sentences.join(" ");
}

export interface BankNegotiationInput {
  bankName: string;
  avgRate: number;
  fixedFeeTotal: number;
  avgValorDays: number;
}

/**
 * Bankaya sunulacak kısa, tarafsız görüşme metni (bkz. §17.6). Sistem bir
 * karar/talimat vermez, yalnızca mevcut durumu özetler.
 */
export function buildBankNegotiationScript(input: BankNegotiationInput): string {
  const parts = [
    `${input.bankName} için kayıtlı ortalama komisyon oranı %${input.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}.`,
  ];
  if (input.fixedFeeTotal > 0) {
    parts.push(`Ayrıca ${formatCurrency(input.fixedFeeTotal)} tutarında sabit ücret uygulanıyor.`);
  }
  if (input.avgValorDays > 1) {
    parts.push(`Ortalama valör süresi ${input.avgValorDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün.`);
  }
  parts.push("Güncel piyasa koşullarına göre oran ve ücretlerin gözden geçirilmesi talep edilebilir.");
  return parts.join(" ");
}
