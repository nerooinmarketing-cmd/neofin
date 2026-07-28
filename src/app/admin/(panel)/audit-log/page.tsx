import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import { adminRepository } from "@/server/admin/admin-repository";
import type { StatusTone } from "@/components/shared/status-badge";

const ACTOR_TONE: Record<string, StatusTone> = {
  USER: "info",
  SYSTEM: "neutral",
  AI: "warning",
};

export default async function AuditLogPage() {
  const logs = await adminRepository.listAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Tüm firmalardaki son {logs.length} kritik işlem.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Henüz kayıt yok" description="Kritik işlemler burada listelenecek." />
      ) : (
        <Card>
          <CardContent className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
                <div className="flex items-center gap-2">
                  <StatusBadge label={log.actorType} tone={ACTOR_TONE[log.actorType] ?? "neutral"} />
                  <span className="font-medium text-foreground">{log.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.entityType} · {log.companyName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
