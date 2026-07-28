// Zero-dependency sabitler — Edge runtime middleware'de de güvenle import
// edilebilsin diye Prisma'ya bağımlı session-service.ts'den ayrı tutulur.

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "poskontrol_session";
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
