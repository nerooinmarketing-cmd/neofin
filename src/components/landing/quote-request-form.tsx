"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertBanner } from "@/components/shared/alert-banner";

export function QuoteRequestForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, companyName: companyName || undefined, message: message || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AlertBanner
        tone="success"
        title="Talebiniz alındı"
        description="Ekibimiz en kısa sürede sizinle iletişime geçecek."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quote-name">Ad soyad *</Label>
          <Input
            id="quote-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız soyadınız"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-phone">Telefon *</Label>
          <Input
            id="quote-phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quote-company">Firma adı</Label>
        <Input
          id="quote-company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="İşletmenizin adı"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quote-message">Mesajınız</Label>
        <Textarea
          id="quote-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Kaç banka/POS kullandığınızı veya sorularınızı yazabilirsiniz (opsiyonel)"
        />
      </div>
      {error ? <AlertBanner tone="danger" title={error} /> : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Gönderiliyor..." : "Teklif Alın"}
      </Button>
    </form>
  );
}
