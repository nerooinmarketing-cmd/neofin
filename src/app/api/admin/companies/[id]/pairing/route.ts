import { NextResponse, type NextRequest } from "next/server";
import { getSystemAdminContextFromRequest } from "@/server/admin/api-admin-context";
import { createPairingCode } from "@/server/telegram/pairing-service";

/** "Telegram eşleştirme kodu oluştur/yenile" — bkz. Aşama 15. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSystemAdminContextFromRequest(request);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { companyUserId?: string } | null;
  if (!body?.companyUserId) {
    return NextResponse.json({ error: "companyUserId gerekli" }, { status: 400 });
  }

  const result = await createPairingCode(id, body.companyUserId);
  return NextResponse.json({
    ok: true,
    deepLink: result.deepLink,
    token: result.token,
    expiresAt: result.expiresAt,
  });
}
