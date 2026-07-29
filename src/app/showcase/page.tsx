"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { BankCard } from "@/components/shared/bank-card";
import { PosCard } from "@/components/shared/pos-card";
import { PaymentCard } from "@/components/shared/payment-card";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { AlertBanner } from "@/components/shared/alert-banner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CardListSkeleton,
  StatGridSkeleton,
} from "@/components/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DateInput } from "@/components/shared/date-input";
import { FileUploader } from "@/components/shared/file-uploader";
import { formatCurrency } from "@/lib/format";
import { mockBanks, mockPendingPayments, mockPosDevices } from "@/lib/mock-data";
import { Wallet } from "lucide-react";

const tones: { tone: StatusTone; label: string }[] = [
  { tone: "success", label: "Uyumlu" },
  { tone: "warning", label: "Kontrol edilmeli" },
  { tone: "danger", label: "Fark bulundu" },
  { tone: "info", label: "Bilgilendirme" },
  { tone: "neutral", label: "Veri yok" },
];

const swatches = [
  { name: "Navy", varName: "--navy", hex: "#11213A" },
  { name: "Primary", varName: "--primary", hex: "#2F6BFF" },
  { name: "Background", varName: "--background", hex: "#F5F7FB" },
  { name: "Success", varName: "--success", hex: "#16875B" },
  { name: "Warning", varName: "--warning", hex: "#D97706" },
  { name: "Danger", varName: "--danger", hex: "#C43D3D" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function ShowcasePage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(33742.5);
  const [date, setDate] = useState("2026-08-12");
  const [files, setFiles] = useState<File[]>([]);

  return (
    <AppShell>
      <PageHeader
        title="Bileşen Vitrini"
        description="Sahte verilerle tasarım sistemi ve ortak bileşenler."
      />

      <Section title="Renk Tokenları">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {swatches.map((swatch) => (
            <div key={swatch.varName} className="space-y-2">
              <div
                className="h-16 rounded-lg border border-border"
                style={{ backgroundColor: swatch.hex }}
              />
              <p className="text-xs font-medium text-foreground">
                {swatch.name}
              </p>
              <p className="text-xs text-muted-foreground">{swatch.hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografi">
        <div className="space-y-2">
          <p className="font-heading text-2xl font-semibold text-foreground">
            Başlık 2xl / 600
          </p>
          <p className="font-heading text-lg font-semibold text-foreground">
            Başlık lg / 600
          </p>
          <p className="text-sm text-foreground">Gövde metni 400–500 ağırlık.</p>
          <p className="tabular-money text-2xl font-semibold text-foreground">
            {formatCurrency(33742.5)}
          </p>
        </div>
      </Section>

      <Section title="Butonlar">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Birincil (lg · 48px)</Button>
          <Button variant="outline" size="lg">
            İkincil
          </Button>
          <Button variant="destructive" size="lg">
            Tehlikeli
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Bağlantı</Button>
        </div>
      </Section>

      <Section title="StatusBadge">
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <StatusBadge key={t.tone} tone={t.tone} label={t.label} />
          ))}
        </div>
      </Section>

      <Section title="AlertBanner">
        <div className="space-y-3">
          <AlertBanner
            tone="success"
            title="Ödeme kayıtlı koşullarla uyumlu"
            description="0,80 TL yuvarlama farkı var."
          />
          <AlertBanner
            tone="warning"
            title="227,50 TL fark bulundu"
            description="Kayıtlı koşullarla beklenen tutar arasında fark var. 6 taksit oranı kaynaklı olabilir."
          />
          <AlertBanner
            tone="danger"
            title="Bu POS için aktif tarife bulunmuyor"
            description="Beklenen ödeme hesaplanamaz."
          />
          <AlertBanner
            tone="info"
            title="Aylık rapor hazır"
            description="Ağustos ayı maliyet raporunuz oluşturuldu."
          />
        </div>
      </Section>

      <Section title="StatCard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Bugün Beklenen"
            value={formatCurrency(33742.5)}
            icon={<Wallet className="size-4" />}
            helperText="2 ödeme"
            href="/panel/odemeler/beklenen"
          />
          <StatCard
            label="Kontrol Edilmeli"
            value={formatCurrency(2450)}
            trend={{ label: "3 işlem", tone: "danger" }}
          />
        </div>
      </Section>

      <Section title="BankCard">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {mockBanks.map((bank) => (
            <BankCard key={bank.id} {...bank} />
          ))}
        </div>
      </Section>

      <Section title="PosCard">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {mockPosDevices.map((pos) => (
            <PosCard key={pos.id} {...pos} />
          ))}
        </div>
      </Section>

      <Section title="PaymentCard">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {mockPendingPayments.map((payment) => (
            <PaymentCard key={payment.id} {...payment} />
          ))}
        </div>
      </Section>

      <Section title="Formlar" description="CurrencyInput, DateInput, FileUploader">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CurrencyInput
            label="Tek çekim tutarı"
            value={amount}
            onValueChange={setAmount}
            required
          />
          <DateInput
            label="İşlem tarihi"
            value={date}
            onValueChange={setDate}
            required
          />
        </div>
        <FileUploader
          label="Banka belgesi"
          value={files}
          onValueChange={setFiles}
        />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          title="Henüz bir POS eklenmedi"
          description="İlk bankanızı ve POS'unuzu ekleyerek başlayın."
          action={<Button size="lg">POS Ekle</Button>}
        />
      </Section>

      <Section title="LoadingSkeleton">
        <div className="space-y-4">
          <StatGridSkeleton count={2} />
          <CardListSkeleton rows={2} />
        </div>
      </Section>

      <Section title="ConfirmDialog">
        <Button variant="destructive" size="lg" onClick={() => setConfirmOpen(true)}>
          Tarifeyi Sil
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Bu tarifeyi silmek istediğinize emin misiniz?"
          description="Tarife sürümleri silinmez; bu kayıt pasife alınır."
          destructive
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>
    </AppShell>
  );
}
