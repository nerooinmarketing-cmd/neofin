import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { notificationService } from "@/server/notifications/notification-service";

/** Manuel tetikleme: gerçek verilerden bildirim üretir ve bekleyenleri gönderir (gerçek bir cron altyapısı yok). */
export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await notificationService.generate(ctx);
  const result = await notificationService.dispatch(ctx);

  return NextResponse.json({ ok: true, ...result });
}
