import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { UserManagementPanel } from "@/components/users/user-management-panel";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { userRepository } from "@/server/repositories/user-repository";
import { companySettingsRepository } from "@/server/repositories/company-settings-repository";

export default async function KullanicilarPage() {
  const ctx = await requireTenantContext();
  const [users, currentUser, company] = await Promise.all([
    userRepository.list(ctx),
    userRepository.getCurrent(ctx),
    companySettingsRepository.getProfile(ctx),
  ]);

  return (
    <AppShell userName={currentUser.name} companyName={company.shortName ?? company.name ?? undefined}>
      <PageHeader title="Kullanıcılar" description="Firma kullanıcıları ve yetkileri burada yönetilir." />

      <UserManagementPanel
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          telegramLinked: u.telegramLinked,
        }))}
        currentUserId={ctx.companyUserId}
        currentUserRole={currentUser.role}
      />
    </AppShell>
  );
}
