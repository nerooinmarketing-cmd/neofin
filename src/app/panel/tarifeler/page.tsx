import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";

export default async function TarifelerPage() {
  const ctx = await requireTenantContext();
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Tarifeler"
        description="Resmî tarife kayıtları ve sürüm geçmişi bankalar üzerinden yönetilir."
      />
      <EmptyState
        title="Tarifeler, bankanızın detay sayfasında"
        description="Her tarife bir bankaya ve POS'a bağlıdır. Bir tarife eklemek veya sürüm geçmişini görmek için Bankalar ve POS'lar ekranından ilgili bankayı açıp Tarifeler sekmesine gidin."
        action={
          <Button asChild size="lg">
            <Link href="/panel/bankalar">Bankalar ve POS&apos;lar</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
