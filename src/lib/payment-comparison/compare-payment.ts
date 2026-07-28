import Decimal from "decimal.js";
import { countBusinessDaysBetween, type HolidayCalendar } from "@/lib/tariff-engine";
import type {
  DifferenceStatus,
  PaymentComparisonInput,
  PaymentComparisonResult,
  RuleExplanation,
} from "./types";

interface ExplanationContext {
  delayDays: number;
  absDiff: Decimal;
  registeredRate?: Decimal;
  estimatedAppliedRate?: Decimal;
}

/** Beklenen tutarın bu oranın altında kalması "kısmi ödeme" sayılır. */
const PARTIAL_PAYMENT_THRESHOLD = new Decimal("0.8");

function formatTl(amount: Decimal): string {
  return `${amount.toFixed(2).replace(".", ",")} TL`;
}

function formatRate(rate: Decimal): string {
  return rate.toFixed(2).replace(".", ",");
}

/**
 * Seviye 3 (yapay zekâ öncesi rule-based açıklama). Doküman §14 örneğindeki
 * gibi tek bir kesin neden iddia etmez — birden çok olası nedeni birlikte
 * sunar (bkz. "ticari kart farkı, ek kampanya bedeli veya farklı tarife
 * uygulanmasından kaynaklanabilir").
 */
function buildExplanation(status: DifferenceStatus, ctx: ExplanationContext): RuleExplanation {
  switch (status) {
    case "MATCHED":
      return ctx.absDiff.isZero()
        ? {
            reasonCode: "NONE",
            possibleReason: "Fark yok",
            documentToCheck: "—",
            questionForBank: "—",
            recommendedAction: "Ek bir işlem gerekmiyor.",
            riskLevel: "low",
          }
        : {
            reasonCode: "ROUNDING",
            possibleReason: "Yuvarlama farkı",
            documentToCheck: "—",
            questionForBank: "—",
            recommendedAction: "Ek bir işlem gerekmiyor.",
            riskLevel: "low",
          };
    case "DELAYED":
      return {
        reasonCode: "VALOR",
        possibleReason: `Ödeme kayıtlı valöre göre ${ctx.delayDays} iş günü gecikmiş görünüyor. Bu, tatil günü veya bankanın valör uygulamasından kaynaklanabilir`,
        documentToCheck: "Banka ekstresi",
        questionForBank: "Bu işlem için ödeme neden gecikti?",
        recommendedAction: "Gecikme tekrarlarsa bankanızla valör koşullarını görüşün.",
        riskLevel: "low",
      };
    case "NEEDS_REVIEW": {
      const possibleReason =
        ctx.registeredRate && ctx.estimatedAppliedRate
          ? `Kayıtlı tarifeye göre beklenen kesinti oranı yaklaşık %${formatRate(ctx.registeredRate)}. ` +
            `Gerçekleşen ödeme yaklaşık %${formatRate(ctx.estimatedAppliedRate)} kesintiye karşılık geliyor. ` +
            "Aradaki fark; ticari kart farkı, ek kampanya bedeli veya farklı tarife uygulanmasından kaynaklanabilir."
          : "Uygulanan komisyon oranı, ek ücret ya da ticari kart farkı kayıtlı tarifeden farklı olabilir. " +
            "Brüt tutar bilgisi eksik olduğundan uygulanan oran tahmin edilemedi.";
      return {
        reasonCode: ctx.registeredRate && ctx.estimatedAppliedRate ? "RATE_OR_CARD_TYPE" : "MISSING_DATA",
        possibleReason,
        documentToCheck: "İşlem bazlı komisyon dökümü",
        questionForBank: "Bu işlemde uygulanan komisyon oranı ve varsa ek ücretler nedir?",
        recommendedAction: "Bankadan işlem bazlı dökümü isteyip kayıtlı tarifeyle karşılaştırın.",
        riskLevel: ctx.registeredRate && ctx.estimatedAppliedRate ? "medium" : "high",
      };
    }
    case "DIFFERENCE_FOUND":
      return {
        reasonCode: "OVERPAYMENT",
        possibleReason: "Hesaba geçen tutar kayıtlı tarifeye göre beklenenden fazla",
        documentToCheck: "Banka ekstresi",
        questionForBank: "Bu işlemde fazladan yansıyan tutarın kaynağı nedir?",
        recommendedAction: "Bankanızla teyit edin; hatalı yansımışsa düzeltme talep edin.",
        riskLevel: "medium",
      };
    case "PARTIALLY_PAID":
      return {
        reasonCode: "PARTIAL_PAYMENT",
        possibleReason: "Ödeme parçalı yapılmış veya bir kısmı bloke edilmiş olabilir",
        documentToCheck: "Banka ekstresi / bloke koşulu",
        questionForBank: "Kalan tutar ne zaman ve hangi koşulla yatacak?",
        recommendedAction: "Kalan tutarı takip edin, gerekirse bankayla iletişime geçin.",
        riskLevel: "high",
      };
  }
}

