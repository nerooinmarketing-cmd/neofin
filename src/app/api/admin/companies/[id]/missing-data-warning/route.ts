import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { notificationService } from "@/server/notifications/notification-service";

/** "Eksik veri uyarısı gönder" — bkz. Aşama 15. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim() || "Son günlerde gün sonu satış girişi yapılmadığını fark ettik. Lütfen kontrol edin.";

  const result = await notificationService.notifyMissingData(id, message);
  return NextResponse.json({ ok: true, ...result });
}
