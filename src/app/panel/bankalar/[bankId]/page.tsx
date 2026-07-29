import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PosCard } from "@/components/shared/pos-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { tariffRepository } from "@/server/repositories/tariff-repository";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { bankId } = await params;
  const { tab } = await searchParams;
  const ctx = await requireTenantContext();

  const [bank, stats, posWithStats, tariffVersions, identity] = await Promise.all([
    bankRepository.getByIdOrThrow(ctx, bankId),
    bankRepository.getStats(ctx, bankId),
    posDeviceRepository.listByBankWithStats(ctx, bankId),
    tariffRepository.listByBank(ctx, bankId),
    getShellIdentity(ctx),
  ]);

  const allDocuments = tariffVersions.flatMap((v) =>
    v.documents.map((doc) => ({ ...doc, posName: v.pos.name, versionNumber: v.versionNumber })),
  );

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title={bank.name}
        description={`${stats.activePosCount} aktif POS · ${bank.branchName ?? "Şube bilgisi yok"}`}
      />

      <Tabs defaultValue={tab ?? "genel"}>
        <TabsList>
          <TabsTrigger value="genel">Genel</TabsTrigger>
          <TabsTrigger value="poslar">POS&apos;lar</TabsTrigger>
          <TabsTrigger value="tarifeler">Tarifeler</TabsTrigger>
          <TabsTrigger value="odemeler">Ödemeler</TabsTrigger>
          <TabsTrigger value="belgeler">Belgeler</TabsTrigger>
          <TabsTrigger value="raporlar">Raporlar</TabsTrigger>
        </TabsList>

        <TabsContent value="genel" className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Aylık ciro</dt>
              <dd className="tabular-money text-lg font-semibold text-foreground">
                {formatCurrency(stats.monthlyRevenue)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ort. komisyon</dt>
              <dd className="tabular-money text-lg font-semibold text-foreground">
                %{stats.avgCommissionRate.toLocaleString("tr-TR")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Bekleyen ödeme</dt>
              <dd className="tabular-money text-lg font-semibold text-foreground">
                {formatCurrency(stats.pendingPayment)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Durum</dt>
              <dd>
                <StatusBadge label={stats.status.label} tone={stats.status.tone} />
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">
              Banka bilgileri
            </h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Müşteri numarası</dt>
                <dd className="text-foreground">{bank.customerNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Not</dt>
                <dd className="text-foreground">{bank.note ?? "—"}</dd>
              </div>
              {bank.contacts.map((contact) => (
                <div key={contact.id}>
                  <dt className="text-xs text-muted-foreground">Yetkili</dt>
                  <dd className="text-foreground">
                    {contact.name}
                    {contact.phone ? ` · ${contact.phone}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="poslar" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild size="lg">
              <Link href={`/panel/bankalar/${bank.id}/pos/yeni`}>
                <Plus className="size-4" />
                Yeni POS Ekle
              </Link>
            </Button>
          </div>
          {posWithStats.length === 0 ? (
            <EmptyState
              title="Bu bankaya bağlı POS yok"
              description="İlk POS'unuzu ekleyerek başlayın."
              action={
                <Button asChild size="lg">
                  <Link href={`/panel/bankalar/${bank.id}/pos/yeni`}>POS Ekle</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {posWithStats.map(({ pos, stats: posStats }) => (
                <PosCard
                  key={pos.id}
                  posName={pos.name}
                  terminalNo={pos.terminalNo}
                  posType={pos.type}
                  activeTariffName={posStats.activeTariffName}
                  lastTransactionDate={posStats.lastTransactionDate}
                  monthlyRevenue={posStats.monthlyRevenue}
                  monthlyDeduction={posStats.monthlyDeduction}
                  status={posStats.status}
                  addTariffHref={`/panel/bankalar/${bank.id}/pos/${pos.id}/tarife/yeni`}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tarifeler" className="space-y-3">
          {tariffVersions.length === 0 ? (
            <EmptyState
              title="Bu banka için henüz tarife girilmedi"
              description="Bir POS ekledikten sonra resmî tarife bilgilerini girin."
            />
          ) : (
            tariffVersions.map((tariff) => (
              <div
                key={tariff.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {tariff.pos.name} · Sürüm {tariff.versionNumber}
                    {tariff.campaignName ? ` — ${tariff.campaignName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tariff.startDate)} —{" "}
                    {tariff.endDate ? formatDate(tariff.endDate) : "devam ediyor"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={tariff.status === "ACTIVE" ? "Aktif" : "Geçmiş sürüm"}
                    tone={tariff.status === "ACTIVE" ? "success" : "neutral"}
                  />
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/panel/bankalar/${bank.id}/pos/${tariff.posId}/tarife/yeni`}>
                      Yeni Sürüm
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="odemeler">
          <EmptyState
            title="Ödemeler modülü yakında"
            description="Beklenen ve gerçekleşen ödemeler Aşama 7'de bu sekmede görünecek."
          />
        </TabsContent>

        <TabsContent value="belgeler" className="space-y-2">
          {allDocuments.length === 0 ? (
            <EmptyState
              title="Henüz belge yüklenmedi"
              description="Tarife girerken yüklediğiniz POS Bilgi Formu belgeleri burada listelenir."
            />
          ) : (
            allDocuments.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground">
                  {doc.posName} · Sürüm {doc.versionNumber} belgesi
                </span>
                <StatusBadge
                  label={doc.hasStamp && doc.hasSignature ? "Kaşe/imza tam" : "Eksik olabilir"}
                  tone={doc.hasStamp && doc.hasSignature ? "success" : "warning"}
                />
              </a>
            ))
          )}
        </TabsContent>

        <TabsContent value="raporlar">
          <EmptyState
            title="Raporlar modülü yakında"
            description="Banka bazlı raporlar Aşama 13'te bu sekmede görünecek."
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
