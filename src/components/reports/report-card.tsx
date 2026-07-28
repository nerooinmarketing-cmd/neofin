import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ReportCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ReportCard({ href, icon: Icon, title, description }: ReportCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-navy-foreground">
            <Icon className="size-5" />
          </span>
          <p className="font-heading font-semibold text-foreground">{title}</p>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button size="sm" asChild>
          <Link href={href}>Raporu Görüntüle</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
