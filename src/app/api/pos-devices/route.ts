import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { posInfoSchema } from "@/server/onboarding/schemas";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPosSchema = posInfoSchema.extend({ bankId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createPosSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const branch = await prisma.branch.findFirst({ where: { companyId: ctx.companyId } });
  if (!branch) {
    return NextResponse.json(
      { error: "Firma için henüz bir şube bulunmuyor." },
      { status: 409 },
    );
  }

  const pos = await posDeviceRepository.create(ctx, {
    branchId: branch.id,
    bankId: parsed.data.bankId,
    name: parsed.data.posName,
    terminalNo: parsed.data.terminalNo,
    merchantNo: parsed.data.merchantNo,
    type: parsed.data.posType,
  });

  return NextResponse.json({ ok: true, pos });
}
