import type { ClassifiedIntent } from "./types";

/**
 * Doğal dil sorusunu sabit bir niyet (intent) kümesine eşler — deterministik
 * anahtar kelime eşleştirmesi, gerçek bir NLP/ML modeli kullanılmaz (bkz.
 * Aşama 14: "Kullanıcı sorusu intent sınıflandırma", hesaplamalar
 * deterministik servislerden gelir, AI yalnızca açıklama üretir).
 */
export function classifyIntent(question: string): ClassifiedIntent {
  const q = question.toLocaleLowerCase("tr-TR");

  if (/taksit/.test(q) && /(avantaj|uygun|düşük|az|hangi pos)/.test(q)) {
    const match = q.match(/(\d+)\s*taksit/);
    return { intent: "BEST_POS_FOR_INSTALLMENT", installmentCount: match ? Number(match[1]) : 6 };
  }

  if (/valör/.test(q) && /(maliyet|masraf|12 ay|yıl)/.test(q)) {
    return { intent: "VALOR_COST_ESTIMATE" };
  }

  if (/(riskli|dikkat edilmesi gereken).*(madde|hüküm)/.test(q)) {
    return { intent: "CONTRACT_RISKIEST_CLAUSES" };
  }

  if (/(bankayla görüş|banka.*görüşür|ne istemeliyim|pazarlık)/.test(q)) {
    return { intent: "NEGOTIATION_ADVICE" };
  }

  if (/yarın/.test(q) && /(para|ödeme|yatacak|hesab)/.test(q)) {
    return { intent: "TOMORROW_EXPECTED_PAYMENT" };
  }

  if (/banka/.test(q) && /pahalı/.test(q)) {
    return { intent: "BANK_COST_COMPARISON" };
  }

  if (/kesinti/.test(q) && /(neden|niçin|niye|fazla|yüksek|artmış|artış)/.test(q)) {
    return { intent: "MONTHLY_DEDUCTION_REASON" };
  }

  return { intent: "UNKNOWN" };
}
