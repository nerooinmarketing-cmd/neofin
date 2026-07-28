"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { posInfoSchema, type PosInfoInput } from "@/server/onboarding/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertBanner } from "@/components/shared/alert-banner";
import { cn } from "@/lib/utils";

const POS_TYPES: { value: PosInfoInput["posType"]; label: string }[] = [
  { value: "PHYSICAL", label: "Fiziksel" },
  { value: "VIRTUAL", label: "Sanal" },
  { value: "MOBILE", label: "Mobil" },
  { value: "QR", label: "QR" },
];

export function PosCreateForm({ bankId, bankReturnPath }: { bankId: string; bankReturnPath: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.input<typeof posInfoSchema>, unknown, z.output<typeof posInfoSchema>>({
    resolver: zodResolver(posInfoSchema),
    defaultValues: {
      posType: "PHYSICAL",
      posName: "",
      terminalNo: "",
      merchantNo: "",
      isActive: true,
    },
  });

  async function onSubmit(values: PosInfoInput) {
    setSubmitError(null);
    const res = await fetch("/api/pos-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, bankId }),
    });
    if (!res.ok) {
      setSubmitError("POS kaydedilemedi. Lütfen alanları kontrol edin.");
      return;
    }
    router.push(bankReturnPath);
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>POS türü *</Label>
            <Controller
              control={form.control}
              name="posType"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {POS_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => field.onChange(type.value)}
                      className={cn(
                        "min-h-12 rounded-lg border px-4 text-sm font-medium transition-colors",
                        field.value === type.value
                          ? "border-primary bg-accent text-primary"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="posName">POS adı *</Label>
              <Input id="posName" placeholder="örn. POS-02 · Şube" {...form.register("posName")} />
              {form.formState.errors.posName ? (
                <p className="text-xs text-danger">{form.formState.errors.posName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="terminalNo">Terminal numarası *</Label>
              <Input id="terminalNo" {...form.register("terminalNo")} />
              {form.formState.errors.terminalNo ? (
                <p className="text-xs text-danger">{form.formState.errors.terminalNo.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="merchantNo">Üye işyeri numarası *</Label>
              <Input id="merchantNo" {...form.register("merchantNo")} />
              {form.formState.errors.merchantNo ? (
                <p className="text-xs text-danger">{form.formState.errors.merchantNo.message}</p>
              ) : null}
            </div>
          </div>

          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={(v) => field.onChange(!!v)}
                />
                Bu POS şu anda aktif kullanımda
              </label>
            )}
          />

          {submitError ? <AlertBanner tone="danger" title={submitError} /> : null}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
            POS&apos;u Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
