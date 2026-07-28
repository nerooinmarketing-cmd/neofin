// Zero-dependency sabitler — Edge runtime middleware'de de güvenle import
// edilebilsin diye Prisma'ya bağımlı admin-session-service.ts'den ayrı
// tutulur. Tenant oturumundan (SESSION_COOKIE_NAME) tamamen farklı bir
// cookie adı kullanır — "yetki olarak ayrı" kuralı burada uygulanır.

const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 saat

export const ADMIN_SESSION_COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME ?? "poskontrol_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
