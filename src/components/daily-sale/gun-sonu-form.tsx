"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { AlertBanner } from "@/components/shared/alert-banner";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

interface LineTypeOption {
  value: string;
  label: string;
  transactionType: "SINGLE" | "INSTALLMENT" | "FOREIGN_CARD" | "COMMERCIAL_CARD" | "REFUND" | "CANCEL";
  installmentCount?: number;
}

const LINE_TYPE_OPTIONS: LineTypeOption[] = [
  { value: "SINGLE", label: "Tek çekim", transactionType: "SINGLE" },
  ...Array.from({ length: 11 }, (_, i) => ({
    value: `INSTALLMENT_${i + 2}`,
    label: `${i + 2} Taksit`,
    transactionType: "INSTALLMENT" as const,
    installmentCount: i + 2,
  })),
  { value: "FOREIGN_CARD", label: "Yabancı kart", transactionType: "FOREIGN_CARD" },
  { value: "COMMERCIAL_CARD", label: "Ticari kart", transactionType: "COMMERCIAL_CARD" },
  { value: "REFUND", label: "İade", transactionType: "REFUND" },
  { value: "CANCEL", label: "İptal", transactionType: "CANCEL" },
];

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface LineFormValue {
  lineType: string;
  amount: number | undefined;
  transactionCount: number;
  cardType: string;
  note: string;
}

interface FormValues {
  saleDate: string;
  branchId: string;
  bankId: string;
  posId: string;
  lines: LineFormValue[];
}

interface SerializedLineResult {
  transactionType: string;
  installmentCount?: number;
  grossAmount: string;
  expectedCommission: string;
  fixedFee: string;
  expectedNet: string;
  valorDays: number;
  expectedPaymentDate: string;
  generatesExpectedPayment: boolean;
}

interface SerializedSummary {
  grossTotal: string;
  expectedCommissionTotal: string;
  fixedFeeTotal: string;
  expectedNetTotal: string;
  tariffVersionNumber: number;
  lines: SerializedLineResult[];
}

export interface GunSonuFormProps {
  branches: { id: string; name: string }[];
  banks: { id: string; name: string }[];
  posDevices: { id: string; name: string; bankId: string; branchId: string }[];
  defaultBranchId: string;
  defaultPosId: string;
}

