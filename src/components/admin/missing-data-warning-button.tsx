"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

export function MissingDataWarningButton({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/admin/companies/${companyId}/missing-data-warning`, { method: "POST" });
    const body = await res.json();
    setLoading(false);
    setResult(
      res.ok
        ? `Gönderildi: ${body.sent}, atlandı: ${body.skipped}, başarısız: ${body.failed}`
        : (body.error ?? "Gönderilemedi."),
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={send} disabled={loading}>
        {loading ? "Gönderiliyor..." : "Eksik Veri Uyarısı Gönder"}
      </Button>
      {result ? <AlertBanner tone="info" title={result} /> : null}
    </div>
  );
}
