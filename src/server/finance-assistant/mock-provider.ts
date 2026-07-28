import type { FinanceIntent } from "@/lib/finance-assistant";
import type { FinanceAssistantProvider } from "./provider";
import { formatCurrency } from "@/lib/format";

function pct(value: number): string {
  return `%${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

/**
 * Doküman §14/§19 örnek sorularına karşılık gelen sabit/mock anlatım
 * üreticisi — gerçek OCR/AI anlama yapmaz, yalnızca servis katmanının
 * hesapladığı olguları ("facts") cümleye döker. Üretimde bu sınıfın yerine
 * gerçek bir sağlayıcı (ör. Claude) geçirilebilir; çağıran kod
 * (`finance-assistant-service.ts`) değişmeden kalır.
 */
export class MockFinanceAssistantProvider implements FinanceAssistantProvider {
  async narrate(intent: FinanceIntent, facts: Record<string, unknown>): Promise<string> {
    switch (intent) {
      case "MONTHLY_DEDUCTION_REASON":
        return this.narrateMonthlyDeductionReason(facts);
      case "BANK_COST_COMPARISON":
        return this.narrateBankCostComparison(facts);
      case "TOMORROW_EXPECTED_PAYMENT":
        return this.narrateTomorrowExpectedPayment(facts);
      case "BEST_POS_FOR_INSTALLMENT":
        return this.narrateBestPosForInstallment(facts);
      case "CONTRACT_RISKIEST_CLAUSES":
        return this.narrateContractRiskiestClauses(facts);
      case "NEGOTIATION_ADVICE":
        return this.narrateNegotiationAdvice(facts);
      case "VALOR_COST_ESTIMATE":
        return this.narrateValorCostEstimate(facts);
      case "UNKNOWN":
        return "Bu soruyu şu anda yanıtlayamıyorum. Örnek sorular için aşağıdaki önerilere bakabilirsiniz.";
    }
  }

  private narrateMonthlyDeductionReason(f: Record<string, unknown>): string {
    const monthLabel = f.monthLabel as string;
    const deductionTotal = f.deductionTotal as number;
    const percentChange = f.percentChange as number | null;
    const topBankName = f.topBankName as string | null;

    let text = `${monthLabel} ayında toplam ${formatCurrency(deductionTotal)} kesinti oldu.`;
    if (percentChange !== null) {
      text += ` Bu, geçen aya göre ${percentChange >= 0 ? "+" : ""}${pct(percentChange)} bir değişim.`;
    }
    if (topBankName) {
      text += ` En yüksek ortalama orana sahip banka ${topBankName}.`;
    }
    return text;
  }

  private narrateBankCostComparison(f: Record<string, unknown>): string {
    const highest = f.highest as { bankName: string; avgRate: number } | null;
    const lowest = f.lowest as { bankName: string; avgRate: number } | null;
    if (!highest || !lowest || highest.bankName === lowest.bankName) {
      return "Karşılaştırma yapabilmek için birden fazla bankada bu ay satış verisi olması gerekiyor.";
    }
    return (
      `${highest.bankName}, ortalama %${highest.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} oranla ` +
      `bu ay en yüksek maliyetli banka. ${lowest.bankName} ise ortalama %${lowest.avgRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ile en düşük oranlı banka.`
    );
  }

  private narrateTomorrowExpectedPayment(f: Record<string, unknown>): string {
    const total = f.total as number;
    const count = f.count as number;
    const bankNames = f.bankNames as string[];
    if (count === 0) return "Yarın için beklenen bir ödeme bulunmuyor.";
    return `Yarın ${bankNames.join(", ")} bankasından toplam ${formatCurrency(total)} (${count} ödeme) hesabınıza geçmesi bekleniyor.`;
  }

  private narrateBestPosForInstallment(f: Record<string, unknown>): string {
    const count = f.installmentCount as number;
    const best = f.best as { posName: string; bankName: string; rate: number } | null;
    if (!best) return `${count} taksit için kayıtlı bir tarife bulunamadı.`;
    return (
      `${count} taksitli satışlar için en avantajlı oran ${best.posName} (${best.bankName}) POS'unda: ` +
      `%${best.rate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}.`
    );
  }

  private narrateContractRiskiestClauses(f: Record<string, unknown>): string {
    const contractTitle = f.contractTitle as string | null;
    const risks = f.risks as { text: string; severity: string }[];
    if (!contractTitle) return "Analiz edilmiş bir sözleşme bulunamadı.";
    if (risks.length === 0) return `${contractTitle} sözleşmesinde kritik olarak işaretlenmiş bir madde bulunmuyor.`;
    const list = risks.map((r, i) => `${i + 1}. ${r.text}`).join(" ");
    return `${contractTitle} sözleşmesindeki en riskli maddeler: ${list}`;
  }

  private narrateNegotiationAdvice(f: Record<string, unknown>): string {
    const scripts = f.scripts as string[];
    if (scripts.length === 0) return "Pazarlık önerisi oluşturmak için yeterli veri bulunmuyor.";
    return scripts.join(" ");
  }

  private narrateValorCostEstimate(f: Record<string, unknown>): string {
    const banks = f.banks as { bankName: string; avgValorDays: number }[];
    if (banks.length === 0) return "Valör süresini hesaplamak için yeterli veri bulunmuyor.";
    const list = banks.map((b) => `${b.bankName}: ortalama ${b.avgValorDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün`).join(", ");
    return (
      `Kesin bir TL maliyeti hesaplamak için bir faiz/fırsat maliyeti oranı varsayılması gerekir — bu belirtilmediği için ` +
      `yalnızca ortalama valör sürelerini raporlayabiliyorum: ${list}.`
    );
  }
}

export const financeAssistantProvider: FinanceAssistantProvider = new MockFinanceAssistantProvider();
