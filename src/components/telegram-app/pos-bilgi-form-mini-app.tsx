"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tariffFormSchema, type TariffFormInput } from "@/server/tariff/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { FileUploader } from "@/components/shared/file-uploader";
import { AlertBanner } from "@/components/shared/alert-banner";

interface BankOption {
  id: string;
  name: string;
}
interface PosOption {
  id: string;
  name: string;
  bankId: string;
}

const STEP_LABELS = [
  "Kimlik",
  "Tek Çekim",
  "Taksit",
  "Kart/İşlem Türleri",
  "Sabit Ücretler",
  "Valör ve Ödeme",
  "Taahhütler",
  "Belge ve Onay",
];

const DEFAULT_INSTALLMENT_RATES = Array.from({ length: 11 }, (_, i) => ({
  installmentCount: i + 2,
  commissionRate: 0,
  valorDays: 2,
}));

const STEP_FIELDS: Record<number, Path<TariffFormInput>[]> = {
  1: ["campaignName", "startDate", "bankOfficerName", "documentDate"],
  2: ["nextDayRate", "valor2DayRate", "valor7DayRate", "blockedConditionNote", "foreignCardRate", "commercialCardRate"],
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
  6: ["paymentDay", "holidayPaymentRule", "weekendPaymentDay", "partialPaymentRule", "blockDurationDays", "blockReleaseCondition"],
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

function CheckboxField({
  name,
  label,
  form,
}: {
  name: keyof TariffFormInput;
  label: string;
  form: ReturnType<typeof useTariffForm>;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={field.value as boolean} onCheckedChange={(v) => field.onChange(!!v)} />
          {label}
        </label>
      )}
    />
  );
}

type Phase = "loading" | "pick-bank" | "pick-pos" | "wizard" | "submitting" | "success" | "error";

