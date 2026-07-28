"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { actualPaymentFormSchema } from "@/server/actual-payment/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { FileUploader } from "@/components/shared/file-uploader";
import { AlertBanner } from "@/components/shared/alert-banner";
import type { StatusTone } from "@/components/shared/status-badge";

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

const STATUS_TONE: Record<string, StatusTone> = {
  MATCHED: "success",
  DELAYED: "warning",
  NEEDS_REVIEW: "warning",
  DIFFERENCE_FOUND: "danger",
  PARTIALLY_PAID: "warning",
};

export function ActualPaymentForm({
  expectedPaymentId,
  defaultAmount,
}: {
  expectedPaymentId: string;
  defaultAmount: number;
}) {
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const form = useForm<
    z.input<typeof actualPaymentFormSchema>,
    unknown,
    z.output<typeof actualPaymentFormSchema>
  >({
    resolver: zodResolver(actualPaymentFormSchema),
    defaultValues: {
      expectedPaymentId,
      receivedAmount: defaultAmount,
      receivedDate: new Date(),
      bankDescription: "",
      roundingTolerance: 1,
    },
  });

  async function onSubmit(values: z.output<typeof actualPaymentFormSchema>) {
    setSubmitError(null);
    setResult(null);

    const formData = new FormData();
    formData.set(
      "data",
      JSON.stringify({
        ...values,
        expectedPaymentId,
        receivedDate: values.receivedDate.toISOString(),
      }),
    );
    if (documentFiles[0]) formData.set("document", documentFiles[0]);

    const res = await fetch("/api/odemeler/gerceklesen", { method: "POST", body: formData });
    const body = await res.json();
    if (!res.ok) {
      setSubmitError(body.error ?? "Kaydedilemedi.");
      return;
    }
    setResult({ status: body.status, message: body.message });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="receivedAmount"
            render={({ field }) => (
              <CurrencyInput
                label="Hesaba geçen tutar"
                required
                value={field.value as number | undefined}
                onValueChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="receivedDate"
            render={({ field }) => (
              <DateInput
                label="Geçiş tarihi"
                required
                value={field.value ? toLocalDateInputValue(field.value as Date) : ""}
                onValueChange={(v) => field.onChange(parseLocalDateInput(v))}
              />
            )}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bankDescription">Banka açıklaması</Label>
            <Input id="bankDescription" {...form.register("bankDescription")} />
          </div>
          <Controller
            control={form.control}
            name="roundingTolerance"
            render={({ field }) => (
              <CurrencyInput
                label="Yuvarlama toleransı"
                value={field.value as number | undefined}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>

        <FileUploader
          label="Dekont/ekstre (isteğe bağlı)"
          value={documentFiles}
          onValueChange={setDocumentFiles}
        />

        {submitError ? <AlertBanner tone="danger" title={submitError} /> : null}
        {result ? (
          <AlertBanner tone={STATUS_TONE[result.status] ?? "info"} title={result.message} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="lg"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {result ? (
            <Button asChild size="lg" variant="outline">
              <Link href="/odemeler/beklenen">Beklenen Ödemelere Dön</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
