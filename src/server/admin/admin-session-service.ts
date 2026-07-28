import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/server/admin/password";
import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/server/admin/cookie";

export { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS };

const SESSION_TTL_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

export interface SystemAdminContext {
  systemAdminId: string;
  name: string;
  email: string;
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * E-posta/şifre ile sistem yöneticisi girişi — CompanyUser/Telegram
 * oturumundan tamamen bağımsız bir kimlik doğrulama akışıdır (bkz. Aşama 15:
 * "Admin paneli normal kullanıcı panelinden route ve yetki olarak ayrı olsun").
 */
export async function createAdminSession(
  email: string,
  password: string,
): Promise<{ rawToken: string } | null> {
  const admin = await prisma.systemAdmin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  await prisma.systemAdminSession.create({
    data: {
      systemAdminId: admin.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return { rawToken };
}

export async function resolveSystemAdminContextFromToken(
  rawToken: string | undefined,
): Promise<SystemAdminContext | null> {
  if (!rawToken) return null;

  const session = await prisma.systemAdminSession.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { systemAdmin: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.systemAdmin.isActive) {
    return null;
  }

  return {
    systemAdminId: session.systemAdmin.id,
    name: session.systemAdmin.name,
    email: session.systemAdmin.email,
  };
}

export async function revokeAdminSessionByToken(rawToken: string): Promise<void> {
  await prisma.systemAdminSession.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
