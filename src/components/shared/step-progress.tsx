import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDefinition {
  number: number;
  label: string;
}

/** Genel amaçlı stepper — kurulum sihirbazındaki `Stepper`'ın adım listesi
 * dışarıdan verilebilen hâli (bkz. Aşama 5 tarife sihirbazı). */
export function StepProgress({
  steps,
  current,
}: {
  steps: readonly StepDefinition[];
  current: number;
}) {
  return (
    <ol className="space-y-1">
      {steps.map((s) => {
        const state = s.number < current ? "done" : s.number === current ? "active" : "upcoming";
        return (
          <li
            key={s.number}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
              state === "active" && "bg-accent font-medium text-primary",
              state === "upcoming" && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                state === "done" && "bg-success text-success-foreground",
                state === "active" && "bg-primary text-primary-foreground",
                state === "upcoming" && "bg-muted text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="size-3.5" /> : s.number}
            </span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}
