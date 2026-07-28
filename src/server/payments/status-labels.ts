import type { StatusTone } from "@/components/shared/status-badge";

/** `PaymentDifference.status` (DifferenceStatus) için Türkçe etiket/ton. */
export function statusFromDifference(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "MATCHED":
      return { label: "Tam ödendi", tone: "success" };
    case "DELAYED":
      return { label: "Tam ödendi (gecikmeli)", tone: "warning" };
    case "PARTIALLY_PAID":
      return { label: "Kısmi ödeme", tone: "warning" };
    default:
      return { label: "Fark bulundu", tone: "danger" };
  }
}
