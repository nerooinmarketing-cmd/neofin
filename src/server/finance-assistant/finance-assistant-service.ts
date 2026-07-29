import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { classifyIntent, type FinanceIntent } from "@/lib/finance-assistant";
import { financeAssistantProvider } from "./mock-provider";
import { reportRepository } from "@/server/repositories/report-repository";
import { expectedPaymentRepository } from "@/server/repositories/expected-payment-repository";
import { contractRepository } from "@/server/repositories/contract-repository";
import { buildBankNegotiationScript } from "@/server/reports/summary-text";
import { currentMonthRange, trailing12MonthsRange } from "@/server/reporting/date-ranges";

export interface FinanceAssistantAnswer {
  question: string;
  intent: FinanceIntent;
  netCevap: string;
  dataSource: string;
  risk: string | null;
  recommendedAction: string | null;
  relatedScreenHref: string;
  relatedScreenLabel: string;
}

interface HandlerResult {
  facts: Record<string, unknown>;
  dataSource: string;
  risk: string | null;
  recommendedAction: string | null;
  relatedScreenHref: string;
  relatedScreenLabel: string;
}

async function handleMonthlyDeductionReason(ctx: TenantContext): Promise<HandlerResult> {
  const now = new Date();
  const [monthly, bankComparison] = await Promise.all([
    reportRepository.getMonthlyCost(ctx, now),
    reportRepository.getBankComparison(ctx, currentMonthRange(now)),
  ]);
  const withVolume = bankComparison.filter((b) => b.grossTotal > 0);
  const topBank = withVolume.length > 0 ? withVolume.reduce((a, b) => (b.avgRate > a.avgRate ? b : a)) : null;

  return {
    facts: {
      monthLabel: monthly.monthLabel,
      deductionTotal: monthly.expectedDeductionTotal,
      percentChange: monthly.percentChangeVsPreviousMonth,
      topBankName: topBank?.bankName ?? null,
    },
    dataSource: `Aylık Maliyet Raporu — ${monthly.monthLabel}`,
    risk:
      monthly.percentChangeVsPreviousMonth !== null && monthly.percentChangeVsPreviousMonth > 10
        ? `Kesinti geçen aya göre %${monthly.percentChangeVsPreviousMonth.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} arttı.`
        : null,
    recommendedAction: topBank
      ? `${topBank.bankName} bankasının oranını Banka Karşılaştırma raporunda inceleyin.`
      : "Bu ay için henüz satış verisi yok.",
    relatedScreenHref: "/panel/raporlar/aylik",
    relatedScreenLabel: "Aylık Maliyet Raporunu Aç",
  };
}

async function handleBankCostComparison(ctx: TenantContext): Promise<HandlerResult> {
  const bankComparison = await reportRepository.getBankComparison(ctx, currentMonthRange());
  const withVolume = bankComparison.filter((b) => b.grossTotal > 0);
  const highest = withVolume.length > 0 ? withVolume.reduce((a, b) => (b.avgRate > a.avgRate ? b : a)) : null;
  const lowest = withVolume.length > 0 ? withVolume.reduce((a, b) => (b.avgRate < a.avgRate ? b : a)) : null;

  return {
    facts: {
      highest: highest ? { bankName: highest.bankName, avgRate: highest.avgRate } : null,
      lowest: lowest ? { bankName: lowest.bankName, avgRate: lowest.avgRate } : null,
    },
    dataSource: "Banka Karşılaştırma Raporu — bu ay",
    risk: null,
    recommendedAction:
      highest && lowest && highest.bankName !== lowest.bankName
        ? "Düşük oranlı bankaya hacim kaydırmayı değerlendirin."
        : null,
    relatedScreenHref: "/panel/raporlar/banka-karsilastirma",
    relatedScreenLabel: "Banka Karşılaştırma Raporunu Aç",
  };
}

async function handleTomorrowExpectedPayment(ctx: TenantContext): Promise<HandlerResult> {
  const items = await expectedPaymentRepository.listWithFilters(ctx, { range: "tomorrow" });
  const total = items.reduce((s, i) => s + Number(i.payment.expectedNet), 0);
  const bankNames = [...new Set(items.map((i) => i.payment.bank.name))];

  return {
    facts: { total, count: items.length, bankNames },
    dataSource: "Beklenen Ödemeler — yarın",
    risk: null,
    recommendedAction: null,
    relatedScreenHref: "/panel/odemeler/beklenen?range=tomorrow",
    relatedScreenLabel: "Beklenen Ödemeleri Aç",
  };
}

async function handleBestPosForInstallment(ctx: TenantContext, installmentCount: number): Promise<HandlerResult> {
  const rates = await prisma.tariffInstallmentRate.findMany({
    where: { installmentCount, tariffVersion: { companyId: ctx.companyId, status: "ACTIVE" } },
    include: { tariffVersion: { include: { bank: true, pos: true } } },
  });

  const best = rates.reduce<{ posName: string; bankName: string; rate: number } | null>((acc, r) => {
    const rate = Number(r.commissionRate);
    if (!acc || rate < acc.rate) {
      return { posName: r.tariffVersion.pos.name, bankName: r.tariffVersion.bank.name, rate };
    }
    return acc;
  }, null);

  return {
    facts: { installmentCount, best },
    dataSource: `Tarifeler — ${installmentCount} taksit karşılaştırması`,
    risk: null,
    recommendedAction: best ? `Yüksek hacimli ${installmentCount} taksitli satışları ${best.posName} üzerinden yönlendirmeyi değerlendirin.` : null,
    relatedScreenHref: "/panel/tarifeler",
    relatedScreenLabel: "Tarifeleri Aç",
  };
}

