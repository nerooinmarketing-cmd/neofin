import { describe, expect, it } from "vitest";
import { classifyIntent } from "./classify-intent";

describe("classifyIntent", () => {
  it("matches the product doc's example questions", () => {
    expect(classifyIntent("Bu ay neden fazla kesinti oldu?").intent).toBe("MONTHLY_DEDUCTION_REASON");
    expect(classifyIntent("Bu ay neden fazla kesinti olmuş?").intent).toBe("MONTHLY_DEDUCTION_REASON");
    expect(classifyIntent("Hangi banka daha pahalı?").intent).toBe("BANK_COST_COMPARISON");
    expect(classifyIntent("Hangi bankam daha pahalı?").intent).toBe("BANK_COST_COMPARISON");
    expect(classifyIntent("Yarın ne kadar para yatacak?").intent).toBe("TOMORROW_EXPECTED_PAYMENT");
    expect(classifyIntent("Yarın hesabıma ne kadar para yatacak?").intent).toBe("TOMORROW_EXPECTED_PAYMENT");
    expect(classifyIntent("Bu sözleşmenin en riskli maddeleri neler?").intent).toBe("CONTRACT_RISKIEST_CLAUSES");
    expect(classifyIntent("Bu sözleşmede en riskli üç madde nedir?").intent).toBe("CONTRACT_RISKIEST_CLAUSES");
    expect(classifyIntent("Bankayla görüşürken ne istemeliyim?").intent).toBe("NEGOTIATION_ADVICE");
    expect(classifyIntent("Son 12 ayda valör nedeniyle tahmini maliyetim ne kadar?").intent).toBe(
      "VALOR_COST_ESTIMATE",
    );
  });

  it("extracts the installment count and defaults to 6 when unspecified", () => {
    const withCount = classifyIntent("6 taksitli satış hangi POS'ta daha avantajlı?");
    expect(withCount.intent).toBe("BEST_POS_FOR_INSTALLMENT");
    expect(withCount.installmentCount).toBe(6);

    const other = classifyIntent("9 taksitli satışları hangi POS'tan geçmem daha avantajlı?");
    expect(other.installmentCount).toBe(9);

    const noCount = classifyIntent("Taksitli satış için hangi POS daha avantajlı?");
    expect(noCount.intent).toBe("BEST_POS_FOR_INSTALLMENT");
    expect(noCount.installmentCount).toBe(6);
  });

  it("falls back to UNKNOWN for unrelated questions", () => {
    expect(classifyIntent("Bugün hava nasıl?").intent).toBe("UNKNOWN");
  });
});