export function GunSonuForm({
  branches,
  banks,
  posDevices,
  defaultBranchId,
  defaultPosId,
}: GunSonuFormProps) {
  const defaultPos = posDevices.find((p) => p.id === defaultPosId) ?? posDevices[0]!;

  const form = useForm<FormValues>({
    defaultValues: {
      saleDate: toLocalDateInputValue(new Date()),
      branchId: defaultPos.branchId ?? defaultBranchId,
      bankId: defaultPos.bankId,
      posId: defaultPos.id,
      lines: [{ lineType: "SINGLE", amount: undefined, transactionCount: 1, cardType: "", note: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  const [summary, setSummary] = useState<SerializedSummary | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const bankId = form.watch("bankId");
  const posOptions = useMemo(
    () => posDevices.filter((p) => p.bankId === bankId),
    [posDevices, bankId],
  );

  function buildPayload(values: FormValues) {
    return {
      branchId: values.branchId,
      bankId: values.bankId,
      posId: values.posId,
      saleDate: values.saleDate,
      lines: values.lines.map((line) => {
        const option = LINE_TYPE_OPTIONS.find((o) => o.value === line.lineType)!;
        return {
          transactionType: option.transactionType,
          installmentCount: option.installmentCount,
          amount: line.amount ?? 0,
          transactionCount: line.transactionCount,
          cardType: line.cardType || undefined,
          note: line.note || undefined,
        };
      }),
    };
  }

  async function handleHesapla() {
    setCalcError(null);
    setSaveMessage(null);
    setCalculating(true);
    try {
      const res = await fetch("/api/gun-sonu/hesapla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form.getValues())),
      });
      const body = await res.json();
      if (!res.ok) {
        setSummary(null);
        setCalcError(body.error ?? "Hesaplama yapılamadı.");
        return;
      }
      setSummary(body.summary);
    } catch {
      setCalcError("Hesaplama yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setCalculating(false);
    }
  }

  async function handleKaydet() {
    setCalcError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/gun-sonu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form.getValues())),
      });
      const body = await res.json();
      if (!res.ok) {
        setCalcError(body.error ?? "Gün sonu kaydedilemedi.");
        return;
      }
      const resultSummary = body.summary as SerializedSummary;
      setSummary(resultSummary);

      const parts = resultSummary.lines
        .filter((l) => l.generatesExpectedPayment)
        .map((l) => {
          const option = LINE_TYPE_OPTIONS.find(
            (o) =>
              o.transactionType === l.transactionType &&
              (o.transactionType !== "INSTALLMENT" || o.installmentCount === l.installmentCount),
          );
          return `${formatCurrency(Number(l.grossAmount))} ${option?.label ?? l.transactionType} satışın ${formatDate(l.expectedPaymentDate)}'ta hesabınıza geçmesi bekleniyor.`;
        });
      setSaveMessage(`Gün sonu kaydedildi. ${parts.join(" ")}`);

      form.reset({
        ...form.getValues(),
        lines: [{ lineType: "SINGLE", amount: undefined, transactionCount: 1, cardType: "", note: "" }],
      });
    } catch {
      setCalcError("Gün sonu kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Controller
            control={form.control}
            name="saleDate"
            render={({ field }) => (
              <DateInput label="Tarih" required value={field.value} onValueChange={field.onChange} />
            )}
          />
          <div className="space-y-1.5">
            <Label>Şube</Label>
            <Controller
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Banka</Label>
            <Controller
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const firstPos = posDevices.find((p) => p.bankId === value);
                    if (firstPos) form.setValue("posId", firstPos.id);
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>POS</Label>
            <Controller
              control={form.control}
              name="posId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {posOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Satışlar</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({ lineType: "SINGLE", amount: undefined, transactionCount: 1, cardType: "", note: "" })
            }
          >
            <Plus className="size-4" />
            Satış Türü Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-end"
            >
              <div className="space-y-1.5 sm:col-span-3">
                <Label>İşlem türü</Label>
                <Controller
                  control={form.control}
                  name={`lines.${index}.lineType`}
                  render={({ field: lineTypeField }) => (
                    <Select value={lineTypeField.value} onValueChange={lineTypeField.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LINE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="sm:col-span-3">
                <Controller
                  control={form.control}
                  name={`lines.${index}.amount`}
                  render={({ field: amountField }) => (
                    <CurrencyInput
                      label="Toplam tutar"
                      required
                      value={amountField.value}
                      onValueChange={amountField.onChange}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>İşlem adedi</Label>
                <Input type="number" min={1} {...form.register(`lines.${index}.transactionCount`)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Kart türü</Label>
                <Input {...form.register(`lines.${index}.cardType`)} />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Not</Label>
                <Input {...form.register(`lines.${index}.note`)} />
              </div>
              <div className="flex sm:col-span-1 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label="Satırı kaldır"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {calcError ? <AlertBanner tone="danger" title={calcError} /> : null}
      {saveMessage ? <AlertBanner tone="success" title={saveMessage} /> : null}

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Beklenen Sonuç — Sürüm {summary.tariffVersionNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Brüt satış</dt>
                <dd className="tabular-money text-lg font-semibold text-foreground">
                  {formatCurrency(Number(summary.grossTotal))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Beklenen komisyon</dt>
                <dd className="tabular-money text-lg font-semibold text-foreground">
                  {formatCurrency(Number(summary.expectedCommissionTotal))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sabit ücret</dt>
                <dd className="tabular-money text-lg font-semibold text-foreground">
                  {formatCurrency(Number(summary.fixedFeeTotal))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Net ödeme</dt>
                <dd className="tabular-money text-lg font-semibold text-primary">
                  {formatCurrency(Number(summary.expectedNetTotal))}
                </dd>
              </div>
            </dl>
            <div className="space-y-2">
              {summary.lines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatCurrency(Number(line.grossAmount))} —{" "}
                    {line.generatesExpectedPayment
                      ? `${formatDate(line.expectedPaymentDate)} tarihinde hesaba geçmesi bekleniyor`
                      : "ödeme oluşturmaz"}
                  </span>
                  <span className="tabular-money font-medium text-foreground">
                    {formatCurrency(Number(line.expectedNet))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="outline" onClick={handleHesapla} disabled={calculating}>
          {calculating ? "Hesaplanıyor..." : "Hesapla"}
        </Button>
        <Button type="button" size="lg" onClick={handleKaydet} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Gün Sonunu Kaydet"}
        </Button>
      </div>
    </div>
  );
}
