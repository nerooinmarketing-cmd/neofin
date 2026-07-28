import type { RiskSeverity } from "@/generated/prisma/enums";
import type { ComparableTerms } from "@/lib/contract-comparison";

export type { ComparableTerms };

export interface ContractAnalysisPage {
  pageNumber: number;
  extractedText: string;
}

export interface ContractAnalysisDocument {
  title: string;
  pages: ContractAnalysisPage[];
}

export interface FinancialImpact {
  estimatedMonthlyCost: number | null;
  estimatedAnnualCost: number | null;
  /** Mevcut (aktif) tarifeye göre fark — pozitifse yeni sözleşme daha pahalı. */
  comparedToCurrentDiff: number | null;
  /** Ciro taahhüdü tutmazsa uygulanacak tahmini ek maliyet. */
  volumeShortfallCost: number | null;
  /** Erken fesih halinde uygulanacak tahmini bedel. */
  earlyExitCost: number | null;
}

export interface ContractRiskFinding {
  text: string;
  severity: RiskSeverity;
  sourcePageNumber?: number;
  sourceClauseRef?: string;
  /** "Şerh/düzeltme önerisi" — yalnızca destek metni, hukukî karar değil. */
  suggestedCorrection?: string;
}

export interface ContractAnalysisResult {
  /** A. 60 saniyelik özet */
  summary60s: string;
  /** B. Avantajlar */
  advantages: string[];
  /** C. Dikkat edilmesi gerekenler (başlıklar) */
  attentionPoints: string[];
  /** C/kritik maddeler + F. şerh önerileri — severity ile birlikte */
  risks: ContractRiskFinding[];
  /** D. Finansal etki */
  financialImpact: FinancialImpact;
  /** Aşama 11 (mevcut/yeni sözleşme karşılaştırması) için yapılandırılmış alanlar. */
  comparableTerms: ComparableTerms;
  valorSummary?: string;
  volumeCommitmentNote?: string;
  earlyTerminationNote?: string;
  autoRenewalNote?: string;
  unilateralChangeNote?: string;
  /** E. Bankaya sorulması gereken sorular */
  questions: string[];
  /** 0-1 arası güven skoru — düşükse manuel kontrol gerekir. */
  confidenceScore: number;
}

/**
 * AI sağlayıcısından bağımsız arayüz (bkz. Aşama 10 prompt paketi). Gerçek
 * bir sağlayıcı (ör. Claude/OpenAI) bu arayüzü uygulayarak takılabilir;
 * şimdilik yalnızca `MockContractAnalysisProvider` mevcuttur — gerçek API
 * anahtarı koda yazılmaz.
 */
export interface ContractAnalysisProvider {
  analyzeDocument(document: ContractAnalysisDocument): Promise<ContractAnalysisResult>;
  summarizeContract(document: ContractAnalysisDocument): Promise<string>;
  extractFinancialTerms(document: ContractAnalysisDocument): Promise<FinancialImpact>;
  compareContracts(a: ContractAnalysisResult, b: ContractAnalysisResult): Promise<string>;
  generateQuestions(document: ContractAnalysisDocument): Promise<string[]>;
}
