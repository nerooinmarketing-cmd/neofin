import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { notificationRepository } from "@/server/repositories/notification-repository";
import { notificationPreferenceSchema } from "@/server/notifications/schemas";
import type { NotificationType } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const preference = await notificationRepository.getPreference(ctx.companyUserId);
  return NextResponse.json({ preference });
}

export async function PUT(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = notificationPreferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const preference = await notificationRepository.upsertPreference(ctx.companyUserId, {
    enabledTypes: parsed.data.enabledTypes as Partial<Record<NotificationType, boolean>> | undefined,
    dailySummaryHour: parsed.data.dailySummaryHour,
    quietHoursStart: parsed.data.quietHoursStart,
    quietHoursEnd: parsed.data.quietHoursEnd,
  });

  return NextResponse.json({ ok: true, preference });
}
