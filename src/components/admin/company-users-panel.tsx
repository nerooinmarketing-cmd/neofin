"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBanner } from "@/components/shared/alert-banner";
import type { CompanyUserRole } from "@/generated/prisma/enums";

export interface CompanyUserItem {
  id: string;
  name: string;
  role: CompanyUserRole;
  isActive: boolean;
  telegramLinked: boolean;
}

const ROLE_LABELS: Record<CompanyUserRole, string> = {
  OWNER: "Sahip",
  MANAGER: "Yönetici",
  ACCOUNTANT: "Muhasebe",
};

export function CompanyUsersPanel({ companyId, users }: { companyId: string; users: CompanyUserItem[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<CompanyUserRole>("MANAGER");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [pairingLink, setPairingLink] = useState<{ userId: string; link: string | null; token: string } | null>(null);

  async function addUser() {
    if (!name.trim()) return;
    await fetch(`/api/admin/companies/${companyId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role }),
    });
    setName("");
    router.refresh();
  }

  async function deactivate(userId: string) {
    setBusyUserId(userId);
    await fetch(`/api/admin/companies/${companyId}/users/${userId}/deactivate`, { method: "POST" });
    setBusyUserId(null);
    router.refresh();
  }

  async function promote(userId: string) {
    setBusyUserId(userId);
    await fetch(`/api/admin/companies/${companyId}/users/${userId}/promote`, { method: "POST" });
    setBusyUserId(null);
    router.refresh();
  }

  async function generatePairing(userId: string) {
    setBusyUserId(userId);
    const res = await fetch(`/api/admin/companies/${companyId}/pairing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyUserId: userId }),
    });
    const body = await res.json();
    setBusyUserId(null);
    if (res.ok) setPairingLink({ userId, link: body.deepLink, token: body.token });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-foreground">Kullanıcılar</p>

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                  <StatusBadge label={ROLE_LABELS[u.role]} tone="neutral" />
                  <StatusBadge label={u.isActive ? "Aktif" : "Pasif"} tone={u.isActive ? "success" : "danger"} />
                  <StatusBadge label={u.telegramLinked ? "Telegram bağlı" : "Telegram bağlı değil"} tone={u.telegramLinked ? "success" : "warning"} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.role !== "OWNER" ? (
                    <Button size="sm" variant="outline" onClick={() => promote(u.id)} disabled={busyUserId === u.id}>
                      Firma Yöneticisi Ata
                    </Button>
                  ) : null}
                  {u.isActive ? (
                    <Button size="sm" variant="outline" onClick={() => deactivate(u.id)} disabled={busyUserId === u.id}>
                      Pasife Al
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => generatePairing(u.id)} disabled={busyUserId === u.id}>
                    Telegram Eşleştirme Kodu
                  </Button>
                </div>
              </div>
              {pairingLink?.userId === u.id ? (
                <div className="mt-2">
                  <AlertBanner
                    tone="info"
                    title="Eşleştirme bağlantısı oluşturuldu (15 dakika geçerli)"
                    description={pairingLink.link ?? `Token: ${pairingLink.token} (TELEGRAM_BOT_USERNAME tanımlı değil — bağlantı üretilemedi)`}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="newUserName">Yeni kullanıcı adı</Label>
            <Input id="newUserName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CompanyUserRole)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addUser} disabled={!name.trim()}>
            Kullanıcı Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
