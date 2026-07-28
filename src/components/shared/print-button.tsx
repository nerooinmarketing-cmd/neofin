"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "PDF" çıktısı — tarayıcının yazdır/PDF olarak kaydet akışını kullanır. */
export function PrintButton({ label = "PDF Olarak Yazdır" }: { label?: string }) {
  return (
    <Button size="lg" variant="outline" className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