async function handleContractRiskiestClauses(ctx: TenantContext): Promise<HandlerResult> {
  const contracts = await contractRepository.listAll(ctx);
  const withAnalysis = contracts.find((c) => c.analysis);

  if (!withAnalysis) {
    return {
      facts: { contractTitle: null, risks: [] },
      dataSource: "Sözleşme Analizi",
      risk: null,
      recommendedAction: "Bir sözleşme yükleyip analiz ettirin.",
      relatedScreenHref: "/panel/sozlesmeler",
      relatedScreenLabel: "Sözleşme Analizine Git",
    };
  }

  const full = await contractRepository.getByIdOrThrow(ctx, withAnalysis.id);
  const topRisks = [...(full.analysis?.risks ?? [])]
    .sort((a, b) => {
      const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 3)
    .map((r) => ({ text: r.text, severity: r.severity }));

  return {
    facts: { contractTitle: full.title, risks: topRisks },
    dataSource: `Sözleşme Analizi — ${full.title}`,
    risk: topRisks.some((r) => r.severity === "HIGH") ? "Kritik olarak işaretlenmiş madde(ler) var." : null,
    recommendedAction: "Şerh/düzeltme önerileri için sözleşme analizini inceleyin.",
    relatedScreenHref: `/panel/sozlesmeler/${full.id}`,
    relatedScreenLabel: "Sözleşmeyi Görüntüle",
  };
}

async function handleNegotiationAdvice(ctx: TenantContext): Promise<HandlerResult> {
  const report = await reportRepository.getAnnualNegotiationReport(ctx);
  const withVolume = report.bankComparison.filter((b) => b.grossTotal > 0);
  const scripts = withVolume.map((b) =>
    buildBankNegotiationScript({
      bankName: b.bankName,
      avgRate: b.avgRate,
      fixedFeeTotal: b.fixedFeeTotal,
      avgValorDays: b.avgValorDays,
    }),
  );

  return {
    facts: { scripts },
    dataSource: "Yıllık Maliyet ve Pazarlık Raporu — son 12 ay",
    risk: report.negotiation.volumeCommitmentRisks.length > 0 ? "Ciro taahhüdü riski taşıyan sözleşme(ler) var." : null,
    recommendedAction: "Görüşme öncesi Yıllık Maliyet ve Pazarlık Raporu'nun tamamını inceleyin.",
    relatedScreenHref: "/panel/raporlar/yillik-pazarlik",
    relatedScreenLabel: "Pazarlık Raporunu Aç",
  };
}

async function handleValorCostEstimate(ctx: TenantContext): Promise<HandlerResult> {
  const bankComparison = await reportRepository.getBankComparison(ctx, trailing12MonthsRange());
  const banks = bankComparison
    .filter((b) => b.grossTotal > 0)
    .map((b) => ({ bankName: b.bankName, avgValorDays: b.avgValorDays }));

  return {
    facts: { banks },
    dataSource: "Banka Karşılaştırma — son 12 ay",
    risk: null,
    recommendedAction:
      banks.some((b) => b.avgValorDays > 1) ? "Valör süresi uzun olan bankalarla iyileştirme görüşmesi yapmayı değerlendirin." : null,
    relatedScreenHref: "/panel/raporlar/banka-karsilastirma",
    relatedScreenLabel: "Banka Karşılaştırma Raporunu Aç",
  };
}

const UNKNOWN_RESULT: HandlerResult = {
  facts: {},
  dataSource: "—",
  risk: null,
  recommendedAction: null,
  relatedScreenHref: "/panel/raporlar",
  relatedScreenLabel: "Raporlara Git",
};

/**
 * Finans Asistanı sohbet motoru — bkz. Aşama 14 mimarisi: intent
 * sınıflandırma (saf, deterministik) → tenant'a özel gerçek veriyi
 * repository katmanından çekme → deterministik hesap/karar (risk, önerilen
 * kontrol, ilgili ekran) → yalnızca doğal dil anlatımı için mock AI
 * sağlayıcısı. Kullanıcı yalnızca kendi `ctx.companyId`'sine ait veriyi
 * görebilir; tüm veri erişimi standart repository katmanından geçer.
 */
export async function answerFinanceQuestion(ctx: TenantContext, question: string): Promise<FinanceAssistantAnswer> {
  const { intent, installmentCount } = classifyIntent(question);

  const result: HandlerResult = await (async () => {
    switch (intent) {
      case "MONTHLY_DEDUCTION_REASON":
        return handleMonthlyDeductionReason(ctx);
      case "BANK_COST_COMPARISON":
        return handleBankCostComparison(ctx);
      case "TOMORROW_EXPECTED_PAYMENT":
        return handleTomorrowExpectedPayment(ctx);
      case "BEST_POS_FOR_INSTALLMENT":
        return handleBestPosForInstallment(ctx, installmentCount ?? 6);
      case "CONTRACT_RISKIEST_CLAUSES":
        return handleContractRiskiestClauses(ctx);
      case "NEGOTIATION_ADVICE":
        return handleNegotiationAdvice(ctx);
      case "VALOR_COST_ESTIMATE":
        return handleValorCostEstimate(ctx);
      case "UNKNOWN":
        return UNKNOWN_RESULT;
    }
  })();

  const netCevap = await financeAssistantProvider.narrate(intent, result.facts);

  return {
    question,
    intent,
    netCevap,
    dataSource: result.dataSource,
    risk: result.risk,
    recommendedAction: result.recommendedAction,
    relatedScreenHref: result.relatedScreenHref,
    relatedScreenLabel: result.relatedScreenLabel,
  };
}
