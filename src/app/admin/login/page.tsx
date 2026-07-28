"use client";

import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/shared/alert-banner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Giriş yapılamadı");
      }
      // Sert yönlendirme: yeni oturum çerezi sonrası client router cache'inin
      // eski (girişsiz) render'ı tekrar kullanmasını önler (bkz. AGENTS.md).
      window.location.assign("/admin/musteriler");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-lg font-semibold text-foreground">Yönetici Girişi</h1>
          <p className="text-sm text-muted-foreground">Bu panel yalnızca platform yöneticileri içindir.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error ? <AlertBanner tone="danger" title={error} /> : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>
    </AuthShell>
  );
}
