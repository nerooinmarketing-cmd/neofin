"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bankInfoSchema, type BankInfoInput } from "@/server/onboarding/schemas";
import { useDraftAutosave } from "@/components/onboarding/use-draft-autosave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/shared/alert-banner";

export interface BankStepDefaults {
  bankName: string | null;
  branchName: string | null;
  customerNumber: string | null;
  note: string | null;
}

export interface BankStepProps {
  defaultValues: BankStepDefaults;
  draft: Partial<BankInfoInput> | null;
  onNext: () => void;
}

export function BankStep({ defaultValues, draft, onNext }: BankStepProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BankInfoInput>({
    resolver: zodResolver(bankInfoSchema),
    defaultValues: {
      bankName: defaultValues.bankName ?? "",
      branchName: defaultValues.branchName ?? "",
      customerNumber: defaultValues.customerNumber ?? "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      note: defaultValues.note ?? "",
      ...draft,
    },
  });

  useDraftAutosave(form.watch(), true);

  async function onSubmit(values: BankInfoInput) {
    setSubmitError(null);
    const res = await fetch("/api/onboarding/step-2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setSubmitError("Banka bilgileri kaydedilemedi. Lütfen alanları kontrol edin.");
      return;
    }
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banka Ekleme</CardTitle>
        <CardDescription>
          POS&apos;unuzun bağlı olduğu ilk bankayı ekleyin — sonradan Bankalar
          ekranından yenilerini ekleyebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bankName">Banka adı *</Label>
              <Input id="bankName" placeholder="örn. Akbank" {...form.register("bankName")} />
              {form.formState.errors.bankName ? (
                <p className="text-xs text-danger">{form.formState.errors.bankName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branchName">Şube adı</Label>
              <Input id="branchName" {...form.register("branchName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerNumber">Müşteri numarası</Label>
              <Input id="customerNumber" {...form.register("customerNumber")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Banka yetkilisi</Label>
              <Input id="contactName" {...form.register("contactName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Yetkili telefon</Label>
              <Input id="contactPhone" inputMode="tel" {...form.register("contactPhone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Yetkili e-posta</Label>
              <Input id="contactEmail" type="email" {...form.register("contactEmail")} />
              {form.formState.errors.contactEmail ? (
                <p className="text-xs text-danger">{form.formState.errors.contactEmail.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="note">Not</Label>
              <Input id="note" {...form.register("note")} />
            </div>
          </div>

          {submitError ? <AlertBanner tone="danger" title={submitError} /> : null}

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            İleri
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
