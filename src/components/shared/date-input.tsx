"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/** Native date picker; value is an ISO (yyyy-mm-dd) string, preview shown as GG.AA.YYYY. */
export function DateInput({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  error,
  disabled,
  required,
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label ? (
        <Label htmlFor={inputId}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
      ) : null}
      <Input
        id={inputId}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(error && "border-danger focus-visible:ring-danger")}
        aria-invalid={!!error}
      />
      {value ? (
        <p className="text-xs text-muted-foreground">{formatDate(value)}</p>
      ) : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
