import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BankCard } from "@/components/shared/bank-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { bankRepository } from "@/server/repositories/bank-repository";

export default async function BankalarPage() {
  const ctx = await requireTenantContext();
  const banksWithStats = await bankRepository.listWithStats(ctx);

  return (
    <AppShell>
      <PageHeader
        title="Bankalar ve POS'lar"
        description="Firmanızın bankalarını ve bağlı POS cihazlarını yönetin."
        action={
          <Button asChild size="lg">
            <Link href="/bankalar/yeni">
              <Plus className="size-4" />
              Yeni Banka Ekle
            </Link>
          </Button>
        }
      />

      {banksWithStats.length === 0 ? (
        <EmptyState
          title="Henüz bir banka eklenmedi"
          description="İlk bankanızı ekleyerek başlayın."
          action={
            <Button asChild size="lg">
              <Link href="/bankalar/yeni">Banka Ekle</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {banksWithStats.map(({ bank, stats }) => (
            <BankCard
              key={bank.id}
              bankName={bank.name}
              activePosCount={stats.activePosCount}
              monthlyRevenue={stats.monthlyRevenue}
              avgCommissionRate={stats.avgCommissionRate}
              pendingPayment={stats.pendingPayment}
              status={stats.status}
              openBankHref={`/bankalar/${bank.id}`}
              addPosHref={`/bankalar/${bank.id}/pos/yeni`}
              viewTariffsHref={`/bankalar/${bank.id}?tab=tarifeler`}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
