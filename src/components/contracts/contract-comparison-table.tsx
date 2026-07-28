import { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { ComparisonRow, ComparisonTone } from "@/lib/contract-comparison";

const TONE_BADGE: Record<ComparisonTone, { label: string; tone: StatusTone } | null> = {
  advantageous: { label: "Avantajlı", tone: "success" },
  disadvantageous: { label: "Dezavantajlı", tone: "danger" },
  neutral: null,
};

export function ContractComparisonTable({
  rows,
  currentLabel,
  newLabel,
}: {
  rows: ComparisonRow[];
  currentLabel: string;
  newLabel: string;
}) {
  return (
    <>
      {/* Masaüstü: yan yana tablo */}
      <Card className="hidden sm:block">
        <CardContent>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-6 gap-y-3 text-sm">
            <span className="font-medium text-muted-foreground">Başlık</span>
            <span className="font-medium text-muted-foreground">{currentLabel}</span>
            <span className="font-medium text-muted-foreground">{newLabel}</span>
            {rows.map((row) => {
              const badge = TONE_BADGE[row.tone];
              return (
                <Fragment key={row.label}>
                  <span className="font-medium text-foreground">{row.label}</span>
                  <span className="text-foreground">{row.currentDisplay}</span>
                  <span className="flex items-center gap-2 text-foreground">
                    {row.newDisplay}
                    {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mobil: kart listesi */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {rows.map((row) => {
          const badge = TONE_BADGE[row.tone];
          return (
            <Card key={row.label}>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{row.label}</p>
                  {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">{currentLabel}</dt>
                    <dd className="font-medium text-foreground">{row.currentDisplay}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{newLabel}</dt>
                    <dd className="font-medium text-foreground">{row.newDisplay}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
