import { z } from "zod";

export const actualPaymentFormSchema = z.object({
  expectedPaymentId: z.string().min(1),
  receivedAmount: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
  receivedDate: z.coerce.date(),
  bankDescription: z.string().optional(),
  roundingTolerance: z.coerce.number().min(0).optional(),
});

export type ActualPaymentFormInput = z.infer<typeof actualPaymentFormSchema>;
