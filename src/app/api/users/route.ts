import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";

const createUserSchema = z.object({
  name: z.string().min(2, "Ad gerekli"),
  role: z.enum(["OWNER", "MANAGER", "ACCOUNTANT"]),
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const actor = await userRepository.getCurrent(ctx);
  if (!canManageUsers(actor.role)) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (parsed.data.role === "OWNER" && actor.role !== "OWNER") {
    return NextResponse.json({ error: "Yalnızca sahip başka bir sahip ekleyebilir" }, { status: 403 });
  }

  const user = await userRepository.create(ctx, {
    name: parsed.data.name,
    role: parsed.data.role,
    email: parsed.data.email || undefined,
    phone: parsed.data.phone || undefined,
  });
  return NextResponse.json({ ok: true, companyUserId: user.id });
}
