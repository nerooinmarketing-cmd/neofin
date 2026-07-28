import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredFile {
  url: string;
  fileName: string;
  sizeBytes: number;
}

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * S3-uyumlu bir depolama arayüzü. Şimdilik `public/uploads` altına yerel
 * diske yazar (yalnızca dev/test için uygundur — gerçek banka belgeleri
 * gibi özel dosyalar için değil). Production'da bu fonksiyonun gövdesini
 * S3 (imzalı URL) istemciyle değiştirin; çağıran kod aynı kalır.
 */
export async function saveUploadedFile(file: File, scope: string): Promise<StoredFile> {
  const dir = path.join(UPLOAD_ROOT, scope);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const fileName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return {
    url: `/uploads/${scope}/${fileName}`,
    fileName: file.name,
    sizeBytes: buffer.byteLength,
  };
}
