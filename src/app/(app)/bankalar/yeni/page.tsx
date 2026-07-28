import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BankCreateForm } from "@/components/banks/bank-create-form";

export default function YeniBankaPage() {
  return (
    <AppShell>
      <PageHeader title="Yeni Banka Ekle" description="Firmanıza yeni bir banka ekleyin." />
      <BankCreateForm />
    </AppShell>
  );
}
