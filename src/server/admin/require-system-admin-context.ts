import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  resolveSystemAdminContextFromToken,
  ADMIN_SESSION_COOKIE_NAME,
  type SystemAdminContext,
} from "@/server/admin/admin-session-service";

/**
 * Sunucu bileşenlerinde çağrılır — `/admin/(panel)` layout'unda. Geçerli bir
 * yönetici oturumu yoksa `/admin/login`'e yönlendirir. Tenant oturumundan
 * (`requireTenantContext`) tamamen ayrı bir kontrol zinciridir.
 */
export async function requireSystemAdminContext(): Promise<SystemAdminContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const ctx = await resolveSystemAdminContextFromToken(token);

  if (!ctx) {
    redirect("/admin/login");
  }

  return ctx;
}
