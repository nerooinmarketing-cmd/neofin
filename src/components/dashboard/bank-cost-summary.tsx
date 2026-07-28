import { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import type { DashboardBankCost } from "@/server/repositories/dashboard-repository";

export function BankCostSummary({ banks }: { banks: DashboardBankCost[] }) {
  if (banks.length === 0) {
    return (
      <EmptyState
        title="Bu ay henüz banka bazlı veri yok"
        description="Gün sonu girişi yaptıkça bankalara göre maliyet dağılımı burada görünecek."
      />
    );
  }

  return (
    <>
      {/* Masaüstü: tablo görünümü */}
      <Card className="hidden sm:block">
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3 text-sm">
            <span className="font-medium text-muted-foreground">Banka</span>
            <span className="text-right font-medium text-muted-foreground">Aylık ciro</span>
            <span className="text-right font-medium text-muted-foreground">Aylık kesinti</span>
            {banks.map((bank) => (
              <Fragment key={bank.bankId}>
                <span className="font-medium text-foreground">{bank.bankName}</span>
                <span className="tabular-money text-right text-foreground">
                  {formatCurrency(bank.monthlyGross)}
                </span>
                <span className="tabular-money text-right text-foreground">
                  {formatCurrency(bank.monthlyDeduction)}
                </span>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobil: kart listesi */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {banks.map((bank) => (
          <Card key={bank.bankId}>
            <CardContent className="space-y-2">
              <p className="font-heading font-semibold text-foreground">{bank.bankName}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Aylık ciro</dt>
                  <dd className="tabular-money font-medium text-foreground">
                    {formatCurrency(bank.monthlyGross)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Aylık kesinti</dt>
                  <dd className="tabular-money font-medium text-foreground">
                    {formatCurrency(bank.monthlyDeduction)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
