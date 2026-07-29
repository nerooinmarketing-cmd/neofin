import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ContractUploadForm } from "@/components/contracts/contract-upload-form";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";

export default async function YeniSozlesmePage() {
  const ctx = await requireTenantContext();
  const [banks, posDevices, identity] = await Promise.all([
    bankRepository.listActive(ctx),
    posDeviceRepository.listActive(ctx),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Yeni Sözleşme Yükle"
        description="PDF veya fotoğraf olarak yükleyin — sistem metni okuyup finansal maddeleri özetler."
      />
      <ContractUploadForm
        banks={banks.map((b) => ({ id: b.id, name: b.name }))}
        posDevices={posDevices.map((p) => ({ id: p.id, name: p.name }))}
      />
    </AppShell>
  );
}
