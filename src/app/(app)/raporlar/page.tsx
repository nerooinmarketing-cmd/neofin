import {
  CalendarDays,
  TrendingDown,
  Landmark,
  CreditCard,
  GitCompareArrows,
  Trophy,
  FileSearch2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ReportCard } from "@/components/reports/report-card";

const REPORTS = [
  {
    href: "/raporlar/gunluk",
    icon: CalendarDays,
    title: "Günlük Özet",
    description: "Seçilen güne ait ciro, kesinti ve banka/POS bazlı dağılım.",
  },
  {
    href: "/raporlar/aylik",
    icon: TrendingDown,
    title: "Aylık Maliyet",
    description: "Bu ayın toplam kesintisi, geçen aya göre değişim ve banka dağılımı.",
  },
  {
    href: "/raporlar/banka-karsilastirma",
    icon: Landmark,
    title: "Banka Karşılaştırma",
    description: "Ciro, ortalama oran, kesinti, fark, valör ve sabit ücret — banka bazlı.",
  },
  {
    href: "/raporlar/pos-karsilastirma",
    icon: CreditCard,
    title: "POS Karşılaştırma",
    description: "En yüksek/düşük maliyetli POS, en fazla fark görülen POS.",
  },
  {
    href: "/raporlar/fark-raporu",
    icon: GitCompareArrows,
    title: "Fark Raporu",
    description: "Dönem içindeki tüm beklenen/gerçekleşen ödeme farkları.",
  },
  {
    href: "/raporlar/yillik-pazarlik",
    icon: Trophy,
    title: "Yıllık Maliyet ve Pazarlık Raporu",
    description: "Son 12 ay özeti, banka/POS analizi, gelecek yıl tahmini ve pazarlık önerileri.",
  },
  {
    href: "/raporlar/sozlesme-ozeti",
    icon: FileSearch2,
    title: "Sözleşme Analiz Özeti",
    description: "Analiz edilmiş tüm sözleşmelerin güven skoru ve kritik madde özeti.",
  },
];

export default function RaporlarPage() {
  return (
    <AppShell>
      <PageHeader title="Raporlar" description="Günlük, aylık ve yıllık maliyet raporları." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <ReportCard key={report.href} {...report} />
        ))}
      </div>
    </AppShell>
  );
}
