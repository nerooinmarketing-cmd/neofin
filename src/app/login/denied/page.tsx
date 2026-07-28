import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export default function LoginDeniedPage() {
  return (
    <AuthShell>
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Giriş reddedildi
        </h1>
        <p className="text-sm text-muted-foreground">
          Telegram üzerinden bu girişi reddettiniz. Bu siz değilseniz hesap
          güvenliğinizi kontrol edin.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Tekrar Dene</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
