import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { TenantContext } from "@/server/tenant-context";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/auth/cookie";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;

/** Dev-login yalnızca production DIŞINDA ve açıkça etkinleştirildiğinde çalışır. */
export function isDevLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN_ENABLED === "true";
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Onaylanmış bir LoginApproval'dan tarayıcı oturumu üretir. Approval başına
 * en fazla bir oturum oluşturulabilir (`createdViaLoginApprovalId` @unique) —
 * bu, aynı onayın iki kez "session" oluşturmak için tekrar kullanılmasını
 * (replay) engeller.
 */
export async function createSessionFromApproval(params: {
  approvalId: string;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<{ rawToken: string; session: { id: string } } | null> {
  const approval = await prisma.loginApproval.findUnique({ where: { id: params.approvalId } });
  if (
    !approval ||
    approval.status !== "APPROVED" ||
    !approval.companyId ||
    !approval.telegramAccountId
  ) {
    return null;
  }

  const telegramAccount = await prisma.telegramAccount.findUnique({
    where: { id: approval.telegramAccountId },
  });
  if (!telegramAccount?.companyUserId) return null;

  const rawToken = crypto.randomBytes(32).toString("base64url");

  try {
    const session = await prisma.session.create({
      data: {
        companyId: approval.companyId,
        companyUserId: telegramAccount.companyUserId,
        tokenHash: hashToken(rawToken),
        createdViaLoginApprovalId: approval.id,
        deviceInfo: params.deviceInfo,
        ipAddress: params.ipAddress,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: approval.companyId,
        actorType: "USER",
        actorUserId: telegramAccount.companyUserId,
        action: "SESSION_CREATE",
        entityType: "Session",
        entityId: session.id,
      },
    });

    return { rawToken, session };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null; // bu approval zaten bir oturum üretmiş
    }
    throw error;
  }
}

/** Yerel geliştirme girişi — production'da route katmanında env kontrolüyle kapatılır. */
export async function createDevSession(params: {
  companyUserId: string;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<{ rawToken: string; session: { id: string } }> {
  const companyUser = await prisma.companyUser.findUniqueOrThrow({
    where: { id: params.companyUserId },
  });

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const session = await prisma.session.create({
    data: {
      companyId: companyUser.companyId,
      companyUserId: companyUser.id,
      tokenHash: hashToken(rawToken),
      isDevSession: true,
      deviceInfo: params.deviceInfo,
      ipAddress: params.ipAddress,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: companyUser.companyId,
      actorType: "SYSTEM",
      actorUserId: companyUser.id,
      action: "DEV_SESSION_CREATE",
      entityType: "Session",
      entityId: session.id,
    },
  });

  return { rawToken, session };
}

/** Cookie'den okunan ham token'ı doğrular ve tenant bağlamını döndürür. */
export async function resolveTenantContextFromToken(
  rawToken: string | undefined,
): Promise<TenantContext | null> {
  if (!rawToken) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return { companyId: session.companyId, companyUserId: session.companyUserId };
}

export async function revokeSessionByToken(rawToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
