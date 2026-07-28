import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "./status-badge";

const toneConfig: Record<
  StatusTone,
  { container: string; icon: ReactNode }
> = {
  success: {
    container: "bg-success-soft text-success border-success/20",
    icon: <CheckCircle2 className="size-5 shrink-0" />,
  },
  warning: {
    container: "bg-warning-soft text-warning border-warning/20",
    icon: <AlertTriangle className="size-5 shrink-0" />,
  },
  danger: {
    container: "bg-danger-soft text-danger border-danger/20",
    icon: <OctagonAlert className="size-5 shrink-0" />,
  },
  info: {
    container: "bg-info-soft text-info border-info/20",
    icon: <Info className="size-5 shrink-0" />,
  },
  neutral: {
    container: "bg-muted text-muted-foreground border-border",
    icon: <Info className="size-5 shrink-0" />,
  },
};

export interface AlertBannerProps {
  tone: StatusTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Neutral, non-accusatory messaging banner. Use "kayıtlı koşullarla beklenen
 * tutar arasında fark var" phrasing, never "banka hatalı kesti".
 */
export function AlertBanner({
  tone,
  title,
  description,
  action,
  className,
}: AlertBannerProps) {
  const config = toneConfig[tone];
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        config.container,
        className,
      )}
    >
      {config.icon}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
