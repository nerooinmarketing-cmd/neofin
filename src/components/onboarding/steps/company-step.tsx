"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyInfoSchema, type CompanyInfoInput } from "@/server/onboarding/schemas";
import { useDraftAutosave } from "@/components/onboarding/use-draft-autosave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/shared/currency-input";
import { AlertBanner } from "@/components/shared/alert-banner";

export interface CompanyStepDefaults {
  name: string | null;
  shortName: string | null;
  taxNumber: string | null;
  contactName: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  district: string | null;
  sector: string | null;
  estimatedAnnualVolume: number | null;
  branchCount: number;
}

export interface CompanyStepProps {
  defaultValues: CompanyStepDefaults;
  draft: Partial<CompanyInfoInput> | null;
  onNext: () => void;
}

export function CompanyStep({ defaultValues, draft, onNext }: CompanyStepProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<
    z.input<typeof companyInfoSchema>,
    unknown,
    z.output<typeof companyInfoSchema>
  >({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: defaultValues.name ?? "",
      shortName: defaultValues.shortName ?? "",
      taxNumber: defaultValues.taxNumber ?? "",
      contactName: defaultValues.contactName ?? "",
      phone: defaultValues.phone ?? "",
      email: defaultValues.email ?? "",
      city: defaultValues.city ?? "",
      district: defaultValues.district ?? "",
      sector: defaultValues.sector ?? "",
      estimatedAnnualVolume: defaultValues.estimatedAnnualVolume ?? undefined,
      branchCount: defaultValues.branchCount ?? 1,
      ...draft,
    },
  });

  useDraftAutosave(form.watch(), true);

  async function onSubmit(values: CompanyInfoInput) {
    setSubmitError(null);
    const res = await fetch("/api/onboarding/step-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setSubmitError("Bilgiler kaydedilemedi. Lütfen alanları kontrol edin.");
      return;
    }
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firma Bilgileri</CardTitle>
        <CardDescription>
          Firmanızın temel bilgilerini girin. Bu bilgiler raporlarınızda kullanılacak.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Firma unvanı *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortName">Kısa firma adı *</Label>
              <Input id="shortName" {...form.register("shortName")} />
              {form.formState.errors.shortName ? (
                <p className="text-xs text-danger">{form.formState.errors.shortName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxNumber">Vergi numarası *</Label>
              <Input id="taxNumber" inputMode="numeric" {...form.register("taxNumber")} />
              {form.formState.errors.taxNumber ? (
                <p className="text-xs text-danger">{form.formState.errors.taxNumber.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Yetkili kişi *</Label>
              <Input id="contactName" {...form.register("contactName")} />
              {form.formState.errors.contactName ? (
                <p className="text-xs text-danger">{form.formState.errors.contactName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon *</Label>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-xs text-danger">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta *</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">İl *</Label>
              <Input id="city" {...form.register("city")} />
              {form.formState.errors.city ? (
                <p className="text-xs text-danger">{form.formState.errors.city.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district">İlçe *</Label>
              <Input id="district" {...form.register("district")} />
              {form.formState.errors.district ? (
                <p className="text-xs text-danger">{form.formState.errors.district.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector">Sektör *</Label>
              <Input id="sector" {...form.register("sector")} />
              {form.formState.errors.sector ? (
                <p className="text-xs text-danger">{form.formState.errors.sector.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branchCount">Şube sayısı *</Label>
              <Input id="branchCount" type="number" min={1} {...form.register("branchCount")} />
            </div>
            <Controller
              control={form.control}
              name="estimatedAnnualVolume"
              render={({ field }) => (
                <CurrencyInput
                  label="Yıllık yaklaşık POS cirosu"
                  value={field.value as number | undefined}
                  onValueChange={field.onChange}
                />
              )}
            />
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
