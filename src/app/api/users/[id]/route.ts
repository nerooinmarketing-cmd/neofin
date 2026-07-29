import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";
import { NotFoundError } from "@/server/errors";

const setRoleSchema = z.object({ role: z.enum(["OWNER", "MANAGER", "ACCOUNTANT"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const actor = await userRepository.getCurrent(ctx);
  if (!canManageUsers(actor.role)) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }
  if (id === ctx.companyUserId) {
    return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = setRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Doğrulama hatası" }, { status: 400 });
  }
  if (parsed.data.role === "OWNER" && actor.role !== "OWNER") {
    return NextResponse.json({ error: "Yalnızca sahip başka birini sahip yapabilir" }, { status: 403 });
  }

  try {
    const user = await userRepository.setRole(ctx, id, parsed.data.role);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
