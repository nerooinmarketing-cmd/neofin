import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { bankInfoSchema } from "@/server/onboarding/schemas";
import { bankRepository } from "@/server/repositories/bank-repository";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bankInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const bank = await bankRepository.create(ctx, {
    name: parsed.data.bankName,
    branchName: parsed.data.branchName,
    customerNumber: parsed.data.customerNumber,
    note: parsed.data.note,
    contactName: parsed.data.contactName,
    contactPhone: parsed.data.contactPhone,
    contactEmail: parsed.data.contactEmail,
  });

  return NextResponse.json({ ok: true, bank });
}
