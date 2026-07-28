import type { CompanyStatus, PackageTier, SupportStatus } from "@/generated/prisma/enums";
import type { StatusTone } from "@/components/shared/status-badge";

export const PACKAGE_TIER_LABELS: Record<PackageTier, string> = {
  BASIC: "Temel",
  PRO: "Pro",
  ENTERPRISE: "Kurumsal",
};

export function companyStatusLabel(status: CompanyStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case "ACTIVE":
      return { label: "Aktif", tone: "success" };
    case "INACTIVE":
      return { label: "Pasif", tone: "danger" };
    case "TRIAL":
      return { label: "Deneme", tone: "info" };
  }
}

export function supportStatusLabel(status: SupportStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case "NONE":
      return { label: "Destek talebi yok", tone: "neutral" };
    case "OPEN":
      return { label: "Destek talebi açık", tone: "warning" };
    case "RESOLVED":
      return { label: "Destek talebi çözüldü", tone: "success" };
  }
}
