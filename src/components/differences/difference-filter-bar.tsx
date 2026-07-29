"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "NEEDS_REVIEW", label: "Kontrol edilmeli" },
  { value: "DIFFERENCE_FOUND", label: "Fark bulundu" },
  { value: "PARTIALLY_PAID", label: "Kısmi ödeme" },
  { value: "DELAYED", label: "Gecikmeli" },
  { value: "MATCHED", label: "Uyumlu" },
];

export interface DifferenceFilterBarProps {
  banks: { id: string; name: string }[];
  posDevices: { id: string; name: string }[];
  branches: { id: string; name: string }[];
}

export function DifferenceFilterBar({ banks, posDevices, branches }: DifferenceFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/panel/fark-analizi?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={currentStatus === opt.value ? "default" : "outline"}
            onClick={() => setParam("status", opt.value)}
            className={cn(currentStatus === opt.value && "pointer-events-none")}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={searchParams.get("bankId") ?? "all"} onValueChange={(v) => setParam("bankId", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Banka" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm bankalar</SelectItem>
            {banks.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("posId") ?? "all"} onValueChange={(v) => setParam("posId", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="POS" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm POS&apos;lar</SelectItem>
            {posDevices.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("branchId") ?? "all"} onValueChange={(v) => setParam("branchId", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Şube" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm şubeler</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
