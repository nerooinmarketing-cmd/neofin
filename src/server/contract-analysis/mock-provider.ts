import type {
  ContractAnalysisDocument,
  ContractAnalysisProvider,
  ContractAnalysisResult,
  FinancialImpact,
} from "./provider";

/**
 * Gerçek bir AI sağlayıcısı bağlanana kadar kullanılan sabit/mock sağlayıcı
 * (bkz. Aşama 10: "Mock provider oluştur. Gerçek API anahtarını koda
 * yazma."). Doküman §15.3'teki örnek sözleşmeyi temsil eden sabit bir analiz
 * döner — gerçek OCR/metin anlama yapmaz. Üretimde bu dosyanın yerine gerçek
 * bir `ContractAnalysisProvider` implementasyonu (ör. Claude/OpenAI tabanlı)
 * geçirilmelidir; çağıran kod (`contract-repository.ts`) değişmeden kalır.
 */
export class MockContractAnalysisProvider implements ContractAnalysisProvider {
  async summarizeContract(document: ContractAnalysisDocument): Promise<string> {
    return (
      `"${document.title}" 24 ay taahhüt içeriyor. Aylık 750.000 TL ciro hedefi bulunuyor. ` +
      "Hedefin altında kalınırsa aylık 2.500 TL ücret uygulanabilir. Tek çekim oranı avantajlı; " +
      "ancak ticari kart ve erken fesih koşulları dikkat gerektiriyor."
    );
  }

  async extractFinancialTerms(_document: ContractAnalysisDocument): Promise<FinancialImpact> {
    void _document; // mock — gerçek sağlayıcı belge içeriğini kullanacak
    return {
      estimatedMonthlyCost: 23125,
      estimatedAnnualCost: 277500,
      comparedToCurrentDiff: -1850,
      volumeShortfallCost: 2500,
      earlyExitCost: 15000,
    };
  }

  async generateQuestions(_document: ContractAnalysisDocument): Promise<string[]> {
    void _document; // mock — gerçek sağlayıcı belge içeriğini kullanacak
    return [
      "Ticari kart işlemlerinde ek komisyon var mı?",
      "Ciro taahhüdü hangi işlem türlerini kapsıyor?",
      "Oranlar hangi koşullarda tek taraflı değiştirilebilir?",
      "POS iptalinde cihaz, yazılım veya fesih bedeli var mı?",
      "Hafta sonu işlemlerinin ödeme günü nedir?",
      "Kampanya sona erdiğinde varsayılan oran ne olacaktır?",
    ];
  }

  async compareContracts(a: ContractAnalysisResult, b: ContractAnalysisResult): Promise<string> {
    const diffA = a.financialImpact.estimatedAnnualCost ?? 0;
    const diffB = b.financialImpact.estimatedAnnualCost ?? 0;
    const cheaper = diffA <= diffB ? "ilk" : "ikinci";
    return `Tahmini yıllık maliyete göre ${cheaper} sözleşme daha düşük maliyetli görünüyor. Kesin karar için bankaya sorulacak soruları yanıtlatın.`;
  }

  async analyzeDocument(document: ContractAnalysisDocument): Promise<ContractAnalysisResult> {
    const [summary60s, financialImpact, questions] = await Promise.all([
      this.summarizeContract(document),
      this.extractFinancialTerms(document),
      this.generateQuestions(document),
    ]);

    return {
      summary60s,
      comparableTerms: {
        singlePaymentRate: 2.2,
        installmentRates: { 6: 4.35 },
        valorDays: 2,
        monthlyDeviceFee: 0,
        otherFixedFees: null,
        volumeCommitmentMonthly: 750000,
        earlyTerminationFee: 15000,
        autoRenewal: true,
        commercialCardExtraRate: 1.2,
        foreignCardExtraRate: 1.5,
        tariffChangeAuthority: true,
      },
      advantages: [
        "Tek çekim oranı mevcut tarifeden düşük",
        "İlk üç ay cihaz ücreti alınmıyor",
        "Ertesi gün ödeme avantajı",
        "Belirli kartlarda kampanya desteği",
      ],
      attentionPoints: [
        "Ciro taahhüdü",
        "Erken fesih bedeli",
        "Ticari kart ek oranı",
        "Valör değişiklik yetkisi",
        "Tek taraflı tarife güncelleme maddesi",
        "Ek ürün zorunluluğu",
        "Otomatik yenileme",
        "İade ve ters ibraz koşulları",
      ],
      risks: [
        {
          text: "Aylık 750.000 TL ciro taahhüdü — hedefin altında kalınırsa ek ücret uygulanabilir",
          severity: "HIGH",
          sourcePageNumber: document.pages[0]?.pageNumber,
          sourceClauseRef: "Madde 4.2",
          suggestedCorrection:
            "Bu maddede ücret tutarı açıkça yazılmamış. İmzadan önce sabit tutarın sözleşmeye eklenmesini talep edin.",
        },
        {
          text: "Erken fesih durumunda bedel uygulanabileceği belirtiliyor",
          severity: "HIGH",
          sourcePageNumber: document.pages[0]?.pageNumber,
          sourceClauseRef: "Madde 7.1",
        },
        {
          text: "Ticari kart işlemlerinde ek komisyon oranı net belirtilmemiş",
          severity: "MEDIUM",
          sourceClauseRef: "Madde 3.4",
        },
        {
          text: "Banka tek taraflı olarak tarifeyi güncelleyebilir",
          severity: "MEDIUM",
          sourceClauseRef: "Madde 9.1",
        },
        {
          text: "Sözleşme süre sonunda otomatik yenileniyor",
          severity: "LOW",
          sourceClauseRef: "Madde 11.3",
        },
      ],
      financialImpact,
      valorSummary: "Ertesi gün ödeme (T+1) — kayıtlı tarifeyle uyumlu.",
      volumeCommitmentNote: "Aylık 750.000 TL ciro taahhüdü bulunuyor.",
      earlyTerminationNote: "Erken fesih halinde tahmini 15.000 TL bedel uygulanabilir.",
      autoRenewalNote: "Sözleşme, fesih bildirimi yapılmazsa otomatik olarak yenilenir.",
      unilateralChangeNote: "Banka, tarife ve oranları önceden bildirimle tek taraflı değiştirebilir.",
      questions,
      confidenceScore: 0.78,
    };
  }
}

export const contractAnalysisProvider: ContractAnalysisProvider = new MockContractAnalysisProvider();
