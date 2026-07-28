import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { contractRepository } from "@/server/repositories/contract-repository";

const MAX_FILES = 20;

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const title = formData.get("title");
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Sözleşme başlığı gerekli" }, { status: 400 });
  }

  const bankIdRaw = formData.get("bankId");
  const posIdRaw = formData.get("posId");
  const bankId = typeof bankIdRaw === "string" && bankIdRaw.length > 0 ? bankIdRaw : undefined;
  const posId = typeof posIdRaw === "string" && posIdRaw.length > 0 ? posIdRaw : undefined;

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "En az bir dosya (PDF/JPG/PNG) yükleyin" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `En fazla ${MAX_FILES} sayfa yüklenebilir` }, { status: 400 });
  }

  const contract = await contractRepository.create(ctx, { title: title.trim(), bankId, posId, files });
  return NextResponse.json({ ok: true, id: contract.id });
}
