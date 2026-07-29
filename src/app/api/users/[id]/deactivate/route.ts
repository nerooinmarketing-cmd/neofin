import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";
import { NotFoundError } from "@/server/errors";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const actor = await userRepository.getCurrent(ctx);
  if (!canManageUsers(actor.role)) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }
  if (id === ctx.companyUserId) {
    return NextResponse.json({ error: "Kendinizi pasife alamazsınız" }, { status: 400 });
  }

  try {
    await userRepository.deactivate(ctx, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