export function PosBilgiFormMiniApp({ initData }: { initData: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [posDevices, setPosDevices] = useState<PosOption[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [selectedPos, setSelectedPos] = useState<PosOption | null>(null);
  const [step, setStep] = useState(1);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useTariffForm();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/telegram-app/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Hesabınız doğrulanamadı.");
        }
        return res.json() as Promise<{ banks: BankOption[]; posDevices: PosOption[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setBanks(data.banks);
        setPosDevices(data.posDevices);
        setPhase("pick-bank");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorMessage(error.message);
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [initData]);

  async function handleNext() {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(STEP_LABELS.length, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(values: TariffFormInput) {
    setSubmitError(null);
    setPhase("submitting");

    const formData = new FormData();
    formData.set("initData", initData);
    formData.set("posId", selectedPos!.id);
    formData.set("bankId", selectedBank!.id);
    formData.set("data", JSON.stringify(values));
    if (documentFiles[0]) formData.set("document", documentFiles[0]);

    const res = await fetch("/api/telegram-app/tariffs", { method: "POST", body: formData });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(body?.error ?? "Tarife kaydedilemedi.");
      setPhase("wizard");
      return;
    }
    setPhase("success");
  }

  if (phase === "loading") {
    return <CenteredMessage text="Yükleniyor..." />;
  }

  if (phase === "error") {
    return <CenteredMessage text={errorMessage ?? "Bir hata oluştu."} tone="danger" />;
  }

  if (phase === "success") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <AlertBanner tone="success" title="Tarife kaydedildi" description="Bu sekmeyi kapatabilirsiniz." />
        <Button size="lg" className="w-full" onClick={() => window.Telegram?.WebApp?.close()}>
          Kapat
        </Button>
      </div>
    );
  }

  if (phase === "pick-bank") {
    if (banks.length === 0) {
      return (
        <CenteredMessage
          text="Kayıtlı banka bulunamadı. Önce Telegram'da &quot;➕ Yeni POS&quot; ile veya panelden bir banka ekleyin."
          tone="danger"
        />
      );
    }
    return (
      <div className="mx-auto max-w-lg space-y-3 p-4">
        <h1 className="font-heading text-lg font-semibold text-foreground">POS Bilgi Formu</h1>
        <p className="text-sm text-muted-foreground">Hangi bankaya ait tarifeyi gireceksiniz?</p>
        <div className="space-y-2">
          {banks.map((bank) => (
            <Button
              key={bank.id}
              variant="outline"
              size="lg"
              className="w-full justify-start"
              onClick={() => {
                setSelectedBank(bank);
                setPhase("pick-pos");
              }}
            >
              {bank.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "pick-pos") {
    const filtered = posDevices.filter((p) => p.bankId === selectedBank!.id);
    if (filtered.length === 0) {
      return (
        <CenteredMessage
          text={`"${selectedBank!.name}" bankasına bağlı POS bulunamadı. Önce Telegram'da "➕ Yeni POS" ile ekleyin.`}
          tone="danger"
        />
      );
    }
    return (
      <div className="mx-auto max-w-lg space-y-3 p-4">
        <h1 className="font-heading text-lg font-semibold text-foreground">POS Bilgi Formu</h1>
        <p className="text-sm text-muted-foreground">{selectedBank!.name} — hangi POS için?</p>
        <div className="space-y-2">
          {filtered.map((pos) => (
            <Button
              key={pos.id}
              variant="outline"
              size="lg"
              className="w-full justify-start"
              onClick={() => {
                setSelectedPos(pos);
                setPhase("wizard");
              }}
            >
              {pos.name}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPhase("pick-bank")}>
          ← Banka seçimine dön
        </Button>
      </div>
    );
  }

  // phase === "wizard" | "submitting"
  return (
    <div className="mx-auto max-w-lg p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Bölüm {step} / {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
          </CardTitle>
          <CardDescription>
            {selectedBank!.name} · {selectedPos!.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {step === 1 ? (
              <div className="grid grid-cols-1 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nextDayRate">Ertesi gün oranı (%) *</Label>
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
                  <Input id="commercialCardRate" type="number" step="0.01" {...form.register("commercialCardRate")} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="blockedConditionNote">Blokeli çalışma koşulu</Label>
                  <Input id="blockedConditionNote" {...form.register("blockedConditionNote")} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Komisyon % / valör gün / sabit ücret</p>
                <div className="space-y-2">
                  {DEFAULT_INSTALLMENT_RATES.map((row, index) => (
                    <div key={row.installmentCount} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-sm text-muted-foreground">{row.installmentCount} taksit</span>
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
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid grid-cols-1 gap-3">
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
              <div className="grid grid-cols-1 gap-4">
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="paymentDay">Ödeme günü</Label>
                  <Input id="paymentDay" placeholder="örn. Her iş günü" {...form.register("paymentDay")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weekendPaymentDay">Hafta sonu ödeme günü</Label>
                  <Input id="weekendPaymentDay" {...form.register("weekendPaymentDay")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="holidayPaymentRule">Tatil günlerinde ödeme kuralı</Label>
                  <Input id="holidayPaymentRule" {...form.register("holidayPaymentRule")} />
                </div>
                <div className="space-y-1.5">
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
                <div className="grid grid-cols-1 gap-4">
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
                <div className="flex flex-col gap-3">
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
                <div className="flex flex-col gap-3">
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
                <Button type="button" variant="outline" onClick={handleBack} disabled={phase === "submitting"}>
                  Geri
                </Button>
              ) : (
                <span />
              )}
              {step < STEP_LABELS.length ? (
                <Button type="button" onClick={handleNext}>
                  İleri
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={phase === "submitting"}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {phase === "submitting" ? "Kaydediliyor..." : "Tarifeyi Kaydet"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CenteredMessage({ text, tone }: { text: string; tone?: "danger" }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      {tone === "danger" ? (
        <AlertBanner tone="danger" title={text} />
      ) : (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
