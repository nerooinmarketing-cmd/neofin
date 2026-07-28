import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { notificationRepository } from "@/server/repositories/notification-repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const updated = await notificationRepository.markRead(ctx, id);
  if (!updated) return NextResponse.json({ error: "bulunamadı" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
