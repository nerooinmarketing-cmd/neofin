import type { TenantContext } from "@/server/tenant-context";
import { tariffFormSchema, toCreateTariffVersionInput } from "@/server/tariff/schemas";
import { tariffRepository } from "@/server/repositories/tariff-repository";
import { TariffOverlapError } from "@/server/errors";
import { saveUploadedFile } from "@/server/storage/file-storage";

export type ProcessTariffFormDataResult =
  | { ok: true; tariffId: string }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * `/api/tariffs` (web, cookie oturumu) ve `/api/telegram-app/tariffs`
 * (Telegram Mini App, `initData` doğrulaması) aynı çok parçalı form
 * verisini işler — bu ortak mantık, iki auth yolunun tek bir yerde
 * buluştuğu noktadır.
 */
export async function processTariffFormData(
  ctx: TenantContext,
  formData: FormData,
): Promise<ProcessTariffFormDataResult> {
  const posId = String(formData.get("posId") ?? "");
  const bankId = String(formData.get("bankId") ?? "");
  const dataRaw = formData.get("data");
  if (!posId || !bankId || typeof dataRaw !== "string") {
    return { ok: false, status: 400, error: "posId, bankId ve data gerekli" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(dataRaw);
  } catch {
    return { ok: false, status: 400, error: "data çözümlenemedi" };
  }

  const parsed = tariffFormSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: "Doğrulama hatası",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const documentEntry = formData.get("document");
  const document =
    documentEntry instanceof File && documentEntry.size > 0
      ? {
          fileUrl: (await saveUploadedFile(documentEntry, `tariffs/${ctx.companyId}`)).url,
          fileType: (documentEntry.type === "application/pdf" ? "PDF" : "IMAGE") as "PDF" | "IMAGE",
        }
      : undefined;

  try {
    const tariff = await tariffRepository.createNewVersion(ctx, {
      ...toCreateTariffVersionInput(parsed.data, document),
      posId,
      bankId,
    });
    return { ok: true, tariffId: tariff.id };
  } catch (error) {
    if (error instanceof TariffOverlapError) {
      return { ok: false, status: 409, error: error.message };
    }
    throw error;
  }
}
