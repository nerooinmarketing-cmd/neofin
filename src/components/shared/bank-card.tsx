import Link from "next/link";
import { Landmark } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "./status-badge";
import { formatCurrency } from "@/lib/format";

export interface BankCardProps {
  bankName: string;
  activePosCount: number;
  monthlyRevenue: number;
  avgCommissionRate: number;
  pendingPayment: number;
  status: { label: string; tone: StatusTone };
  onOpenBank?: () => void;
  onAddPos?: () => void;
  onViewTariffs?: () => void;
  /** Server Component sayfalarda onClick yerine gerçek gezinme için. */
  openBankHref?: string;
  addPosHref?: string;
  viewTariffsHref?: string;
}

export function BankCard({
  bankName,
  activePosCount,
  monthlyRevenue,
  avgCommissionRate,
  pendingPayment,
  status,
  onOpenBank,
  onAddPos,
  onViewTariffs,
  openBankHref,
  addPosHref,
  viewTariffsHref,
}: BankCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-navy-foreground">
              <Landmark className="size-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-foreground">
                {bankName}
              </p>
              <p className="text-xs text-muted-foreground">
                {activePosCount} aktif POS
              </p>
            </div>
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Aylık ciro</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(monthlyRevenue)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ort. komisyon</dt>
            <dd className="tabular-money font-medium text-foreground">
              %{avgCommissionRate.toLocaleString("tr-TR")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bekleyen ödeme</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(pendingPayment)}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 bg-transparent">
        {openBankHref ? (
          <Button size="sm" asChild>
            <Link href={openBankHref}>Bankayı Aç</Link>
          </Button>
        ) : (
          <Button size="sm" onClick={onOpenBank}>
            Bankayı Aç
          </Button>
        )}
        {addPosHref ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={addPosHref}>Yeni POS Ekle</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onAddPos}>
            Yeni POS Ekle
          </Button>
        )}
        {viewTariffsHref ? (
          <Button size="sm" variant="ghost" asChild>
            <Link href={viewTariffsHref}>Tarife Görüntüle</Link>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onViewTariffs}>
            Tarife Görüntüle
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
