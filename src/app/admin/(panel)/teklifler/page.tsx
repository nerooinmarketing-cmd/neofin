import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { QuoteRequestStatusButtons } from "@/components/admin/quote-request-status-buttons";
import { formatDate } from "@/lib/format";
import { quoteRequestRepository } from "@/server/repositories/quote-request-repository";
import { quoteRequestStatusLabel } from "@/server/admin/labels";

export default async function TekliflerPage() {
  const quoteRequests = await quoteRequestRepository.listAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Teklif Talepleri</h1>
        <p className="text-sm text-muted-foreground">
          Tanıtım sayfasındaki &quot;Teklif Alın&quot; formundan gelen talepler — {quoteRequests.length} kayıt.
        </p>
      </div>

      {quoteRequests.length === 0 ? (
        <EmptyState title="Henüz teklif talebi yok" description="Tanıtım sayfasından biri form doldurduğunda burada listelenecek." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quoteRequests.map((q) => {
            const status = quoteRequestStatusLabel(q.status);
            return (
              <Card key={q.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-semibold text-foreground">{q.name}</p>
                      <p className="text-xs text-muted-foreground">{q.phone}</p>
                    </div>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                  {q.companyName ? (
                    <p className="text-sm text-foreground">{q.companyName}</p>
                  ) : null}
                  {q.message ? (
                    <p className="text-sm text-muted-foreground">{q.message}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(q.createdAt)}
                    {q.contactedBy ? ` · ${q.contactedBy.name} görüştü` : ""}
                  </p>
                  <QuoteRequestStatusButtons quoteRequestId={q.id} currentStatus={q.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
