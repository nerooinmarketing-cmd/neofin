import type { FinanceIntent } from "@/lib/finance-assistant";

/**
 * AI sağlayıcısından bağımsız arayüz (bkz. Aşama 14: "AI yalnızca açıklama
 * üretmeli"). Risk tespiti, önerilen kontrol, veri kaynağı ve ilgili ekran
 * bağlantısı deterministik servis katmanında (`finance-assistant-service.ts`)
 * karara bağlanır — sağlayıcının tek görevi, hazır hesaplanmış olguları
 * ("facts") doğal dilde tek bir cümleye/duruma çevirmektir. Şimdilik yalnızca
 * `MockFinanceAssistantProvider` mevcuttur — gerçek API anahtarı koda
 * yazılmaz.
 */
export interface FinanceAssistantProvider {
  narrate(intent: FinanceIntent, facts: Record<string, unknown>): Promise<string>;
}
