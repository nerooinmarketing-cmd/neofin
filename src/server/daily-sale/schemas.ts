import { z } from "zod";

export const saleLineSchema = z
  .object({
    transactionType: z.enum([
      "SINGLE",
      "INSTALLMENT",
      "FOREIGN_CARD",
      "COMMERCIAL_CARD",
      "REFUND",
      "CANCEL",
    ]),
    installmentCount: z.coerce.number().int().min(2).max(12).optional(),
    amount: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
    transactionCount: z.coerce.number().int().min(1).default(1),
    cardType: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((line) => line.transactionType !== "INSTALLMENT" || line.installmentCount !== undefined, {
    message: "Taksitli satış için taksit sayısı seçilmeli",
    path: ["installmentCount"],
  });

export const dailySaleFormSchema = z.object({
  branchId: z.string().min(1),
  bankId: z.string().min(1),
  posId: z.string().min(1),
  saleDate: z.coerce.date(),
  lines: z.array(saleLineSchema).min(1, "En az bir satış satırı girin"),
});

export type DailySaleFormInput = z.infer<typeof dailySaleFormSchema>;
export type SaleLineFormInput = z.infer<typeof saleLineSchema>;
