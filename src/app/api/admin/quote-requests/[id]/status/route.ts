import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { quoteRequestRepository } from "@/server/repositories/quote-request-repository";
import type { QuoteRequestStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: QuoteRequestStatus[] = ["NEW", "CONTACTED", "CLOSED"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (!body?.status || !VALID_STATUSES.includes(body.status as QuoteRequestStatus)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  await quoteRequestRepository.setStatus(id, body.status as QuoteRequestStatus, admin.systemAdminId);
  return NextResponse.json({ ok: true });
}
