import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = [
  { number: 1, label: "Firma Bilgileri" },
  { number: 2, label: "Banka Ekleme" },
  { number: 3, label: "POS Ekleme" },
  { number: 4, label: "Resmî Tarife" },
  { number: 5, label: "Kontrol ve Onay" },
] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="space-y-1">
      {ONBOARDING_STEPS.map((s) => {
        const state = s.number < current ? "done" : s.number === current ? "active" : "upcoming";
        return (
          <li
            key={s.number}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
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
