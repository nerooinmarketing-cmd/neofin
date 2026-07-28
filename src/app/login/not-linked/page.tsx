import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export default function NotLinkedPage() {
  return (
    <AuthShell>
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Bu hesap henüz bir firma ile eşleştirilmemiş.
        </h1>
        <p className="text-sm text-muted-foreground">
          Devam etmek için firma yöneticinizden Telegram eşleştirme kodu
          isteyin.
        </p>
        <div className="space-y-2">
          <Button asChild size="lg" className="w-full">
            <a href="mailto:destek@poskontrol.app?subject=Başvuru">
              Başvuru Oluştur
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href="mailto:destek@poskontrol.app">Destek ile İletişime Geç</a>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/login">Farklı Telegram Hesabı Kullan</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
