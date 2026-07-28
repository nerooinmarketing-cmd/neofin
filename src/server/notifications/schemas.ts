import { z } from "zod";

const hourSchema = z.number().int().min(0).max(23).nullable().optional();

export const notificationPreferenceSchema = z.object({
  enabledTypes: z.record(z.string(), z.boolean()).optional(),
  dailySummaryHour: hourSchema,
  quietHoursStart: hourSchema,
  quietHoursEnd: hourSchema,
});

export type NotificationPreferenceFormInput = z.infer<typeof notificationPreferenceSchema>;
