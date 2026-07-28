"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tariffFormSchema, type TariffFormInput } from "@/server/tariff/schemas";
import { StepProgress, type StepDefinition } from "@/components/shared/step-progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { FileUploader } from "@/components/shared/file-uploader";
import { AlertBanner } from "@/components/shared/alert-banner";

const TARIFF_STEPS: StepDefinition[] = [
  { number: 1, label: "Kimlik" },
  { number: 2, label: "Tek Çekim" },
  { number: 3, label: "Taksit" },
  { number: 4, label: "Kart/İşlem Türleri" },
  { number: 5, label: "Sabit Ücretler" },
  { number: 6, label: "Valör ve Ödeme" },
  { number: 7, label: "Taahhütler" },
  { number: 8, label: "Belge ve Onay" },
];

const DEFAULT_INSTALLMENT_RATES = Array.from({ length: 11 }, (_, i) => ({
  installmentCount: i + 2,
  commissionRate: 0,
  valorDays: 2,
}));

const STEP_FIELDS: Record<number, Path<TariffFormInput>[]> = {
  1: ["campaignName", "startDate", "bankOfficerName", "documentDate"],
  2: [
    "nextDayRate",
    "valor2DayRate",
    "valor7DayRate",
    "blockedConditionNote",
    "foreignCardRate",
    "commercialCardRate",
  ],
  3: ["installmentRates"],
  4: [
    "ownBankCard",
    "otherBankCard",
    "commercialCardSupport",
    "foreignCardSupport",
    "loyaltyPoints",
    "refund",
    "cancellation",
    "mailOrder",
    "contactless",
    "qr",
  ],
  5: [
    "feeMonthlyPos",
    "feeDeviceMaintenance",
    "feeSimLine",
    "feeStatement",
    "feeSoftware",
    "feeInactivity",
    "feeMinVolumePenalty",
    "feeEarlyTermination",
    "feeOtherAmount",
    "feeOtherNote",
  ],
  6: [
    "paymentDay",
    "holidayPaymentRule",
    "weekendPaymentDay",
    "partialPaymentRule",
    "blockDurationDays",
    "blockReleaseCondition",
  ],
  7: [
    "monthlyVolumeCommitment",
    "annualVolumeCommitment",
    "productUsageCommitment",
    "salaryAgreementLink",
    "creditLink",
    "autoPaymentInstruction",
    "breachPenalty",
  ],
  8: [],
};

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

interface CheckboxFieldProps {
  name: keyof TariffFormInput;
  label: string;
  form: ReturnType<typeof useTariffForm>;
}

function useTariffForm() {
  return useForm<z.input<typeof tariffFormSchema>, unknown, z.output<typeof tariffFormSchema>>({
    resolver: zodResolver(tariffFormSchema),
    defaultValues: {
      campaignName: "",
      startDate: new Date(),
      bankOfficerName: "",
      nextDayRate: 0,
      installmentRates: DEFAULT_INSTALLMENT_RATES,
      ownBankCard: true,
      otherBankCard: true,
      commercialCardSupport: false,
      foreignCardSupport: false,
      loyaltyPoints: false,
      refund: true,
      cancellation: true,
      mailOrder: false,
      contactless: true,
      qr: false,
      salaryAgreementLink: false,
      creditLink: false,
      autoPaymentInstruction: false,
      hasStamp: false,
      hasSignature: false,
      verifiedByUser: false,
    },
  });
}

function CheckboxField({ name, label, form }: CheckboxFieldProps) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={field.value as boolean}
            onCheckedChange={(v) => field.onChange(!!v)}
          />
          {label}
        </label>
      )}
    />
  );
}

export interface TariffWizardProps {
  posId: string;
  bankId: string;
  posName: string;
  bankName: string;
  returnPath: string;
}

