import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DifferenceListItem } from "@/server/repositories/difference-repository";

const RISK_TONE: Record<string, StatusTone> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const RISK_LABEL: Record<string, string> = {
  low: "Düşük risk",
  medium: "Orta risk",
  high: "Yüksek risk",
};

function formatPercent(value: number): string {
  return `%${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function DifferenceCard({ item }: { item: DifferenceListItem }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading font-semibold text-foreground">{item.bankName}</p>
            <p className="text-xs text-muted-foreground">
              {item.posName} · {item.branchName}
            </p>
          </div>
          <StatusBadge label={item.displayStatus.label} tone={item.displayStatus.tone} />
        </div>

        {/* Seviye 1 — Matematiksel fark */}
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InfoField label="Beklenen" value={formatCurrency(item.expectedNet)} />
          <InfoField label="Gerçekleşen" value={formatCurrency(item.actualAmount)} />
          <InfoField label="Fark" value={formatCurrency(item.differenceAmount)} />
          <InfoField label="Fark yüzdesi" value={formatPercent(item.differencePercentage)} />
        </dl>

        <Separator />

        {/* Seviye 2 — Kural kontrolü */}
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <InfoField label="İlgili tarife" value={item.tariffLabel} />
          <InfoField
            label="Kayıtlı oran"
            value={item.registeredRate !== null ? formatPercent(item.registeredRate) : "—"}
          />
          <InfoField
            label="Tahmini uygulanan oran"
            value={item.estimatedAppliedRate !== null ? formatPercent(item.estimatedAppliedRate) : "—"}
          />
          <InfoField label="Valör uyumu" value={item.valorCompliance} />
          <InfoField label="Ek ücret uyumu" value={item.feeCompliance} />
          <InfoField
            label="Kaynak belge"
            value={item.sourceDocumentUrl ? "Ekli" : "Yüklenmedi"}
          />
        </dl>

        <Separator />

        {/* Seviye 3 — Rule-based açıklama (AI öncesi hazır veri modeli) */}
        <div className="space-y-2 rounded-lg bg-accent p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Olası Neden</p>
            <StatusBadge
              label={RISK_LABEL[item.ruleExplanation.riskLevel]}
              tone={RISK_TONE[item.ruleExplanation.riskLevel]}
            />
          </div>
          <p className="text-sm text-foreground">{item.ruleExplanation.possibleReason}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <InfoField label="Kontrol edilmesi gereken belge" value={item.ruleExplanation.documentToCheck} />
            <InfoField label="Bankaya sorulacak soru" value={item.ruleExplanation.questionForBank} />
          </dl>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Önerilen işlem: </span>
            {item.ruleExplanation.recommendedAction}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Satış {formatDate(item.saleDate)} · Ödeme {formatDate(item.expectedPaymentDate)} · Hesaba geçiş{" "}
            {formatDate(item.receivedDate)}
          </span>
          {item.sourceDocumentUrl ? (
            <Link href={item.sourceDocumentUrl} target="_blank" className="font-medium text-primary hover:underline">
              Dekontu görüntüle
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
