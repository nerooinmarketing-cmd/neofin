import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  FileSearch2,
  GitCompareArrows,
  MessageCircleQuestion,
  PlayCircle,
  WalletMinimal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteRequestForm } from "@/components/landing/quote-request-form";

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "Gün Sonu Girişi",
    description:
      "Günlük POS satışlarınızı (tek çekim + taksitli) tek ekrandan girin — web'den veya Telegram'dan.",
  },
  {
    icon: WalletMinimal,
    title: "Beklenen / Gerçekleşen Ödemeler",
    description:
      "Bankadan hesabınıza geçmesi gereken tutar ile gerçekte geçen tutarı otomatik karşılaştırır.",
  },
  {
    icon: GitCompareArrows,
    title: "Fark Analizi Merkezi",
    description:
      "3 katmanlı analiz: matematiksel fark, kural kontrolü ve açıklama — banka/POS/şube bazında filtrelenebilir.",
  },
  {
    icon: FileSearch2,
    title: "Sözleşme Analizi ve Karşılaştırma",
    description:
      "Banka sözleşmenizi yükleyin, kritik maddeler ve finansal etkiler otomatik çıkarılsın; yeni teklifleri mevcut tarifenizle karşılaştırın.",
  },
  {
    icon: Bell,
    title: "Telegram Bildirimleri",
    description:
      "Ödeme hatırlatmaları, tarife bitişi, ciro taahhüdü riski gibi durumlar Telegram'a düşer — kritik ayar değişikliklerinden haberdar olun.",
  },
  {
    icon: BarChart3,
    title: "Raporlar",
    description:
      "Günlük, aylık, banka/POS karşılaştırma, fark ve yıllık maliyet/pazarlık raporları — PDF, Excel-uyumlu ve Telegram'da paylaşılabilir.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Finans Asistanı",
    description:
      "\"Bu ay en çok kesinti yapan banka hangisi?\" gibi soruları doğal dilde sorun, gerçek verinize dayanan yanıt alın.",
  },
  {
    icon: CheckCircle2,
    title: "Kullanıcı ve Yetki Yönetimi",
    description:
      "Firmanızdaki herkese rol bazlı erişim tanımlayın — kritik ayarları kimin değiştirebileceğini siz belirleyin.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Banka ve POS bilgilerinizi girin",
    description: "Bankanızın size verdiği resmî POS Bilgi Formundaki oran ve ücretleri bir kez kaydedin.",
  },
  {
    number: "2",
    title: "Günlük satışlarınızı girin",
    description: "Her gün sonunda tek çekim ve taksitli tutarları girin — 1 dakikadan kısa sürer.",
  },
  {
    number: "3",
    title: "Sistem otomatik hesaplasın",
    description: "Beklenen ödeme tutarları, valör süreleri ve kesintiler kayıtlı tarifenize göre hesaplanır.",
  },
  {
    number: "4",
    title: "Farkları görün, kontrol edin",
    description: "Beklenenle gerçekleşen arasında fark varsa anında görün, bankayla görüşmeye hazır rapor alın.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
              P
            </span>
            <span className="font-heading text-lg font-semibold text-navy">POSKontrol</span>
          </div>
          <Button asChild variant="outline">
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
                Bankalar bu farkları size anlatmaz
              </span>
              <h1 className="font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Yıl sonunda POS kesintilerinizin ne kadar tuttuğunu biliyor musunuz?
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Valör süreleri, sabit ücretler, kampanya sonrası oran değişiklikleri — çoğu işletme
                bunları hiç fark etmeden ödüyor. POSKontrol, kayıtlı tarifenizle bankadan gerçekten
                gelen tutarı otomatik karşılaştırır ve nerede kontrol etmeniz gerektiğini gösterir.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href="#teklif-alin">
                    Teklif Alın
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#nasil-calisir">Nasıl Çalışır?</a>
                </Button>
              </div>
            </div>
            <Card className="border-none bg-navy text-navy-foreground shadow-xl">
              <CardContent className="space-y-4 p-8">
                <p className="text-sm font-medium text-navy-foreground/70">Örnek: Fark Analizi</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
                    <span className="text-sm">Beklenen tutar</span>
                    <span className="tabular-money font-semibold">₺48.250,00</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
                    <span className="text-sm">Hesaba geçen tutar</span>
                    <span className="tabular-money font-semibold">₺46.910,00</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-danger/20 px-4 py-3">
                    <span className="text-sm">Kontrol edilmesi gereken fark</span>
                    <span className="tabular-money font-semibold text-danger-foreground">₺1.340,00</span>
                  </div>
                </div>
                <p className="text-xs text-navy-foreground/60">
                  Gerçek panelden alınmış örnek görünümdür — kendi verinizle otomatik oluşur.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Küçük farklar, yıl sonunda büyük rakamlara dönüşür
            </h2>
            <p className="mt-3 text-muted-foreground">
              Her işlemde birkaç kuruşluk fark önemsiz görünebilir. Ama onlarca banka/POS,
              yüzlerce işlem ve 12 ay üst üste geldiğinde toplam etki çoğu zaman fark
              edilenden çok daha büyük olur.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Tek panelde ihtiyacınız olan her şey
              </h2>
              <p className="mt-3 text-muted-foreground">
                POSKontrol, banka/POS yönetiminden fark analizine, sözleşme kontrolünden
                raporlamaya kadar tüm süreci tek yerde toplar.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="space-y-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                      <feature.icon className="size-5" />
                    </span>
                    <p className="font-heading font-semibold text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Nasıl çalışır?</h2>
            <p className="mt-3 text-muted-foreground">4 adımda kurulum tamamlanır, sonrası otomatik işler.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.number} className="space-y-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground">
                  {step.number}
                </span>
                <p className="font-heading font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Video placeholder */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                2 dakikada POSKontrol
              </h2>
              <p className="mt-3 text-muted-foreground">
                Panelin gerçek görünümünü ve fark analizinin nasıl çalıştığını izleyin.
              </p>
            </div>
            <div className="mt-8 flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <PlayCircle className="size-14" />
                <p className="text-sm font-medium">Tanıtım videosu yakında</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quote request */}
        <section id="teklif-alin" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Firmanız için teklif alın
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sabit bir fiyat listesi yayınlamıyoruz — bankalarınızı ve POS sayınızı öğrenip
              size özel bir teklifle birebir görüşmek istiyoruz. Formu doldurun, sizi arayalım.
            </p>
          </div>
          <Card className="mt-8">
            <CardContent className="p-6 sm:p-8">
              <QuoteRequestForm />
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-navy-foreground/70">© {new Date().getFullYear()} POSKontrol</p>
          <Link href="/login" className="text-sm font-medium hover:underline">
            Zaten müşterimisiniz? Giriş yapın →
          </Link>
        </div>
      </footer>
    </div>
  );
}
