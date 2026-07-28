"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tariffInfoSchema, type TariffInfoInput } from "@/server/onboarding/schemas";
import { useDraftAutosave } from "@/components/onboarding/use-draft-autosave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { FileUploader } from "@/components/shared/file-uploader";
import { AlertBanner } from "@/components/shared/alert-banner";

const DEFAULT_INSTALLMENT_RATES = Array.from({ length: 11 }, (_, i) => ({
  installmentCount: i + 2,
  commissionRate: 0,
  valorDays: 2,
}));

/** "YYYY-MM-DD" <-> Date, hep YEREL takvim günü üzerinden (UTC kaymasını önler). */
function parseLocalDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface TariffStepProps {
  draft: Partial<TariffInfoInput> | null;
  onNext: () => void;
}

export function TariffStep({ draft, onNext }: TariffStepProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const form = useForm<
    z.input<typeof tariffInfoSchema>,
    unknown,
    z.output<typeof tariffInfoSchema>
  >({
    resolver: zodResolver(tariffInfoSchema),
    defaultValues: {
      campaignName: "",
      startDate: new Date(),
      nextDayRate: 0,
      valor2DayRate: undefined,
      valor7DayRate: undefined,
      foreignCardRate: undefined,
      commercialCardRate: undefined,
      installmentRates: DEFAULT_INSTALLMENT_RATES,
      monthlyFee: undefined,
      hasStamp: false,
      hasSignature: false,
      verifiedByUser: false,
      ...draft,
    },
  });

  useDraftAutosave(form.watch(), true);

  async function onSubmit(values: TariffInfoInput) {
    setSubmitError(null);

    const formData = new FormData();
    if (values.campaignName) formData.set("campaignName", values.campaignName);
    formData.set("startDate", new Date(values.startDate).toISOString());
    formData.set("nextDayRate", String(values.nextDayRate));
    if (values.valor2DayRate !== undefined) formData.set("valor2DayRate", String(values.valor2DayRate));
    if (values.valor7DayRate !== undefined) formData.set("valor7DayRate", String(values.valor7DayRate));
    if (values.foreignCardRate !== undefined)
      formData.set("foreignCardRate", String(values.foreignCardRate));
    if (values.commercialCardRate !== undefined)
      formData.set("commercialCardRate", String(values.commercialCardRate));
    formData.set("installmentRates", JSON.stringify(values.installmentRates));
    if (values.monthlyFee !== undefined) formData.set("monthlyFee", String(values.monthlyFee));
    formData.set("hasStamp", String(values.hasStamp));
    formData.set("hasSignature", String(values.hasSignature));
    formData.set("verifiedByUser", String(values.verifiedByUser));
    if (documentFiles[0]) formData.set("document", documentFiles[0]);

    const res = await fetch("/api/onboarding/step-4", { method: "POST", body: formData });
    if (!res.ok) {
      setSubmitError("Tarife kaydedilemedi. Lütfen alanları kontrol edin.");
      return;
    }
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resmî Tarife Girişi</CardTitle>
        <CardDescription>
          Bankanız tarafından doldurulmuş ve kaşelenmiş POS Bilgi Formundaki
          verileri bu ekrana bir kez girin. Sistem tüm hesaplamaları bu resmî
          bilgiler üzerinden yapacaktır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaignName">Kampanya / tarife adı</Label>
              <Input id="campaignName" {...form.register("campaignName")} />
            </div>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DateInput
                  label="Tarife başlangıç tarihi"
                  required
                  value={
                    field.value
                      ? toLocalDateInputValue(field.value as Date)
                      : ""
                  }
                  onValueChange={(v) => field.onChange(parseLocalDateInput(v))}
                />
              )}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tek çekim oranları (%)</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="nextDayRate">Ertesi gün *</Label>
                <Input id="nextDayRate" type="number" step="0.01" {...form.register("nextDayRate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor2DayRate">2 gün valör</Label>
                <Input id="valor2DayRate" type="number" step="0.01" {...form.register("valor2DayRate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor7DayRate">7 gün valör</Label>
                <Input id="valor7DayRate" type="number" step="0.01" {...form.register("valor7DayRate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="foreignCardRate">Yabancı kart</Label>
                <Input id="foreignCardRate" type="number" step="0.01" {...form.register("foreignCardRate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commercialCardRate">Ticari kart</Label>
                <Input
                  id="commercialCardRate"
                  type="number"
                  step="0.01"
                  {...form.register("commercialCardRate")}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Taksit oranları — komisyon % / valör gün
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEFAULT_INSTALLMENT_RATES.map((row, index) => (
                <div key={row.installmentCount} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-sm text-muted-foreground">
                    {row.installmentCount} taksit
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    aria-label={`${row.installmentCount} taksit komisyon oranı`}
                    {...form.register(`installmentRates.${index}.commissionRate`)}
                  />
                  <Input
                    type="number"
                    aria-label={`${row.installmentCount} taksit valör günü`}
                    className="w-20"
                    {...form.register(`installmentRates.${index}.valorDays`)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Controller
            control={form.control}
            name="monthlyFee"
            render={({ field }) => (
              <CurrencyInput
                label="Aylık POS ücreti (ek ücretler)"
                value={field.value as number | undefined}
                onValueChange={field.onChange}
              />
            )}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Belge ve onay</p>
            <FileUploader
              label="Banka POS Bilgi Formu (fotoğraf/PDF)"
              value={documentFiles}
              onValueChange={setDocumentFiles}
            />
            <div className="flex flex-wrap gap-4">
              <Controller
                control={form.control}
                name="hasStamp"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={field.value as boolean} onCheckedChange={(v) => field.onChange(!!v)} />
                    Kaşe mevcut
                  </label>
                )}
              />
              <Controller
                control={form.control}
                name="hasSignature"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={field.value as boolean} onCheckedChange={(v) => field.onChange(!!v)} />
                    İmza mevcut
                  </label>
                )}
              />
              <Controller
                control={form.control}
                name="verifiedByUser"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={field.value as boolean} onCheckedChange={(v) => field.onChange(!!v)} />
                    Belgeyi kontrol ettim, bilgiler doğru
                  </label>
                )}
              />
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
