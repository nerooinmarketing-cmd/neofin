"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

interface OwnProfileValues {
  name: string;
  email: string;
  phone: string;
}

export function OwnProfileForm({ defaultValues }: { defaultValues: OwnProfileValues }) {
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const form = useForm<OwnProfileValues>({ defaultValues });

  async function onSubmit(values: OwnProfileValues) {
    setMessage(null);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage({ tone: "danger", text: body?.error ?? "Bilgiler kaydedilemedi." });
      return;
    }
    setMessage({ tone: "success", text: "Bilgileriniz güncellendi." });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hesabım</CardTitle>
        <CardDescription>Kendi ad, e-posta ve telefon bilgilerinizi güncelleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ownName">Ad Soyad *</Label>
              <Input id="ownName" {...form.register("name", { required: true, minLength: 2 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownEmail">E-posta</Label>
              <Input id="ownEmail" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownPhone">Telefon</Label>
              <Input id="ownPhone" inputMode="tel" {...form.register("phone")} />
            </div>
          </div>

          {message ? <AlertBanner tone={message.tone} title={message.text} /> : null}

          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
