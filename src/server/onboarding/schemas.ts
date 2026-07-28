import { z } from "zod";

/** Adım 1 — Firma bilgileri */
export const companyInfoSchema = z.object({
  name: z.string().min(2, "Firma unvanı gerekli"),
  shortName: z.string().min(2, "Kısa firma adı gerekli"),
  taxNumber: z.string().regex(/^\d{10,11}$/, "Vergi numarası 10 veya 11 haneli olmalı"),
  contactName: z.string().min(2, "Yetkili kişi adı gerekli"),
  phone: z.string().min(10, "Telefon numarası gerekli"),
  email: z.string().email("Geçerli bir e-posta girin"),
  city: z.string().min(1, "İl gerekli"),
  district: z.string().min(1, "İlçe gerekli"),
  sector: z.string().min(1, "Sektör gerekli"),
  estimatedAnnualVolume: z.coerce.number().positive().optional(),
  branchCount: z.coerce.number().int().min(1).default(1),
});
export type CompanyInfoInput = z.infer<typeof companyInfoSchema>;

/** Adım 2 — Banka ekleme */
export const bankInfoSchema = z.object({
  bankName: z.string().min(2, "Banka adı gerekli"),
  branchName: z.string().optional(),
  customerNumber: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  note: z.string().optional(),
});
export type BankInfoInput = z.infer<typeof bankInfoSchema>;

/** Adım 3 — POS ekleme */
export const posInfoSchema = z.object({
  posType: z.enum(["PHYSICAL", "VIRTUAL", "MOBILE", "QR"]),
  posName: z.string().min(2, "POS adı gerekli"),
  terminalNo: z.string().min(1, "Terminal numarası gerekli"),
  merchantNo: z.string().min(1, "Üye işyeri numarası gerekli"),
  isActive: z.coerce.boolean().default(true),
});
export type PosInfoInput = z.infer<typeof posInfoSchema>;

/** Adım 4 — Resmî tarife girişi (basitleştirilmiş ilk giriş; tam 8 bölümlü
 * form Aşama 5'te). */
export const installmentRateSchema = z.object({
  installmentCount: z.coerce.number().int().min(2).max(12),
  commissionRate: z.coerce.number().min(0).max(100),
  valorDays: z.coerce.number().int().min(0),
});

export const tariffInfoSchema = z.object({
  campaignName: z.string().optional(),
  startDate: z.coerce.date(),
  nextDayRate: z.coerce.number().min(0).max(100),
  valor2DayRate: z.coerce.number().min(0).max(100).optional(),
  valor7DayRate: z.coerce.number().min(0).max(100).optional(),
  foreignCardRate: z.coerce.number().min(0).max(100).optional(),
  commercialCardRate: z.coerce.number().min(0).max(100).optional(),
  installmentRates: z.array(installmentRateSchema).default([]),
  monthlyFee: z.coerce.number().min(0).optional(),
  hasStamp: z.coerce.boolean().default(false),
  hasSignature: z.coerce.boolean().default(false),
  verifiedByUser: z.coerce.boolean().default(false),
});
export type TariffInfoInput = z.infer<typeof tariffInfoSchema>;
