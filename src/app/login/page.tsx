"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/shared/alert-banner";

interface DevUser {
  id: string;
  name: string;
  role: string;
  companyName: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devUsers, setDevUsers] = useState<DevUser[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/dev-login")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { users: DevUser[] } | null) => setDevUsers(data?.users ?? null))
      .catch(() => setDevUsers(null));
  }, []);

  async function handlePhoneLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json().catch(() => null)) as
        | { token: string; expiresAt: string }
        | { error: string }
        | null;
      if (!res.ok || !data || "error" in data) {
        setError(data && "error" in data ? data.error : "Bir şeyler ters gitti. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
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
      <form onSubmit={handlePhoneLogin} className="space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-lg font-semibold text-foreground">Hoş geldiniz</h1>
          <p className="text-sm text-muted-foreground">
            Telefon numaranızı girin, Telegram hesabınıza bir onay isteği gönderelim.
          </p>
        </div>
        <div className="space-y-1.5 text-left">
          <Label htmlFor="login-phone">Telefon numarası</Label>
          <Input
            id="login-phone"
            type="tel"
            required
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Gönderiliyor..." : "Devam Et"}
        </Button>
        {error ? <AlertBanner tone="danger" title={error} /> : null}
      </form>

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
