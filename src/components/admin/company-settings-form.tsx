"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertBanner } from "@/components/shared/alert-banner";
import { PACKAGE_TIER_LABELS } from "@/server/admin/labels";
import type { CompanyStatus, PackageTier } from "@/generated/prisma/enums";

function toLocalDateInputValue(date: Date | null): string {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CompanySettingsForm({
  companyId,
  initialStatus,
  initialPackageTier,
  initialTrialEndsAt,
}: {
  companyId: string;
  initialStatus: CompanyStatus;
  initialPackageTier: PackageTier;
  initialTrialEndsAt: Date | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [packageTier, setPackageTier] = useState(initialPackageTier);
  const [trialEndsAt, setTrialEndsAt] = useState(toLocalDateInputValue(initialTrialEndsAt));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        packageTier,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-foreground">Abonelik ve durum</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Firma durumu</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Pasif</SelectItem>
                <SelectItem value="TRIAL">Deneme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Paket</Label>
            <Select value={packageTier} onValueChange={(v) => setPackageTier(v as PackageTier)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PACKAGE_TIER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trialEndsAt">Deneme süresi bitişi</Label>
            <Input
              id="trialEndsAt"
              type="date"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
            />
          </div>
        </div>

        {saved ? <AlertBanner tone="success" title="Kaydedildi" /> : null}

        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
}
