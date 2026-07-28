import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenantContextFromToken, SESSION_COOKIE_NAME } from "@/server/auth/session-service";
import type { TenantContext } from "@/server/tenant-context";

/**
 * Sunucu bileşenlerinde (Server Component) çağrılır. Geçerli bir oturum
 * yoksa `/login`'e yönlendirir — "kayıtlı değilse panel açılmaz" kuralı
 * burada uygulanır. `middleware.ts` yalnızca cookie'nin *varlığını* kontrol
 * eder (Edge runtime, DB erişimi yok); asıl doğrulama burada yapılır.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const ctx = await resolveTenantContextFromToken(token);

  if (!ctx) {
    redirect("/login");
  }

  return ctx;
}
