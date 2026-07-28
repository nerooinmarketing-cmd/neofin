"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertBanner } from "@/components/shared/alert-banner";
import type { NotificationType } from "@/generated/prisma/enums";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export interface NotificationPreferencesFormProps {
  typeOptions: { type: NotificationType; label: string }[];
  initialEnabledTypes: Partial<Record<NotificationType, boolean>>;
  initialDailySummaryHour: number | null;
  initialQuietHoursStart: number | null;
  initialQuietHoursEnd: number | null;
}

export function NotificationPreferencesForm({
  typeOptions,
  initialEnabledTypes,
  initialDailySummaryHour,
  initialQuietHoursStart,
  initialQuietHoursEnd,
}: NotificationPreferencesFormProps) {
  const [enabledTypes, setEnabledTypes] = useState(initialEnabledTypes);
  const [dailySummaryHour, setDailySummaryHour] = useState<number | null>(initialDailySummaryHour);
  const [quietHoursStart, setQuietHoursStart] = useState<number | null>(initialQuietHoursStart);
  const [quietHoursEnd, setQuietHoursEnd] = useState<number | null>(initialQuietHoursEnd);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledTypes, dailySummaryHour, quietHoursStart, quietHoursEnd }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Bildirim türleri</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {typeOptions.map(({ type, label }) => (
              <label key={type} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={enabledTypes[type] ?? true}
                  onCheckedChange={(v) => setEnabledTypes((prev) => ({ ...prev, [type]: !!v }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Günlük özet saati</Label>
            <Select
              value={dailySummaryHour === null ? "off" : String(dailySummaryHour)}
              onValueChange={(v) => setDailySummaryHour(v === "off" ? null : Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Kapalı</SelectItem>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{`${String(h).padStart(2, "0")}:00`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sessiz saatler başlangıcı</Label>
            <Select
              value={quietHoursStart === null ? "off" : String(quietHoursStart)}
              onValueChange={(v) => setQuietHoursStart(v === "off" ? null : Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Yok</SelectItem>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{`${String(h).padStart(2, "0")}:00`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sessiz saatler bitişi</Label>
            <Select
              value={quietHoursEnd === null ? "off" : String(quietHoursEnd)}
              onValueChange={(v) => setQuietHoursEnd(v === "off" ? null : Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Yok</SelectItem>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{`${String(h).padStart(2, "0")}:00`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {saved ? <AlertBanner tone="success" title="Tercihler kaydedildi" /> : null}

        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Tercihleri Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
}
