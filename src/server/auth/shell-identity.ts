import type { TenantContext } from "@/server/tenant-context";
import { userRepository } from "@/server/repositories/user-repository";
import { companySettingsRepository } from "@/server/repositories/company-settings-repository";

/**
 * `AppShell`'e geçirilecek gerçek kullanıcı/firma adını döner. `/kullanicilar`
 * ve `/ayarlar` dışındaki sayfalar hâlâ AppShell'in "Şenol Bey"/"Örnek
 * Ticaret A.Ş." varsayılanlarını kullanıyordu — bu yardımcı, aynı deseni
 * (bkz. kullanicilar/page.tsx) her sayfada tekrar yazmadan uygular.
 */
export async function getShellIdentity(ctx: TenantContext) {
  const [currentUser, company] = await Promise.all([
    userRepository.getCurrent(ctx),
    companySettingsRepository.getProfile(ctx),
  ]);

  return {
    userName: currentUser.name,
    companyName: company.shortName ?? company.name ?? undefined,
  };
}
