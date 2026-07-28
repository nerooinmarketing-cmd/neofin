import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "./status-badge";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  helperText?: string;
  trend?: { label: string; tone: StatusTone };
  href?: string;
  actionLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  helperText,
  trend,
  href,
  actionLabel = "Detayı Gör",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
              {icon}
            </span>
          ) : null}
        </div>
        <p className="tabular-money text-2xl font-semibold text-foreground sm:text-[28px]">
          {value}
        </p>
        <div className="flex items-center justify-between gap-2">
          {trend ? <StatusBadge label={trend.label} tone={trend.tone} /> : (
            helperText ? (
              <p className="text-xs text-muted-foreground">{helperText}</p>
            ) : <span />
          )}
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {actionLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
