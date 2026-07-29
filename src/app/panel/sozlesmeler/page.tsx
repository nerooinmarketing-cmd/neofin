import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ContractCard } from "@/components/contracts/contract-card";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { contractRepository } from "@/server/repositories/contract-repository";

export default async function SozlesmelerPage() {
  const ctx = await requireTenantContext();
  const [contracts, identity] = await Promise.all([
    contractRepository.listAll(ctx),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Sözleşme Analizi"
        description="Yapay zekâ destekli sözleşme yükleme, özetleme ve risk analizi."
      />
      <div className="flex justify-end">
        <Button size="lg" asChild>
          <Link href="/panel/sozlesmeler/yeni">Yeni Sözleşme Yükle</Link>
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          title="Henüz yüklenen sözleşme yok"
          description="Yeni bir POS alırken veya banka sözleşmesi imzalarken belgeyi buradan yükleyip analiz ettirin."
          action={
            <Button asChild>
              <Link href="/panel/sozlesmeler/yeni">Yeni Sözleşme Yükle</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              id={contract.id}
              title={contract.title}
              bankName={contract.bank?.name}
              posName={contract.pos?.name}
              status={contract.status}
              pageCount={contract.pages.length}
              uploadedAt={contract.uploadedAt}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
