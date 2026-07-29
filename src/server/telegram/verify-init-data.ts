import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";

interface TelegramInitDataUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60; // 24 saat

/**
 * Telegram Mini App'in her istekte gönderdiği `initData`'yı bot token ile
 * imzasını doğrulayarak çözer (bkz. Telegram belgeleri "Validating data
 * received via the Mini App"). Cookie tabanlı oturumun alternatifidir —
 * Mini App'in WebView'ı bizim `poskontrol_session` cookie'sini taşımaz.
 */
export function verifyTelegramInitData(initData: string): { user: TelegramInitDataUser } | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const computedBuf = Buffer.from(computedHash, "hex");
  const providedBuf = Buffer.from(hash, "hex");
  if (computedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(computedBuf, providedBuf)) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SECONDS) return null;

  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson) as TelegramInitDataUser;
    return { user };
  } catch {
    return null;
  }
}

/** `initData`'dan doğrudan `TenantContext`'e çözer — Telegram hesabı bir firmaya bağlı değilse `null`. */
export async function resolveTenantContextFromInitData(initData: string): Promise<TenantContext | null> {
  const verified = verifyTelegramInitData(initData);
  if (!verified) return null;

  const account = await prisma.telegramAccount.findUnique({
    where: { telegramUserId: BigInt(verified.user.id) },
  });
  if (!account?.companyId || !account.companyUserId) return null;

  return { companyId: account.companyId, companyUserId: account.companyUserId };
}
