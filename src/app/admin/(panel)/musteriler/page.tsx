import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import { adminRepository } from "@/server/admin/admin-repository";
import { PACKAGE_TIER_LABELS, companyStatusLabel, supportStatusLabel } from "@/server/admin/labels";

export default async function MusterilerPage() {
  const companies = await adminRepository.listCompanies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Müşteriler</h1>
          <p className="text-sm text-muted-foreground">{companies.length} firma</p>
        </div>
        <Button asChild>
          <Link href="/admin/musteriler/yeni">Firma Oluştur</Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState title="Henüz firma yok" description="Yeni bir firma oluşturarak başlayın." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => {
            const status = companyStatusLabel(c.status);
            const support = supportStatusLabel(c.supportStatus);
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Paket</dt>
                      <dd className="font-medium text-foreground">{PACKAGE_TIER_LABELS[c.packageTier]}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Telegram eşleşmesi</dt>
                      <dd className="font-medium text-foreground">{c.telegramLinkedCount} kullanıcı</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Aktif banka</dt>
                      <dd className="font-medium text-foreground">{c.activeBankCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Aktif POS</dt>
                      <dd className="font-medium text-foreground">{c.activePosCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Son giriş</dt>
                      <dd className="font-medium text-foreground">{c.lastLoginAt ? formatDate(c.lastLoginAt) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Kurulum</dt>
                      <dd className="font-medium text-foreground">{c.onboardingCompleted ? "Tamamlandı" : "Devam ediyor"}</dd>
                    </div>
                  </dl>
                  <StatusBadge label={support.label} tone={support.tone} />
                  <Button size="sm" className="w-full" asChild>
                    <Link href={`/admin/musteriler/${c.id}`}>Firma Detayını Aç</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
