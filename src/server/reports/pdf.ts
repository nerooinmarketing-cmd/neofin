import puppeteer from "puppeteer-core";
import { createReportRenderSession, revokeSessionByToken } from "@/server/auth/session-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/cookie";

/**
 * Telegram'daki "📊 Raporlar" butonundan gelen "PDF olarak gönder" isteğini
 * karşılar. Web'deki rapor sayfasını (aynı HTML/print CSS, `print:hidden`
 * sınıfları dahil) gerçek bir headless Chromium'da açıp `page.pdf()` ile
 * PDF'e çevirir — rapor mantığının web ve Telegram'da bire bir aynı
 * kalmasını sağlayan tek yol budur (bkz. AGENTS.md kuralı: "webde neyse
 * aynısını uygula"). `page.pdf()` Puppeteer'da otomatik olarak "print" medya
 * emülasyonuyla çalışır, bu yüzden ayrı bir stil dosyası gerekmez.
 *
 * Sayfa oturum gerektirdiği için, ilgili kullanıcı için çok kısa ömürlü bir
 * dahili oturum açılır (bkz. `createReportRenderSession`), cookie olarak
 * headless sayfaya enjekte edilir ve render biter bitmez iptal edilir.
 */
export async function renderTenantReportToPdf(params: {
  companyUserId: string;
  path: string;
}): Promise<Buffer> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error(
      "PUPPETEER_EXECUTABLE_PATH tanımlı değil — PDF üretimi için sunucuda Chromium yolu gerekli.",
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { rawToken } = await createReportRenderSession(params.companyUserId);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const url = new URL(appUrl);
    await page.setCookie({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
    });

    await page.goto(`${appUrl}${params.path}`, { waitUntil: "networkidle0", timeout: 30_000 });
    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
    await revokeSessionByToken(rawToken);
  }
}
