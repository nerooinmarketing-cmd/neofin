import { AppShell } from "@/components/layout/app-shell";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AyarlarPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        title="Ayarlar"
        description="Firma, bildirim ve hesap ayarları burada yönetilecek."
        stage="ileriki bir aşamada"
      />
    </AppShell>
  );
}
