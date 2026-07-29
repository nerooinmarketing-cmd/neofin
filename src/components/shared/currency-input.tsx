"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function parseTRNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  if (cleaned === "") return undefined;
  const value = Number(cleaned);
  return Number.isNaN(value) ? undefined : value;
}

function formatTRNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/** Turkish-locale money input (1.234,56) with a fixed "TL" suffix. */
export function CurrencyInput({
  id,
  label,
  value,
  onValueChange,
  placeholder = "0,00",
  error,
  disabled,
  required,
}: CurrencyInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [text, setText] = useState(value !== undefined ? formatTRNumber(value) : "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (isFocusedRef.current) return;
    setText(value !== undefined ? formatTRNumber(value) : "");
  }, [value]);

  return (
    <div className="space-y-1.5">
      {label ? (
        <Label htmlFor={inputId}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
      ) : null}
      <div className="relative">
        <Input
          id={inputId}
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            onValueChange(parseTRNumber(raw));
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            const parsed = parseTRNumber(text);
            setText(parsed !== undefined ? formatTRNumber(parsed) : "");
            onValueChange(parsed);
          }}
          className={cn(
            "tabular-money pr-10 text-right",
            error && "border-danger focus-visible:ring-danger",
          )}
          aria-invalid={!!error}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          TL
        </span>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
