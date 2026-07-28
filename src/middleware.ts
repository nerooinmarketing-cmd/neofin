import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/server/auth/cookie";
import { ADMIN_SESSION_COOKIE_NAME } from "@/server/admin/cookie";

/**
 * Edge runtime'da çalışır — Prisma/DB'ye erişemez, bu yüzden yalnızca
 * cookie'nin *varlığını* kontrol eder (hızlı, DB'siz ön filtre). Asıl
 * doğrulama (imza, süre, iptal) Node runtime'da yapılır:
 * `src/server/auth/require-tenant-context.ts` ((app) grubu için) ve
 * `src/server/admin/require-system-admin-context.ts` (/admin/(panel) için).
 *
 * Yönetici paneli tamamen ayrı bir cookie (`ADMIN_SESSION_COOKIE_NAME`)
 * kullanır — tenant oturumuyla hiçbir şekilde karışmaz (bkz. Aşama 15:
 * "route ve yetki olarak ayrı").
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }
    const hasAdminSessionCookie = request.cookies.has(ADMIN_SESSION_COOKIE_NAME);
    if (!hasAdminSessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|login|showcase|favicon.ico).*)"],
};
