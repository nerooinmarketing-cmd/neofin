import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { tariffFormSchema, toCreateTariffVersionInput } from "@/server/tariff/schemas";
import { tariffRepository } from "@/server/repositories/tariff-repository";
import { TariffOverlapError } from "@/server/errors";
import { saveUploadedFile } from "@/server/storage/file-storage";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const posId = String(formData.get("posId") ?? "");
  const bankId = String(formData.get("bankId") ?? "");
  const dataRaw = formData.get("data");
  if (!posId || !bankId || typeof dataRaw !== "string") {
    return NextResponse.json({ error: "posId, bankId ve data gerekli" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(dataRaw);
  } catch {
    return NextResponse.json({ error: "data çözümlenemedi" }, { status: 400 });
  }

  const parsed = tariffFormSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const documentEntry = formData.get("document");
  const document =
    documentEntry instanceof File && documentEntry.size > 0
      ? {
          fileUrl: (await saveUploadedFile(documentEntry, `tariffs/${ctx.companyId}`)).url,
          fileType: (documentEntry.type === "application/pdf" ? "PDF" : "IMAGE") as
            | "PDF"
            | "IMAGE",
        }
      : undefined;

  try {
    const tariff = await tariffRepository.createNewVersion(ctx, {
      ...toCreateTariffVersionInput(parsed.data, document),
      posId,
      bankId,
    });
    return NextResponse.json({ ok: true, tariffId: tariff.id });
  } catch (error) {
    if (error instanceof TariffOverlapError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