export function TariffWizard({ posId, bankId, posName, bankName, returnPath }: TariffWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useTariffForm();

  async function handleNext() {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(TARIFF_STEPS.length, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(values: TariffFormInput) {
    setSubmitError(null);
    const formData = new FormData();
    formData.set("posId", posId);
    formData.set("bankId", bankId);
    formData.set("data", JSON.stringify(values));
    if (documentFiles[0]) formData.set("document", documentFiles[0]);

    const res = await fetch("/api/tariffs", { method: "POST", body: formData });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(body?.error ?? "Tarife kaydedilemedi.");
      return;
    }
    router.push(returnPath);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="hidden w-56 shrink-0 lg:block">
        <StepProgress steps={TARIFF_STEPS} current={step} />
      </aside>

      <div className="min-w-0 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Bölüm {step} — {TARIFF_STEPS[step - 1]!.label}</CardTitle>
            <CardDescription>
              {bankName} · {posName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Native <form> submit'e bağlı değil — çok adımlı akışta ara
                "İleri" tıklamalarının yanlışlıkla submit tetiklemesini
                önlemek için son adımda handleSubmit doğrudan onClick'ten
                çağrılır. */}
            <div className="space-y-6">
              {step === 1 ? (
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
                        value={field.value ? toLocalDateInputValue(field.value as Date) : ""}
                        onValueChange={(v) => field.onChange(parseLocalDateInput(v))}
                      />
                    )}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="bankOfficerName">Banka yetkilisi</Label>
                    <Input id="bankOfficerName" {...form.register("bankOfficerName")} />
                  </div>
                  <Controller
                    control={form.control}
                    name="documentDate"
                    render={({ field }) => (
                      <DateInput
                        label="Belge tarihi"
                        value={field.value ? toLocalDateInputValue(field.value as Date) : ""}
                        onValueChange={(v) => field.onChange(v ? parseLocalDateInput(v) : undefined)}
                      />
                    )}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nextDayRate">Ertesi gün ödeme oranı (%) *</Label>
                    <Input id="nextDayRate" type="number" step="0.01" {...form.register("nextDayRate")} />
                    {form.formState.errors.nextDayRate ? (
                      <p className="text-xs text-danger">{form.formState.errors.nextDayRate.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor2DayRate">2 gün valör oranı (%)</Label>
                    <Input id="valor2DayRate" type="number" step="0.01" {...form.register("valor2DayRate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor7DayRate">7 gün valör oranı (%)</Label>
                    <Input id="valor7DayRate" type="number" step="0.01" {...form.register("valor7DayRate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="foreignCardRate">Yabancı kart oranı (%)</Label>
                    <Input id="foreignCardRate" type="number" step="0.01" {...form.register("foreignCardRate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="commercialCardRate">Ticari kart oranı (%)</Label>
                    <Input
                      id="commercialCardRate"
                      type="number"
                      step="0.01"
                      {...form.register("commercialCardRate")}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="blockedConditionNote">Blokeli çalışma koşulu</Label>
                    <Input id="blockedConditionNote" {...form.register("blockedConditionNote")} />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Komisyon % / valör gün / sabit ücret</p>
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
                          className="w-16"
                          {...form.register(`installmentRates.${index}.valorDays`)}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          aria-label={`${row.installmentCount} taksit sabit ücret`}
                          className="w-24"
                          placeholder="Sabit ücret"
                          {...form.register(`installmentRates.${index}.fixedFee`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CheckboxField name="ownBankCard" label="Bankanın kendi kartı" form={form} />
                  <CheckboxField name="otherBankCard" label="Diğer banka kartı" form={form} />
                  <CheckboxField name="commercialCardSupport" label="Ticari kart" form={form} />
                  <CheckboxField name="foreignCardSupport" label="Yurt dışı kart" form={form} />
                  <CheckboxField name="loyaltyPoints" label="Puan kullanımı" form={form} />
                  <CheckboxField name="refund" label="İade işlemi" form={form} />
                  <CheckboxField name="cancellation" label="İptal işlemi" form={form} />
                  <CheckboxField name="mailOrder" label="Mail order" form={form} />
                  <CheckboxField name="contactless" label="Temassız" form={form} />
                  <CheckboxField name="qr" label="QR" form={form} />
                </div>
              ) : null}

              {step === 5 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller control={form.control} name="feeMonthlyPos" render={({ field }) => (
                    <CurrencyInput label="Aylık POS ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeDeviceMaintenance" render={({ field }) => (
                    <CurrencyInput label="Cihaz bakım ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeSimLine" render={({ field }) => (
                    <CurrencyInput label="Hat/SIM ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeStatement" render={({ field }) => (
                    <CurrencyInput label="Ekstre ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeSoftware" render={({ field }) => (
                    <CurrencyInput label="Yazılım ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeInactivity" render={({ field }) => (
                    <CurrencyInput label="Hareketsizlik ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeMinVolumePenalty" render={({ field }) => (
                    <CurrencyInput label="Minimum ciro cezası" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeEarlyTermination" render={({ field }) => (
                    <CurrencyInput label="Erken fesih ücreti" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <Controller control={form.control} name="feeOtherAmount" render={({ field }) => (
                    <CurrencyInput label="Diğer ücret" value={field.value as number | undefined} onValueChange={field.onChange} />
                  )} />
                  <div className="space-y-1.5">
                    <Label htmlFor="feeOtherNote">Diğer ücret açıklaması</Label>
                    <Input id="feeOtherNote" {...form.register("feeOtherNote")} />
                  </div>
                </div>
              ) : null}

              {step === 6 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentDay">Ödeme günü</Label>
                    <Input id="paymentDay" placeholder="örn. Her iş günü" {...form.register("paymentDay")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weekendPaymentDay">Hafta sonu işlemlerinin ödeme günü</Label>
                    <Input id="weekendPaymentDay" {...form.register("weekendPaymentDay")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="holidayPaymentRule">Tatil günlerinde ödeme kuralı</Label>
                    <Input id="holidayPaymentRule" {...form.register("holidayPaymentRule")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="partialPaymentRule">Parçalı ödeme kuralı</Label>
                    <Input id="partialPaymentRule" {...form.register("partialPaymentRule")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="blockDurationDays">Bloke süresi (gün)</Label>
                    <Input id="blockDurationDays" type="number" {...form.register("blockDurationDays")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="blockReleaseCondition">Bloke çözüm koşulu</Label>
                    <Input id="blockReleaseCondition" {...form.register("blockReleaseCondition")} />
                  </div>
                </div>
              ) : null}

              {step === 7 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller control={form.control} name="monthlyVolumeCommitment" render={({ field }) => (
                      <CurrencyInput label="Aylık ciro taahhüdü" value={field.value as number | undefined} onValueChange={field.onChange} />
                    )} />
                    <Controller control={form.control} name="annualVolumeCommitment" render={({ field }) => (
                      <CurrencyInput label="Yıllık ciro taahhüdü" value={field.value as number | undefined} onValueChange={field.onChange} />
                    )} />
                    <Controller control={form.control} name="breachPenalty" render={({ field }) => (
                      <CurrencyInput label="Taahhüt ihlal bedeli" value={field.value as number | undefined} onValueChange={field.onChange} />
                    )} />
                    <div className="space-y-1.5">
                      <Label htmlFor="productUsageCommitment">Ürün kullanım taahhüdü</Label>
                      <Input id="productUsageCommitment" {...form.register("productUsageCommitment")} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <CheckboxField name="salaryAgreementLink" label="Maaş anlaşması bağlantısı" form={form} />
                    <CheckboxField name="creditLink" label="Kredi bağlantısı" form={form} />
                    <CheckboxField name="autoPaymentInstruction" label="Otomatik ödeme talimatı" form={form} />
                  </div>
                </div>
              ) : null}

              {step === 8 ? (
                <div className="space-y-3">
                  <FileUploader
                    label="Banka tarafından doldurulan formun fotoğrafı/PDF'i"
                    value={documentFiles}
                    onValueChange={setDocumentFiles}
                  />
                  <div className="flex flex-wrap gap-4">
                    <CheckboxField name="hasStamp" label="Kaşe mevcut" form={form} />
                    <CheckboxField name="hasSignature" label="İmza mevcut" form={form} />
                    <CheckboxField name="verifiedByUser" label="Kullanıcı doğrulaması yapıldı" form={form} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="documentNote">Notlar</Label>
                    <Input id="documentNote" {...form.register("documentNote")} />
                  </div>
                </div>
              ) : null}

              {submitError ? <AlertBanner tone="danger" title={submitError} /> : null}

              <div className="flex items-center justify-between gap-2 pt-2">
                {step > 1 ? (
                  <Button type="button" variant="outline" size="lg" onClick={handleBack}>
                    Geri
                  </Button>
                ) : (
                  <span />
                )}
                {step < TARIFF_STEPS.length ? (
                  <Button type="button" size="lg" onClick={handleNext}>
                    İleri
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    disabled={form.formState.isSubmitting}
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    Tarifeyi Kaydet
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
