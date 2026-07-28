import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "./status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export interface PosCardProps {
  posName: string;
  terminalNo: string;
  posType: string;
  activeTariffName: string | null;
  lastTransactionDate: Date | string | null;
  monthlyRevenue: number;
  monthlyDeduction: number;
  status: { label: string; tone: StatusTone };
  /** Aktif tarife yokken "Tarife Ekle" bağlantısı için. */
  addTariffHref?: string;
}

export function PosCard({
  posName,
  terminalNo,
  posType,
  activeTariffName,
  lastTransactionDate,
  monthlyRevenue,
  monthlyDeduction,
  status,
  addTariffHref,
}: PosCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-foreground">
                {posName}
              </p>
              <p className="text-xs text-muted-foreground">
                {posType} · Terminal {terminalNo}
              </p>
            </div>
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span>Aktif tarife</span>
          <span className="font-medium text-foreground">
            {activeTariffName ?? "Tarife yok"}
          </span>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Son işlem</dt>
            <dd className="font-medium text-foreground">
              {lastTransactionDate ? formatDate(lastTransactionDate) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bu ay ciro</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(monthlyRevenue)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bu ay kesinti</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(monthlyDeduction)}
            </dd>
          </div>
        </dl>
      </CardContent>
      {!activeTariffName && addTariffHref ? (
        <CardFooter className="bg-transparent">
          <Button asChild size="sm" variant="outline">
            <Link href={addTariffHref}>Tarife Ekle</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
