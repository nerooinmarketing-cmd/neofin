"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBanner } from "@/components/shared/alert-banner";
import { formatCurrency, formatDate } from "@/lib/format";

export interface ReviewStepData {
  bankName: string;
  posName: string;
  terminalNo: string;
  nextDayRate: number;
  installmentRates: { installmentCount: number; commissionRate: number; valorDays: number }[];
  monthlyFee: number | null;
  startDate: string;
  documentUrl: string | null;
  hasStamp: boolean;
  hasSignature: boolean;
}

export interface ReviewStepProps {
  data: ReviewStepData;
  onCompleted: () => void;
}

export function ReviewStep({ data, onCompleted }: ReviewStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding/complete", { method: "POST" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Kurulum tamamlanamadı.");
      setLoading(false);
      return;
    }
    onCompleted();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol ve Onay</CardTitle>
        <CardDescription>
          Girdiğiniz bilgileri kontrol edin. Onayladıktan sonra sistem gerçek
          verilerinizle çalışmaya başlayacak.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Banka</dt>
            <dd className="font-medium text-foreground">{data.bankName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">POS</dt>
            <dd className="font-medium text-foreground">
              {data.posName} · {data.terminalNo}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tek çekim oranı</dt>
            <dd className="tabular-money font-medium text-foreground">
              %{data.nextDayRate.toLocaleString("tr-TR")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tarife başlangıç tarihi</dt>
            <dd className="font-medium text-foreground">{formatDate(data.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ek ücretler</dt>
            <dd className="tabular-money font-medium text-foreground">
              {data.monthlyFee ? formatCurrency(data.monthlyFee) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Belge durumu</dt>
            <dd>
              <StatusBadge
                tone={data.hasStamp && data.hasSignature ? "success" : "warning"}
                label={
                  data.hasStamp && data.hasSignature
                    ? "Kaşe ve imza mevcut"
                    : "Kaşe/imza eksik olabilir"
                }
              />
            </dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Taksit oranları</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {data.installmentRates.map((rate) => (
              <div
                key={rate.installmentCount}
                className="rounded-lg border border-border bg-card p-2 text-center"
              >
                <p className="text-xs text-muted-foreground">{rate.installmentCount} taksit</p>
                <p className="text-sm font-semibold text-foreground">
                  %{rate.commissionRate.toLocaleString("tr-TR")}
                </p>
                <p className="text-[11px] text-muted-foreground">{rate.valorDays} gün valör</p>
              </div>
            ))}
          </div>
        </div>

        {data.documentUrl ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Belge görüntüsü</p>
            {/https?:.*\.(png|jpe?g|webp)$/i.test(data.documentUrl) ? (
              <Image
                src={data.documentUrl}
                alt="Yüklenen tarife belgesi"
                width={240}
                height={160}
                className="rounded-lg border border-border object-cover"
              />
            ) : (
              <a
                href={data.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                Belgeyi görüntüle
              </a>
            )}
          </div>
        ) : null}

        {error ? <AlertBanner tone="danger" title={error} /> : null}

        <Button size="lg" className="w-full" onClick={handleConfirm} disabled={loading}>
          {loading ? "İşleniyor..." : "Bilgileri Onayla ve Sistemi Başlat"}
        </Button>
      </CardContent>
    </Card>
  );
}
