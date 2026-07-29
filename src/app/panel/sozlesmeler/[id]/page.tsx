import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ContractProcessingPanel } from "@/components/contracts/contract-processing-panel";
import { ContractAnalysisResult } from "@/components/contracts/contract-analysis-result";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { contractRepository } from "@/server/repositories/contract-repository";
import { contractStatusLabel } from "@/server/contract-analysis/status-labels";

export default async function SozlesmeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  const [contract, identity] = await Promise.all([
    contractRepository.getByIdOrThrow(ctx, id),
    getShellIdentity(ctx),
  ]);
  const displayStatus = contractStatusLabel(contract.status);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title={contract.title}
        description={[contract.bank?.name, contract.pos?.name].filter(Boolean).join(" · ") || "Banka/POS eşleşmesi yok"}
        action={
          <div className="flex items-center gap-2">
            {contract.analysis && contract.posId ? (
              <Button variant="outline" asChild>
                <Link href={`/panel/sozlesmeler/${contract.id}/karsilastir`}>Mevcut Tarifeyle Karşılaştır</Link>
              </Button>
            ) : null}
            <StatusBadge label={displayStatus.label} tone={displayStatus.tone} />
          </div>
        }
      />

      {contract.analysis ? (
        <ContractAnalysisResult
          analysis={contract.analysis}
          needsManualReview={contract.status === "NEEDS_MANUAL_REVIEW"}
        />
      ) : (
        <ContractProcessingPanel contractId={contract.id} initialStatus={contract.status} />
      )}
    </AppShell>
  );
}
