"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertBanner } from "@/components/shared/alert-banner";
import { PACKAGE_TIER_LABELS } from "@/server/admin/labels";
import type { PackageTier } from "@/generated/prisma/enums";

export function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [packageTier, setPackageTier] = useState<PackageTier>("BASIC");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, packageTier }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Firma oluşturulamadı.");
      return;
    }
    router.push(`/admin/musteriler/${body.companyId}`);
  }

  return (
    <Card>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Firma adı *</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon *</Label>
            <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+905551234567" />
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

          {error ? <AlertBanner tone="danger" title={error} /> : null}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Oluşturuluyor..." : "Firma Oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
