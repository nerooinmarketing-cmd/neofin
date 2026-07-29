"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { QuoteRequestStatus } from "@/generated/prisma/enums";

const STATUS_ACTIONS: { status: QuoteRequestStatus; label: string }[] = [
  { status: "CONTACTED", label: "Görüşüldü olarak işaretle" },
  { status: "CLOSED", label: "Kapat" },
  { status: "NEW", label: "Yeniden aç" },
];

export function QuoteRequestStatusButtons({
  quoteRequestId,
  currentStatus,
}: {
  quoteRequestId: string;
  currentStatus: QuoteRequestStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<QuoteRequestStatus | null>(null);

  async function setStatus(status: QuoteRequestStatus) {
    setSaving(status);
    await fetch(`/api/admin/quote-requests/${quoteRequestId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ACTIONS.filter((a) => a.status !== currentStatus).map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant="outline"
          disabled={saving !== null}
          onClick={() => setStatus(a.status)}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
