import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  FileSearch2,
  FileStack,
  GitCompareArrows,
  Landmark,
  LayoutDashboard,
  MessageCircleQuestion,
  Settings,
  Users,
  WalletMinimal,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Masaüstü sol menü — bkz. UX dokümanı §5 */
export const primaryNavItems: NavItem[] = [
  { label: "Genel Bakış", href: "/", icon: LayoutDashboard },
  { label: "Bankalar ve POS'lar", href: "/bankalar", icon: Landmark },
  { label: "Tarifeler", href: "/tarifeler", icon: FileStack },
  { label: "Gün Sonu Girişi", href: "/gun-sonu", icon: CalendarCheck2 },
  {
    label: "Beklenen Ödemeler",
    href: "/odemeler/beklenen",
    icon: WalletMinimal,
  },
  {
    label: "Gerçekleşen Ödemeler",
    href: "/odemeler/gerceklesen",
    icon: CheckCircle2,
  },
  { label: "Fark Analizi", href: "/fark-analizi", icon: GitCompareArrows },
  { label: "Sözleşme Analizi", href: "/sozlesmeler", icon: FileSearch2 },
  { label: "Raporlar", href: "/raporlar", icon: BarChart3 },
  { label: "Finans Asistanı", href: "/asistan", icon: MessageCircleQuestion },
  { label: "Bildirimler", href: "/bildirimler", icon: Bell },
  { label: "Kullanıcılar", href: "/kullanicilar", icon: Users },
  { label: "Ayarlar", href: "/ayarlar", icon: Settings },
];

/** Mobil alt menü — ilk 4 sabit, 5.si "Menü" sheet'i açar (bkz. UX dokümanı §5) */
export const mobileNavItems: NavItem[] = [
  { label: "Ana Sayfa", href: "/", icon: LayoutDashboard },
  { label: "Gün Sonu", href: "/gun-sonu", icon: CalendarCheck2 },
  { label: "Ödemeler", href: "/odemeler/beklenen", icon: WalletMinimal },
  { label: "Analiz", href: "/fark-analizi", icon: GitCompareArrows },
];
