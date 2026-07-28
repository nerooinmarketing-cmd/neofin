"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertBanner } from "@/components/shared/alert-banner";
import { CONTRACT_PROCESSING_STAGES } from "@/server/contract-analysis/status-labels";

const POLL_INTERVAL_MS = 500;
const TERMINAL_STATUSES = ["COMPLETED", "NEEDS_MANUAL_REVIEW"];

export function ContractProcessingPanel({ contractId, initialStatus }: { contractId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        if (!res.ok) return;
        const body: { status: string } = await res.json();
        if (cancelled) return;
        setStatus(body.status);
        if (TERMINAL_STATUSES.includes(body.status)) {
          clearInterval(pollTimer);
          router.refresh();
        }
      } catch {
        // sıradaki denemede tekrar dener
      }
    }

    const pollTimer = setInterval(poll, POLL_INTERVAL_MS);

    // AbortController ile gerçek iptal — React Strict Mode'daki (dev)
    // mount→cleanup→remount döngüsünde ilk (atılacak) çalıştırmanın isteği
    // sunucuya ulaşmadan iptal edilir; yalnızca kalıcı mount analiz eder.
    fetch(`/api/contracts/${contractId}/analyze`, { method: "POST", signal: controller.signal })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Analiz sırasında bir hata oluştu.");
          return;
        }
        const body: { status: string } = await res.json();
        setStatus(body.status);
        clearInterval(pollTimer);
        router.refresh();
      })
      .catch((err) => {
        if (!cancelled && err?.name !== "AbortError") setError("Analiz sırasında bir hata oluştu.");
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(pollTimer);
    };
  }, [contractId, router]);

  if (error) {
    return <AlertBanner tone="danger" title={error} />;
  }

  const currentIndex = CONTRACT_PROCESSING_STAGES.findIndex((s) => s.status === status);

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-foreground">Sözleşme analiz ediliyor…</p>
        <ol className="space-y-3">
          {CONTRACT_PROCESSING_STAGES.map((stage, index) => {
            const done = currentIndex > index || TERMINAL_STATUSES.includes(status);
            const active = currentIndex === index && !TERMINAL_STATUSES.includes(status);
            return (
              <li key={stage.status} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium " +
                    (done
                      ? "bg-success text-success-foreground"
                      : active
                        ? "animate-pulse bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {index + 1}
                </span>
                <span className={done || active ? "text-foreground" : "text-muted-foreground"}>{stage.label}</span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
