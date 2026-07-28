"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

/** Gerçek bir zamanlayıcı (cron) yok — bu buton üretim + gönderim akışını manuel tetikler. */
export function NotificationCheckButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null);

  async function check() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/notifications/check", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult({ sent: body.sent, skipped: body.skipped, failed: body.failed });
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={check} disabled={loading}>
        <RefreshCw className="size-4" />
        {loading ? "Kontrol ediliyor..." : "Bildirimleri Kontrol Et"}
      </Button>
      {result ? (
        <AlertBanner
          tone="info"
          title={`${result.sent} gönderildi, ${result.skipped} atlandı, ${result.failed} başarısız`}
          description="Atlanan bildirimler tercihiniz kapalı, sessiz saatler içinde ya da Telegram hesabınız bağlı değil olabilir."
        />
      ) : null}
    </div>
  );
}
