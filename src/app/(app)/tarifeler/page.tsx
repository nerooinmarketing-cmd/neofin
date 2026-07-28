import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function TarifelerPage() {
  return (
    <AppShell>
      <PageHeader
        title="Tarifeler"
        description="Resmî tarife kayıtları ve sürüm geçmişi bankalar üzerinden yönetilir."
      />
      <EmptyState
        title="Tarifeler, bankanızın detay sayfasında"
        description="Her tarife bir bankaya ve POS'a bağlıdır. Bir tarife eklemek veya sürüm geçmişini görmek için Bankalar ve POS'lar ekranından ilgili bankayı açıp Tarifeler sekmesine gidin."
        action={
          <Button asChild size="lg">
            <Link href="/bankalar">Bankalar ve POS&apos;lar</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
