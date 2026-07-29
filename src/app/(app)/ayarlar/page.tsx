import Link from "next/link";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { OwnProfileForm } from "@/components/settings/own-profile-form";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { companySettingsRepository } from "@/server/repositories/company-settings-repository";
import { userRepository, canManageUsers } from "@/server/repositories/user-repository";

export default async function AyarlarPage() {
  const ctx = await requireTenantContext();
  const [company, currentUser] = await Promise.all([
    companySettingsRepository.getProfile(ctx),
    userRepository.getCurrent(ctx),
  ]);

  return (
    <AppShell userName={currentUser.name} companyName={company.shortName ?? company.name ?? undefined}>
      <PageHeader title="Ayarlar" description="Firma, bildirim ve hesap ayarlarınızı yönetin." />

      <CompanySettingsForm
        defaultValues={{
          name: company.name,
          shortName: company.shortName,
          taxNumber: company.taxNumber,
          contactName: company.contactName,
          phone: company.phone,
          email: company.email,
          city: company.city,
          district: company.district,
          sector: company.sector,
          estimatedAnnualVolume: company.estimatedAnnualVolume ? Number(company.estimatedAnnualVolume) : null,
          branchCount: company.branchCount,
        }}
        readOnly={!canManageUsers(currentUser.role)}
      />

      <OwnProfileForm
        defaultValues={{
          name: currentUser.name,
          email: currentUser.email ?? "",
          phone: currentUser.phone ?? "",
        }}
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Bildirim Tercihleri</p>
              <p className="text-xs text-muted-foreground">
                Hangi bildirimleri, hangi saatlerde alacağınızı Bildirimler sayfasından yönetin.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/bildirimler">Bildirimlere Git</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
