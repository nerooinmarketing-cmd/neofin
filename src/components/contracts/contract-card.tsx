import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { contractStatusLabel } from "@/server/contract-analysis/status-labels";

export interface ContractCardProps {
  id: string;
  title: string;
  bankName?: string;
  posName?: string;
  status: string;
  pageCount: number;
  uploadedAt: Date;
}

export function ContractCard({ id, title, bankName, posName, status, pageCount, uploadedAt }: ContractCardProps) {
  const displayStatus = contractStatusLabel(status);
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-navy-foreground">
              <FileText className="size-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                {[bankName, posName].filter(Boolean).join(" · ") || "Banka/POS eşleşmesi yok"}
              </p>
            </div>
          </div>
          <StatusBadge label={displayStatus.label} tone={displayStatus.tone} />
        </div>
        <p className="text-xs text-muted-foreground">
          {pageCount} sayfa · Yüklendi {formatDate(uploadedAt)}
        </p>
      </CardContent>
      <CardFooter className="bg-transparent">
        <Button size="sm" className="w-full" asChild>
          <Link href={`/sozlesmeler/${id}`}>Analizi Görüntüle</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
