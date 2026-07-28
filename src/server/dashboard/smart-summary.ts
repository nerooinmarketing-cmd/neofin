import { formatCurrency } from "@/lib/format";

export interface SmartSummaryInput {
  monthlyGross: number;
  monthlyExpectedDeduction: number;
  monthlyActualDeduction: number | null;
  differenceCount: number;
  differenceTotalAbs: number;
}

/**
 * Doküman §7.5'teki sabit cümle kalıbını üretir — deterministik, yapay zekâ
 * kullanılmaz. Girdi bulunmayan bölümler (henüz satış/gerçekleşen ödeme yok)
 * ilgili cümleyi tamamen atlar, hiçbir zaman sıfır/uydurma değer yazmaz.
 */
export function buildSmartSummary(input: SmartSummaryInput): string {
  if (input.monthlyGross <= 0) {
    return "Bu ay henüz gün sonu satışı girilmedi.";
  }

  const sentences: string[] = [
    `Bu ay toplam ${formatCurrency(input.monthlyGross)} POS satışı yaptınız.`,
    `Kayıtlı tarifelere göre ${formatCurrency(input.monthlyExpectedDeduction)} kesinti bekleniyordu.`,
  ];

  if (input.monthlyActualDeduction !== null) {
    sentences.push(`Gerçekleşen toplam kesinti ${formatCurrency(input.monthlyActualDeduction)} oldu.`);
  }

  if (input.differenceCount > 0) {
    sentences.push(`${formatCurrency(input.differenceTotalAbs)} fark kontrol edilmeli.`);
  } else if (input.monthlyActualDeduction !== null) {
    sentences.push("Kontrol edilmesi gereken fark bulunmuyor.");
  }

  return sentences.join(" ");
}
