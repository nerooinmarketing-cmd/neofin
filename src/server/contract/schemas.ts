import { z } from "zod";

export const contractUploadSchema = z.object({
  title: z.string().min(1, "Sözleşme başlığı gerekli"),
  bankId: z.string().optional(),
  posId: z.string().optional(),
});

export type ContractUploadInput = z.infer<typeof contractUploadSchema>;
