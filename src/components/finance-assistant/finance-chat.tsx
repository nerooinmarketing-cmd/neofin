"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertBanner } from "@/components/shared/alert-banner";
import { ASSISTANT_EXAMPLE_QUESTIONS } from "@/lib/finance-assistant";
import type { FinanceAssistantAnswer } from "@/server/finance-assistant/finance-assistant-service";

interface ChatEntry {
  question: string;
  answer: FinanceAssistantAnswer | null;
  error: string | null;
}

export function FinanceChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setInput("");
    setEntries((prev) => [...prev, { question: trimmed, answer: null, error: null }]);

    const res = await fetch("/api/asistan/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    });
    const body = await res.json();
    setLoading(false);

    setEntries((prev) =>
      prev.map((entry, i) =>
        i === prev.length - 1
          ? { ...entry, answer: res.ok ? body.answer : null, error: res.ok ? null : (body.error ?? "Bir hata oluştu.") }
          : entry,
      ),
    );
  }

  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-foreground">Örnek sorular</p>
            <div className="flex flex-wrap gap-2">
              {ASSISTANT_EXAMPLE_QUESTIONS.map((q) => (
                <Button key={q} variant="outline" size="sm" onClick={() => ask(q)} disabled={loading}>
                  {q}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
              {entry.question}
            </div>

            {entry.error ? (
              <AlertBanner tone="danger" title={entry.error} />
            ) : entry.answer ? (
              <Card>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{entry.answer.netCevap}</p>

                  <p className="text-xs text-muted-foreground">Veri kaynağı: {entry.answer.dataSource}</p>

                  {entry.answer.risk ? <AlertBanner tone="warning" title={entry.answer.risk} /> : null}

                  {entry.answer.recommendedAction ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Önerilen kontrol: </span>
                      {entry.answer.recommendedAction}
                    </p>
                  ) : null}

                  <Link
                    href={entry.answer.relatedScreenHref}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {entry.answer.relatedScreenLabel}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Yanıtlanıyor...</p>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir soru sorun (örn. Hangi banka daha pahalı?)"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || input.trim().length === 0}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
