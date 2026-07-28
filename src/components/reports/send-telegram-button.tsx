"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

export function SendTelegramButton({ reportTitle, reportPath }: { reportTitle: string; reportPath: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function send() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/reports/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportTitle, reportPath }),
    });
    const body = await res.json();
    setLoading(false);
    setMessage(
      res.ok
        ? { tone: "success", text: "Rapor bağlantısı Telegram'a gönderildi." }
        : { tone: "danger", text: body.error ?? "Gönderilemedi." },
    );
  }

  return (
    <div className="space-y-2 print:hidden">
      <Button variant="outline" onClick={send} disabled={loading}>
        <Send className="size-4" />
        {loading ? "Gönderiliyor..." : "Telegram'a Gönder"}
      </Button>
      {message ? <AlertBanner tone={message.tone} title={message.text} /> : null}
    </div>
  );
}
