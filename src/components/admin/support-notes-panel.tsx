"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

export interface SupportNoteItem {
  id: string;
  note: string;
  createdAt: Date;
  adminName: string | null;
}

export function SupportNotesPanel({ companyId, notes }: { companyId: string; notes: SupportNoteItem[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/companies/${companyId}/support-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() }),
    });
    setSaving(false);
    setNote("");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-foreground">Destek notları</p>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz not yok.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-accent p-3 text-sm">
                <p className="text-foreground">{n.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.adminName ?? "Sistem"} · {formatDate(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Yeni destek notu ekle"
            disabled={saving}
          />
          <Button onClick={addNote} disabled={saving || !note.trim()}>
            Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
