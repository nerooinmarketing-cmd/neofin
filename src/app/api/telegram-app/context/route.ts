import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantContextFromInitData } from "@/server/telegram/verify-init-data";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";

/** Mini App açılışında banka/POS listesini döner — kimlik doğrulama `initData` iledir. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { initData?: string } | null;
  const ctx = body?.initData ? await resolveTenantContextFromInitData(body.initData) : null;
  if (!ctx) {
    return NextResponse.json({ error: "Bu Telegram hesabı bir firmaya bağlı değil." }, { status: 401 });
  }

  const [banks, posDevices] = await Promise.all([
    bankRepository.listActive(ctx),
    posDeviceRepository.listActive(ctx),
  ]);

  return NextResponse.json({
    banks: banks.map((b) => ({ id: b.id, name: b.name })),
    posDevices: posDevices.map((p) => ({ id: p.id, name: p.name, bankId: p.bankId })),
  });
}
