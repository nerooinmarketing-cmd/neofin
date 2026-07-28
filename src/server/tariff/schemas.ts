import { z } from "zod";
import type { TariffFeeType, DocumentFileType } from "@/generated/prisma/enums";

/** Tarife sihirbazının 8 bölümünü tek bir düz form olarak modelleyen şema.
 * Sunucu tarafında `toCreateTariffVersionInput()` ile repository'nin
 * beklediği iç içe şekle dönüştürülür. */

export const installmentRateFormSchema = z.object({
  installmentCount: z.coerce.number().int().min(2).max(12),
  commissionRate: z.coerce.number().min(0).max(100),
  valorDays: z.coerce.number().int().min(0),
  fixedFee: z.coerce.number().min(0).optional(),
  campaignName: z.string().optional(),
  validUntil: z.coerce.date().optional(),
});

export const tariffFormSchema = z.object({
  // Bölüm 1 — Kimlik
  campaignName: z.string().optional(),
  startDate: z.coerce.date(),
  bankOfficerName: z.string().optional(),
  documentDate: z.coerce.date().optional(),

  // Bölüm 2 — Tek çekim oranları
  nextDayRate: z.coerce.number().min(0).max(100),
  valor2DayRate: z.coerce.number().min(0).max(100).optional(),
  valor7DayRate: z.coerce.number().min(0).max(100).optional(),
  blockedConditionNote: z.string().optional(),
  foreignCardRate: z.coerce.number().min(0).max(100).optional(),
  commercialCardRate: z.coerce.number().min(0).max(100).optional(),

  // Bölüm 3 — Taksit oranları
  installmentRates: z.array(installmentRateFormSchema).default([]),

  // Bölüm 4 — Kart ve işlem türleri
  ownBankCard: z.coerce.boolean().default(true),
  otherBankCard: z.coerce.boolean().default(true),
  commercialCardSupport: z.coerce.boolean().default(false),
  foreignCardSupport: z.coerce.boolean().default(false),
  loyaltyPoints: z.coerce.boolean().default(false),
  refund: z.coerce.boolean().default(true),
  cancellation: z.coerce.boolean().default(true),
  mailOrder: z.coerce.boolean().default(false),
  contactless: z.coerce.boolean().default(true),
  qr: z.coerce.boolean().default(false),

  // Bölüm 5 — Sabit ücretler
  feeMonthlyPos: z.coerce.number().min(0).optional(),
  feeDeviceMaintenance: z.coerce.number().min(0).optional(),
  feeSimLine: z.coerce.number().min(0).optional(),
  feeStatement: z.coerce.number().min(0).optional(),
  feeSoftware: z.coerce.number().min(0).optional(),
  feeInactivity: z.coerce.number().min(0).optional(),
  feeMinVolumePenalty: z.coerce.number().min(0).optional(),
  feeEarlyTermination: z.coerce.number().min(0).optional(),
  feeOtherAmount: z.coerce.number().min(0).optional(),
  feeOtherNote: z.string().optional(),

  // Bölüm 6 — Valör ve ödeme
  paymentDay: z.string().optional(),
  holidayPaymentRule: z.string().optional(),
  weekendPaymentDay: z.string().optional(),
  partialPaymentRule: z.string().optional(),
  blockDurationDays: z.coerce.number().int().min(0).optional(),
  blockReleaseCondition: z.string().optional(),

  // Bölüm 7 — Taahhütler
  monthlyVolumeCommitment: z.coerce.number().min(0).optional(),
  annualVolumeCommitment: z.coerce.number().min(0).optional(),
  productUsageCommitment: z.string().optional(),
  salaryAgreementLink: z.coerce.boolean().default(false),
  creditLink: z.coerce.boolean().default(false),
  autoPaymentInstruction: z.coerce.boolean().default(false),
  breachPenalty: z.coerce.number().min(0).optional(),

  // Bölüm 8 — Belge ve onay
  hasStamp: z.coerce.boolean().default(false),
  hasSignature: z.coerce.boolean().default(false),
  verifiedByUser: z.coerce.boolean().default(false),
  documentNote: z.string().optional(),
});

export type TariffFormInput = z.infer<typeof tariffFormSchema>;

const FEE_FIELD_MAP: Array<{ key: keyof TariffFormInput; feeType: TariffFeeType }> = [
  { key: "feeMonthlyPos", feeType: "MONTHLY_POS" },
  { key: "feeDeviceMaintenance", feeType: "DEVICE_MAINTENANCE" },
  { key: "feeSimLine", feeType: "SIM_LINE" },
  { key: "feeStatement", feeType: "STATEMENT" },
  { key: "feeSoftware", feeType: "SOFTWARE" },
  { key: "feeInactivity", feeType: "INACTIVITY" },
  { key: "feeMinVolumePenalty", feeType: "MIN_VOLUME_PENALTY" },
  { key: "feeEarlyTermination", feeType: "EARLY_TERMINATION" },
];

/** Düz form verisini `tariffRepository.createNewVersion`'ın beklediği iç içe
 * girdiye çevirir (posId/bankId hariç — bunları çağıran ekler). */
export function toCreateTariffVersionInput(
  values: TariffFormInput,
  document?: { fileUrl: string; fileType: DocumentFileType },
) {
  const fees: Array<{ feeType: TariffFeeType; amount: number; note?: string }> = [];
  for (const { key, feeType } of FEE_FIELD_MAP) {
    const amount = values[key] as number | undefined;
    if (amount !== undefined) fees.push({ feeType, amount });
  }
  if (values.feeOtherAmount !== undefined) {
    fees.push({ feeType: "OTHER", amount: values.feeOtherAmount, note: values.feeOtherNote });
  }

  return {
    campaignName: values.campaignName,
    startDate: values.startDate,
    bankOfficerName: values.bankOfficerName,
    documentDate: values.documentDate,
    singlePaymentRates: {
      nextDayRate: values.nextDayRate,
      valor2DayRate: values.valor2DayRate,
      valor7DayRate: values.valor7DayRate,
      blockedConditionNote: values.blockedConditionNote,
      foreignCardRate: values.foreignCardRate,
      commercialCardRate: values.commercialCardRate,
    },
    installmentRates: values.installmentRates,
    transactionSupport: {
      ownBankCard: values.ownBankCard,
      otherBankCard: values.otherBankCard,
      commercialCard: values.commercialCardSupport,
      foreignCard: values.foreignCardSupport,
      loyaltyPoints: values.loyaltyPoints,
      refund: values.refund,
      cancellation: values.cancellation,
      mailOrder: values.mailOrder,
      contactless: values.contactless,
      qr: values.qr,
    },
    fees,
    paymentTerms: {
      paymentDay: values.paymentDay,
      holidayPaymentRule: values.holidayPaymentRule,
      weekendPaymentDay: values.weekendPaymentDay,
      partialPaymentRule: values.partialPaymentRule,
      blockDurationDays: values.blockDurationDays,
      blockReleaseCondition: values.blockReleaseCondition,
    },
    commitments: {
      monthlyVolumeCommitment: values.monthlyVolumeCommitment,
      annualVolumeCommitment: values.annualVolumeCommitment,
      productUsageCommitment: values.productUsageCommitment,
      salaryAgreementLink: values.salaryAgreementLink,
      creditLink: values.creditLink,
      autoPaymentInstruction: values.autoPaymentInstruction,
      breachPenalty: values.breachPenalty,
    },
    document: document
      ? {
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          hasStamp: values.hasStamp,
          hasSignature: values.hasSignature,
          verifiedByUser: values.verifiedByUser,
          note: values.documentNote,
        }
      : undefined,
  };
}
