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
  { label: "Genel Bakış", href: "/panel", icon: LayoutDashboard },
  { label: "Bankalar ve POS'lar", href: "/panel/bankalar", icon: Landmark },
  { label: "Tarifeler", href: "/panel/tarifeler", icon: FileStack },
  { label: "Gün Sonu Girişi", href: "/panel/gun-sonu", icon: CalendarCheck2 },
  {
    label: "Beklenen Ödemeler",
    href: "/panel/odemeler/beklenen",
    icon: WalletMinimal,
  },
  {
    label: "Gerçekleşen Ödemeler",
    href: "/panel/odemeler/gerceklesen",
    icon: CheckCircle2,
  },
  { label: "Fark Analizi", href: "/panel/fark-analizi", icon: GitCompareArrows },
  { label: "Sözleşme Analizi", href: "/panel/sozlesmeler", icon: FileSearch2 },
  { label: "Raporlar", href: "/panel/raporlar", icon: BarChart3 },
  { label: "Finans Asistanı", href: "/panel/asistan", icon: MessageCircleQuestion },
  { label: "Bildirimler", href: "/panel/bildirimler", icon: Bell },
  { label: "Kullanıcılar", href: "/panel/kullanicilar", icon: Users },
  { label: "Ayarlar", href: "/panel/ayarlar", icon: Settings },
];

/** Mobil alt menü — ilk 4 sabit, 5.si "Menü" sheet'i açar (bkz. UX dokümanı §5) */
export const mobileNavItems: NavItem[] = [
  { label: "Ana Sayfa", href: "/panel", icon: LayoutDashboard },
  { label: "Gün Sonu", href: "/panel/gun-sonu", icon: CalendarCheck2 },
  { label: "Ödemeler", href: "/panel/odemeler/beklenen", icon: WalletMinimal },
  { label: "Analiz", href: "/panel/fark-analizi", icon: GitCompareArrows },
];
