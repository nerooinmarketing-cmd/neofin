import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";
import { createPairingCode } from "@/server/telegram/pairing-service";
import { NotFoundError } from "@/server/errors";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const actor = await userRepository.getCurrent(ctx);
  if (id !== ctx.companyUserId && !canManageUsers(actor.role)) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  try {
    await userRepository.getByIdOrThrow(ctx, id); // hedef kullanıcının bu firmaya ait olduğunu doğrula
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }

  const result = await createPairingCode(ctx.companyId, id);
  return NextResponse.json({
    ok: true,
    deepLink: result.deepLink,
    token: result.token,
    expiresAt: result.expiresAt,
  });
}
