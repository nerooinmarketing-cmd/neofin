import { AppShell } from "@/components/layout/app-shell";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function KullanicilarPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        title="Kullanıcılar"
        description="Firma kullanıcıları ve yetkileri burada yönetilecek."
        stage="ileriki bir aşamada"
      />
    </AppShell>
  );
}
