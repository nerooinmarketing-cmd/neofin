"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

interface DevUser {
  id: string;
  name: string;
  role: string;
  companyName: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devUsers, setDevUsers] = useState<DevUser[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/dev-login")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { users: DevUser[] } | null) => setDevUsers(data?.users ?? null))
      .catch(() => setDevUsers(null));
  }, []);

  async function handleTelegramLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login-request", { method: "POST" });
      if (!res.ok) throw new Error("İstek oluşturulamadı");
      const data = (await res.json()) as {
        token: string;
        telegramDeepLink: string | null;
      };
      if (data.telegramDeepLink) {
        window.open(data.telegramDeepLink, "_blank", "noopener,noreferrer");
      }
      router.push(`/login/waiting?token=${encodeURIComponent(data.token)}`);
    } catch {
      setError("Bir şeyler ters gitti. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  async function handleDevLogin(companyUserId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUserId }),
      });
      if (!res.ok) throw new Error("Giriş yapılamadı");
      // Sert yönlendirme: yeni oturum çerezi sonrası client router cache'inin
      // eski (girişsiz) render'ı tekrar kullanmasını önler.
      window.location.assign("/app");
    } catch {
      setError("Bir şeyler ters gitti. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Hoş geldiniz
        </h1>
        <p className="text-sm text-muted-foreground">
          Panele erişmek için Telegram hesabınızla doğrulayın.
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={handleTelegramLogin}
          disabled={loading}
        >
          Telegram ile Doğrula
        </Button>
        {error ? <AlertBanner tone="danger" title={error} /> : null}
      </div>

      {devUsers && devUsers.length > 0 ? (
        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Yerel geliştirme girişi (yalnızca dev)
          </p>
          {devUsers.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="w-full justify-start"
              disabled={loading}
              onClick={() => handleDevLogin(user.id)}
            >
              {user.name} · {user.companyName} ({user.role})
            </Button>
          ))}
        </div>
      ) : null}
    </AuthShell>
  );
}
