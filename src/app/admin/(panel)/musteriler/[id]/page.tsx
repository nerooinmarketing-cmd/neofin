import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { SupportNotesPanel } from "@/components/admin/support-notes-panel";
import { CompanyUsersPanel } from "@/components/admin/company-users-panel";
import { MissingDataWarningButton } from "@/components/admin/missing-data-warning-button";
import { formatDate } from "@/lib/format";
import { adminRepository } from "@/server/admin/admin-repository";
import { companyStatusLabel } from "@/server/admin/labels";

const REPORT_TYPE_LABELS: Record<string, string> = {
  DAILY_SUMMARY: "Günlük Özet",
  MONTHLY_COST: "Aylık Maliyet",
  BANK_COMPARISON: "Banka Karşılaştırma",
  POS_COMPARISON: "POS Karşılaştırma",
  DIFFERENCE_REPORT: "Fark Raporu",
  ANNUAL_NEGOTIATION: "Yıllık Maliyet ve Pazarlık Raporu",
  CONTRACT_ANALYSIS_SUMMARY: "Sözleşme Analiz Özeti",
};

export default async function FirmaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await adminRepository.getCompanyDetail(id);
  if (!detail) notFound();

  const { company, tariffVersionCount, recentSaleDates, latestReport, criticalDifferenceCount } = detail;
  const status = companyStatusLabel(company.status);

  const users = company.companyUsers.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    telegramLinked: company.telegramAccounts.some((t) => t.companyUserId === u.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href="/admin/musteriler" className="text-xs text-muted-foreground hover:underline">
            ← Müşterilere dön
          </Link>
          <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
            {company.shortName ?? company.name ?? company.phone}
          </h1>
          <p className="text-sm text-muted-foreground">{company.phone}</p>
        </div>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>

      <CompanySettingsForm
        companyId={company.id}
        initialStatus={company.status}
        initialPackageTier={company.packageTier}
        initialTrialEndsAt={company.trialEndsAt}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aktif banka</p>
          <p className="text-xl font-semibold text-foreground">{company.banks.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aktif POS</p>
          <p className="text-xl font-semibold text-foreground">{company.posDevices.filter((p) => p.isActive).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tarife kayıtları</p>
          <p className="text-xl font-semibold text-foreground">{tariffVersionCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Kritik uyarılar</p>
          <p className="text-xl font-semibold text-foreground">{criticalDifferenceCount}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-foreground">Veri giriş sıklığı (son satışlar)</p>
          {recentSaleDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz gün sonu girişi yapılmamış.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentSaleDates.map((d, i) => (
                <StatusBadge key={i} label={formatDate(d)} tone="neutral" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium text-foreground">Son rapor</p>
          {latestReport ? (
            <p className="text-sm text-muted-foreground">
              {REPORT_TYPE_LABELS[latestReport.type] ?? latestReport.type} — {formatDate(latestReport.generatedAt)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz rapor görüntülenmemiş.</p>
          )}
        </CardContent>
      </Card>

      <CompanyUsersPanel companyId={company.id} users={users} />

      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-foreground">Telegram geçmişi</p>
          {company.telegramAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz bağlı Telegram hesabı yok.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {company.telegramAccounts.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                  <span className="text-foreground">
                    {[t.firstName, t.lastName].filter(Boolean).join(" ") || t.username || t.telegramUserId.toString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.linkedAt ? `Bağlandı: ${formatDate(t.linkedAt)}` : "Bağlanmadı"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SupportNotesPanel
        companyId={company.id}
        notes={company.supportNotes.map((n) => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt,
          adminName: n.systemAdmin?.name ?? null,
        }))}
      />

      <MissingDataWarningButton companyId={company.id} />
    </div>
  );
}
