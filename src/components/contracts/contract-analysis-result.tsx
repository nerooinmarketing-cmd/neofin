import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertBanner } from "@/components/shared/alert-banner";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format";
import { parseFinancialImpact, parseStringList } from "@/server/contract-analysis/parse-analysis";

const SEVERITY_TONE: Record<string, StatusTone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

const SEVERITY_LABEL: Record<string, string> = {
  HIGH: "Kritik",
  MEDIUM: "Orta",
  LOW: "Düşük",
};

function formatMoneyOrDash(value: number | null): string {
  return value === null ? "—" : formatCurrency(value);
}

export interface ContractAnalysisResultProps {
  analysis: {
    summary60s: string;
    advantages: unknown;
    attentionPoints: unknown;
    commissionSummary: unknown;
    valorSummary: string | null;
    volumeCommitmentNote: string | null;
    earlyTerminationNote: string | null;
    autoRenewalNote: string | null;
    unilateralChangeNote: string | null;
    confidenceScore: number;
    risks: {
      id: string;
      text: string;
      severity: string;
      sourcePageNumber: number | null;
      sourceClauseRef: string | null;
      suggestedCorrection: string | null;
    }[];
    questions: { id: string; question: string }[];
  };
  needsManualReview: boolean;
}

export function ContractAnalysisResult({ analysis, needsManualReview }: ContractAnalysisResultProps) {
  const advantages = parseStringList(analysis.advantages);
  const attentionPoints = parseStringList(analysis.attentionPoints);
  const financialImpact = parseFinancialImpact(analysis.commissionSummary);
  const criticalRisks = analysis.risks.filter((r) => r.severity === "HIGH");
  const otherRisks = analysis.risks.filter((r) => r.severity !== "HIGH");
  const corrections = analysis.risks.filter((r) => r.suggestedCorrection);

  return (
    <div className="space-y-6">
      {needsManualReview ? (
        <AlertBanner
          tone="warning"
          title="Bu analiz düşük güven skoruna sahip — manuel kontrol öneriyoruz"
          description={`Güven skoru: %${Math.round(analysis.confidenceScore * 100)}`}
        />
      ) : null}

      {/* A. 60 saniyelik özet */}
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">60 Saniyelik Özet</h2>
            <StatusBadge label={`Güven skoru %${Math.round(analysis.confidenceScore * 100)}`} tone={needsManualReview ? "warning" : "success"} />
          </div>
          <p className="text-sm text-foreground">{analysis.summary60s}</p>
        </CardContent>
      </Card>

      {/* B. Avantajlar */}
      {advantages.length > 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Avantajlar</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {advantages.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* C. Dikkat edilmesi gerekenler + kritik maddeler */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Dikkat Edilmesi Gerekenler</h2>
          {attentionPoints.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {attentionPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {criticalRisks.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Kritik Maddeler</p>
                {criticalRisks.map((risk) => (
                  <div key={risk.id} className="space-y-1 rounded-lg bg-danger-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground">{risk.text}</p>
                      <StatusBadge label={SEVERITY_LABEL[risk.severity]} tone={SEVERITY_TONE[risk.severity]} />
                    </div>
                    {risk.sourcePageNumber || risk.sourceClauseRef ? (
                      <p className="text-xs text-muted-foreground">
                        Kaynak: {risk.sourcePageNumber ? `Sayfa ${risk.sourcePageNumber}` : null}
                        {risk.sourcePageNumber && risk.sourceClauseRef ? " · " : null}
                        {risk.sourceClauseRef}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {otherRisks.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Diğer Bulgular</p>
                {otherRisks.map((risk) => (
                  <div key={risk.id} className="flex items-start justify-between gap-2 rounded-lg bg-accent p-3">
                    <p className="text-sm text-foreground">{risk.text}</p>
                    <StatusBadge label={SEVERITY_LABEL[risk.severity]} tone={SEVERITY_TONE[risk.severity]} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* D. Finansal etki */}
      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Finansal Etki</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Tahmini aylık maliyet</dt>
              <dd className="tabular-money font-medium text-foreground">
                {formatMoneyOrDash(financialImpact.estimatedMonthlyCost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tahmini yıllık maliyet</dt>
              <dd className="tabular-money font-medium text-foreground">
                {formatMoneyOrDash(financialImpact.estimatedAnnualCost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Mevcut sözleşmeye göre fark</dt>
              <dd className="tabular-money font-medium text-foreground">
                {formatMoneyOrDash(financialImpact.comparedToCurrentDiff)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ciro taahhüdü tutmazsa</dt>
              <dd className="tabular-money font-medium text-foreground">
                {formatMoneyOrDash(financialImpact.volumeShortfallCost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Erken ayrılma senaryosu</dt>
              <dd className="tabular-money font-medium text-foreground">
                {formatMoneyOrDash(financialImpact.earlyExitCost)}
              </dd>
            </div>
          </dl>
          <Separator />
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {analysis.valorSummary ? (
              <div>
                <dt className="text-xs text-muted-foreground">Valör</dt>
                <dd className="text-foreground">{analysis.valorSummary}</dd>
              </div>
            ) : null}
            {analysis.volumeCommitmentNote ? (
              <div>
                <dt className="text-xs text-muted-foreground">Ciro taahhüdü</dt>
                <dd className="text-foreground">{analysis.volumeCommitmentNote}</dd>
              </div>
            ) : null}
            {analysis.earlyTerminationNote ? (
              <div>
                <dt className="text-xs text-muted-foreground">Erken fesih</dt>
                <dd className="text-foreground">{analysis.earlyTerminationNote}</dd>
              </div>
            ) : null}
            {analysis.autoRenewalNote ? (
              <div>
                <dt className="text-xs text-muted-foreground">Otomatik yenileme</dt>
                <dd className="text-foreground">{analysis.autoRenewalNote}</dd>
              </div>
            ) : null}
            {analysis.unilateralChangeNote ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Tek taraflı değişiklik</dt>
                <dd className="text-foreground">{analysis.unilateralChangeNote}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {/* E. Bankaya sorulması gereken sorular */}
      {analysis.questions.length > 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Bankaya Sorulması Gereken Sorular</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
              {analysis.questions.map((q) => (
                <li key={q.id}>{q.question}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {/* F. Şerh/düzeltme önerileri */}
      {corrections.length > 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Şerh / Düzeltme Önerileri</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {corrections.map((risk) => (
                <li key={risk.id}>{risk.suggestedCorrection}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <AlertBanner
        tone="neutral"
        title="Bu analiz karar desteği amacıyla hazırlanır"
        description="Hukukî veya finansal danışmanlık yerine geçmez. Kritik sözleşmeler için uzman görüşü alınmalıdır."
      />
    </div>
  );
}
