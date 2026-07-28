import { CreateCompanyForm } from "@/components/admin/create-company-form";

export default function YeniFirmaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Firma Oluştur</h1>
        <p className="text-sm text-muted-foreground">
          Firma oluşturulduktan sonra ilk kullanıcıyı ekleyip Telegram eşleştirme kodu üretebilirsiniz.
        </p>
      </div>
      <CreateCompanyForm />
    </div>
  );
}
