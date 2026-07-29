import { redirect } from "next/navigation";
import { requireTenantContext } from "@/server/auth/require-tenant-context";

/**
 * Telegram/dev-login akışının son adımı: geçerli oturum kontrolü yapılıp
 * gerçek panele ("/panel") yönlendirilir. Doğrulama başarısızsa
 * `requireTenantContext` zaten `/login`'e yönlendirir.
 */
export default async function AppGatewayPage() {
  await requireTenantContext();
  redirect("/panel");
}