/**
 * Beklenen ve gerçekleşen ödemeyi karşılaştırır (Seviye 1: matematiksel fark,
 * Seviye 2: kural kontrolü). Saf fonksiyon — UI'dan/DB'den bağımsız,
 * deterministiktir; yapay zekâ kullanılmaz (bkz. UX §11.3).
 */
export function comparePayment(
  input: PaymentComparisonInput,
  calendar: HolidayCalendar,
): PaymentComparisonResult {
  const diff = input.actualAmount.minus(input.expectedNet);
  const absDiff = diff.abs();
  const differencePercentage = input.expectedNet.isZero()
    ? new Decimal(0)
    : diff.div(input.expectedNet).mul(100);

  const delayDays =
    input.receivedDate > input.expectedPaymentDate
      ? countBusinessDaysBetween(input.expectedPaymentDate, input.receivedDate, calendar)
      : 0;

  const isPartial = input.actualAmount.lt(input.expectedNet.mul(PARTIAL_PAYMENT_THRESHOLD));
  const withinTolerance = absDiff.lte(input.roundingTolerance);

  let status: DifferenceStatus;
  if (isPartial) {
    status = "PARTIALLY_PAID";
  } else if (withinTolerance) {
    status = delayDays > 0 ? "DELAYED" : "MATCHED";
  } else if (diff.isNegative()) {
    status = "NEEDS_REVIEW";
  } else {
    status = "DIFFERENCE_FOUND";
  }

  const estimatedAppliedRate = input.grossAmount?.isPositive()
    ? input.grossAmount.minus(input.actualAmount).div(input.grossAmount).mul(100)
    : undefined;

  const registeredRate = input.grossAmount?.isPositive()
    ? input.grossAmount.minus(input.expectedNet).div(input.grossAmount).mul(100)
    : undefined;

  const delaySuffix =
    delayDays > 0 && status !== "DELAYED"
      ? ` Ayrıca ödeme kayıtlı valöre göre ${delayDays} iş günü gecikmiş görünüyor.`
      : "";

  let message: string;
  switch (status) {
    case "MATCHED":
      message = absDiff.isZero()
        ? "Ödeme beklenen tutarla uyumlu."
        : `Ödeme beklenen tutarla uyumlu. ${formatTl(absDiff)} yuvarlama farkı var.`;
      break;
    case "DELAYED":
      message = `Ödeme kayıtlı valöre göre ${delayDays} iş günü gecikmiş görünüyor.`;
      break;
    case "NEEDS_REVIEW":
      message =
        `Hesabınıza beklenenden ${formatTl(absDiff)} daha az geçti. Fark, kayıtlı tarifeden ` +
        `farklı bir oran uygulanmış olmasından kaynaklanabilir.${delaySuffix}`;
      break;
    case "DIFFERENCE_FOUND":
      message = `Hesabınıza beklenenden ${formatTl(absDiff)} daha fazla geçti. Bu durumu bankanızla teyit edin.${delaySuffix}`;
      break;
    case "PARTIALLY_PAID":
      message =
        `Beklenen tutarın yalnızca bir kısmı hesabınıza geçti (${formatTl(input.actualAmount)} / ` +
        `${formatTl(input.expectedNet)}). Kısmi ödeme olabilir.${delaySuffix}`;
      break;
  }

  return {
    differenceAmount: diff,
    differencePercentage,
    delayDays,
    estimatedAppliedRate,
    registeredRate,
    status,
    message,
    ruleExplanation: buildExplanation(status, { delayDays, absDiff, registeredRate, estimatedAppliedRate }),
  };
}
