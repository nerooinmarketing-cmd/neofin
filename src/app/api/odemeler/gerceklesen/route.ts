import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { actualPaymentFormSchema } from "@/server/actual-payment/schemas";
import { actualPaymentRepository } from "@/server/repositories/actual-payment-repository";
import { saveUploadedFile } from "@/server/storage/file-storage";

export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "geçersiz form verisi" }, { status: 400 });
  }

  const dataRaw = formData.get("data");
  if (typeof dataRaw !== "string") {
    return NextResponse.json({ error: "data gerekli" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(dataRaw);
  } catch {
    return NextResponse.json({ error: "data çözümlenemedi" }, { status: 400 });
  }

  const parsed = actualPaymentFormSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const documentEntry = formData.get("document");
  const documentUrl =
    documentEntry instanceof File && documentEntry.size > 0
      ? (await saveUploadedFile(documentEntry, `actual-payments/${ctx.companyId}`)).url
      : undefined;

  const { comparison } = await actualPaymentRepository.record(ctx, {
    ...parsed.data,
    documentUrl,
  });

  return NextResponse.json({
    ok: true,
    status: comparison.status,
    message: comparison.message,
    differenceAmount: comparison.differenceAmount.toFixed(2),
    differencePercentage: comparison.differencePercentage.toFixed(2),
    delayDays: comparison.delayDays,
    estimatedAppliedRate: comparison.estimatedAppliedRate?.toFixed(3) ?? null,
  });
}
