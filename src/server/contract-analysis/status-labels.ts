import type { StatusTone } from "@/components/shared/status-badge";

/** `Contract.status` (ContractStatus) için Türkçe etiket/ton (bkz. UX §15.2). */
export function contractStatusLabel(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "UPLOADED":
      return { label: "Yüklendi", tone: "info" };
    case "EXTRACTING_TEXT":
      return { label: "Metin çıkarılıyor", tone: "info" };
    case "CLASSIFYING_CLAUSES":
      return { label: "Maddeler sınıflandırılıyor", tone: "info" };
    case "CALCULATING_IMPACT":
      return { label: "Finansal etki hesaplanıyor", tone: "info" };
    case "COMPLETED":
      return { label: "Analiz tamamlandı", tone: "success" };
    case "NEEDS_MANUAL_REVIEW":
      return { label: "Manuel kontrol gerekli", tone: "warning" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export const CONTRACT_PROCESSING_STAGES = [
  { status: "UPLOADED", label: "Belge alındı" },
  { status: "EXTRACTING_TEXT", label: "Metinler okunuyor" },
  { status: "CLASSIFYING_CLAUSES", label: "Finansal maddeler bulunuyor" },
  { status: "CALCULATING_IMPACT", label: "Riskler sınıflandırılıyor ve özet hazırlanıyor" },
] as const;
