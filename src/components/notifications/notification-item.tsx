"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";

export interface NotificationItemProps {
  id: string;
  typeLabel: string;
  title: string;
  body: string;
  status: string;
  statusLabel: { label: string; tone: StatusTone };
  createdAt: Date;
}

export function NotificationItem({ id, typeLabel, title, body, status, statusLabel, createdAt }: NotificationItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markRead() {
    setLoading(true);
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{typeLabel}</p>
            <p className="font-heading font-semibold text-foreground">{title}</p>
          </div>
          <StatusBadge label={statusLabel.label} tone={statusLabel.tone} />
        </div>
        <p className="whitespace-pre-line text-sm text-foreground">{body}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
          {status !== "READ" ? (
            <Button size="sm" variant="outline" onClick={markRead} disabled={loading}>
              Okundu İşaretle
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
