import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "./status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export interface PaymentCardProps {
  bankName: string;
  posName: string;
  saleDate: Date | string;
  paymentDate: Date | string;
  grossAmount: number;
  expectedDeduction: number;
  expectedNet: number;
  status: { label: string; tone: StatusTone };
  onMarkReceived?: () => void;
  /** Server Component sayfalarda onClick yerine gerçek gezinme için. */
  markReceivedHref?: string;
}

export function PaymentCard({
  bankName,
  posName,
  saleDate,
  paymentDate,
  grossAmount,
  expectedDeduction,
  expectedNet,
  status,
  onMarkReceived,
  markReceivedHref,
}: PaymentCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-semibold text-foreground">
              {bankName}
            </p>
            <p className="text-xs text-muted-foreground">{posName}</p>
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Satış tarihi</dt>
            <dd className="font-medium text-foreground">
              {formatDate(saleDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ödeme tarihi</dt>
            <dd className="font-medium text-foreground">
              {formatDate(paymentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Brüt satış</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(grossAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Beklenen kesinti</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(expectedDeduction)}
            </dd>
          </div>
        </dl>
        <div className="rounded-lg bg-accent px-3 py-2">
          <p className="text-xs text-muted-foreground">Beklenen net ödeme</p>
          <p className="tabular-money text-lg font-semibold text-foreground">
            {formatCurrency(expectedNet)}
          </p>
        </div>
      </CardContent>
      {markReceivedHref || onMarkReceived ? (
        <CardFooter className="bg-transparent">
          {markReceivedHref ? (
            <Button size="lg" className="w-full" asChild>
              <Link href={markReceivedHref}>Hesabıma Geçti</Link>
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={onMarkReceived}>
              Hesabıma Geçti
            </Button>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}
