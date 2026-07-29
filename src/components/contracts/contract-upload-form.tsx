"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractUploadSchema, type ContractUploadInput } from "@/server/contract/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploader } from "@/components/shared/file-uploader";
import { AlertBanner } from "@/components/shared/alert-banner";

export interface ContractUploadFormProps {
  banks: { id: string; name: string }[];
  posDevices: { id: string; name: string }[];
}

export function ContractUploadForm({ banks, posDevices }: ContractUploadFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<ContractUploadInput>({
    resolver: zodResolver(contractUploadSchema),
    defaultValues: { title: "", bankId: undefined, posId: undefined },
  });

  async function onSubmit(values: ContractUploadInput) {
    setSubmitError(null);
    setFileError(null);
    if (files.length === 0) {
      setFileError("En az bir dosya (PDF/JPG/PNG) yükleyin.");
      return;
    }

    const formData = new FormData();
    formData.set("title", values.title);
    if (values.bankId) formData.set("bankId", values.bankId);
    if (values.posId) formData.set("posId", values.posId);
    files.forEach((file) => formData.append("files", file));

    const res = await fetch("/api/contracts", { method: "POST", body: formData });
    const body = await res.json();
    if (!res.ok) {
      setSubmitError(body.error ?? "Sözleşme yüklenemedi.");
      return;
    }
    router.push(`/panel/sozlesmeler/${body.id}`);
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Sözleşme başlığı *</Label>
              <Input
                id="title"
                placeholder="örn. Akbank Yeni POS Sözleşmesi"
                {...form.register("title")}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Banka (isteğe bağlı)</Label>
              <Controller
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Banka seçin" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>POS (isteğe bağlı)</Label>
              <Controller
                control={form.control}
                name="posId"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="POS seçin" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {posDevices.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <FileUploader
            label="Sözleşme sayfaları *"
            description="PDF, JPG veya PNG yükleyin, birden fazla sayfa ekleyebilir ya da fotoğraf çekebilirsiniz."
            accept="application/pdf,image/*"
            multiple
            value={files}
            onValueChange={setFiles}
            error={fileError ?? undefined}
          />

          {submitError ? <AlertBanner tone="danger" title={submitError} /> : null}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Yükleniyor..." : "Yükle ve Analiz Et"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
