# POSKontrol

"POS'unuzu değil, maliyetinizi yönetin." — banka POS tarifelerini kaydeden,
gün sonu satışlarını girip beklenen/gerçekleşen ödemeleri karşılaştıran ve
sözleşmeleri yapay zekâ ile analiz eden mobil öncelikli fintech uygulaması.

Tamamlanan aşamalar:

- **Aşama 1 — Proje İskeleti ve Tasarım Sistemi**: Next.js iskeleti, tasarım
  sistemi, ortak bileşenler. Ekranlar hâlâ sahte veriyle veya placeholder.
- **Aşama 2 — Veritabanı ve Prisma**: 27 tablolık PostgreSQL şeması, tenant
  izolasyonu, tarife sürümleme, seed verisi, örnek repository katmanı.
- **Aşama 3 — Telegram Doğrulamalı Giriş**: zorunlu Telegram onay akışı,
  oturum yönetimi, `(app)` route grubu için auth middleware + guard, yerel
  geliştirme için dev-login.
- **Aşama 4 — İlk Kurulum Sihirbazı**: `/kurulum` — 5 adımlı (firma, banka,
  POS, resmî tarife, kontrol/onay) sihirbaz, otomatik taslak kaydetme, Zod
  doğrulama, tarife girilmeden kurulum tamamlanamaz.
- **Aşama 5 — Bankalar, POS'lar ve Tarifeler**: `/bankalar` gerçek verilerle
  çalışıyor; banka detayında 6 sekme (Genel/POS'lar/Tarifeler/Ödemeler/
  Belgeler/Raporlar); tam 8 bölümlü resmî tarife sihirbazı (Kimlik, Tek
  Çekim, Taksit, Kart/İşlem Türleri, Sabit Ücretler, Valör ve Ödeme,
  Taahhütler, Belge ve Onay) — yeni sürüm eklendiğinde eskiyi otomatik kapatıp
  supersede ediyor.
- **Aşama 6 — Gün Sonu Girişi**: `/gun-sonu` — dinamik satış satırları, saf
  TypeScript hesaplama motoru (`src/lib/tariff-engine/`, birim testli),
  Hesapla önizlemesi ve kayıt sonrası `expected_payments` oluşturma. Tarife
  eksikse hesaplama yapılmaz.
- **Aşama 7 — Beklenen ve Gerçekleşen Ödemeler**: `/odemeler/beklenen`
  (Bugün/Yarın/Bu hafta/Geciken + banka/POS/şube filtreleri), "Hesabıma
  Geçti" → gerçekleşen ödeme formu → otomatik fark hesabı (saf
  `src/lib/payment-comparison/`, birim testli) ve doküman diliyle birebir
  eşleşen sonuç mesajları (uyumlu/kontrol edilmeli/gecikmiş). Yuvarlama
  toleransı formda ayarlanabilir. `/odemeler/gerceklesen` geçmiş kayıtları
  listeler.
- **Aşama 8 — Ana Panel**: `/` artık gerçek verilerle çalışıyor — 4 özet
  kartı (bugün beklenen/hesaba geçen, bu ay toplam kesinti, kontrol
  edilmesi gereken fark), bekleyen ödemeler, gerçek `PaymentDifference`/
  gecikme/tarifesiz POS verisinden türetilen son uyarılar, Recharts ile
  aylık ciro/kesinti grafiği ve banka bazlı maliyet özeti (masaüstünde
  tablo, mobilde kart listesi). Akıllı özet metni
  (`src/server/dashboard/smart-summary.ts`) tamamen deterministiktir,
  yapay zekâ kullanmaz.
- **Aşama 9 — Fark Analizi Merkezi**: `/fark-analizi` banka/POS/şube/durum
  filtreleriyle tüm fark kayıtlarını 3 katmanlı gösterir — Seviye 1
  (beklenen/gerçekleşen/fark/fark yüzdesi), Seviye 2 (ilgili tarife, kayıtlı
  oran, tahmini uygulanan oran, valör ve ek ücret uyumu) ve Seviye 3
  (rule-based olası neden, kontrol edilecek belge, bankaya sorulacak soru,
  risk seviyesi, önerilen işlem — henüz gerçek AI servisi bağlanmadı).
  `src/lib/payment-comparison/` motoru artık her farka bir `reasonCode` ve
  `riskLevel` atıyor; doküman §14'teki örnekteki gibi tek bir kesin neden
  iddia etmek yerine birden çok olası nedeni birlikte sunuyor.
- **Aşama 10 — Sözleşme Analiz Merkezi**: `/sozlesmeler` gerçek dosya
  yüklemeyle (PDF/JPG/PNG, çoklu sayfa, kamera) çalışıyor. Yükleme sonrası
  boru hattı gerçek DB durum geçişleriyle ilerler (`yüklendi` →
  `metin çıkarılıyor` → `maddeler sınıflandırılıyor` →
  `finansal etki hesaplanıyor` → `tamamlandı`/`manuel kontrol gerekli`),
  istemci bunu polling ile izler. Sonuç ekranı 6 bölümden oluşur: 60
  saniyelik özet, avantajlar, dikkat edilmesi gerekenler + kritik maddeler,
  finansal etki, bankaya sorulacak sorular, şerh/düzeltme önerileri — sabit
  "hukukî/finansal danışmanlık yerine geçmez" uyarısıyla. AI entegrasyonu
  `src/server/contract-analysis/provider.ts` arayüzü üzerinden soyutlanmış;
  şimdilik yalnızca `mock-provider.ts` var (gerçek API anahtarı koda
  yazılmadı) — doküman §15.3'teki örnek analizi sabit döner. Eşzamanlı
  analiz çağrılarına (çift sekme/istek) karşı `contract-repository.ts`
  P2002 unique-constraint çakışmasını yakalayıp idempotent davranır.
- **Aşama 11 — Sözleşme Karşılaştırma**: `/sozlesmeler/[id]/karsilastir`
  (analizi tamamlanmış ve bir POS'a bağlı sözleşmelerde "Mevcut Tarifeyle
  Karşılaştır" butonuyla erişilir) kayıtlı aktif tarifeyi ("Mevcut") ve
  sözleşme analizinden gelen yapılandırılmış alanları ("Yeni") yan yana
  gösterir — tek çekim/2-12 taksit oranları, valör, aylık cihaz ücreti,
  diğer sabit ücretler, ciro taahhüdü, erken fesih, otomatik yenileme,
  ticari/yabancı kart, tarife değişiklik yetkisi. `src/lib/contract-
  comparison/` saf/deterministik karşılaştırma motoru (birim testli)
  avantajlı/dezavantajlı etiketlerini üretir, tahmini aylık/yıllık maliyet
  etkisini hesaplar (gerçek aylık ciro yoksa sözleşmedeki ciro taahhüdü
  varsayılır) ve doküman §16'daki gibi kısa bir karar özeti yazar — sistem
  hiçbir zaman "imzalayın/imzalamayın" kararı vermez. "PDF yönetici özeti"
  tarayıcının yazdırma akışıyla sağlanır (ayrı bir PDF kütüphanesi yok).
- **Aşama 12 — Telegram Bildirimleri**: `/bildirimler` gerçek verilerden
  (beklenen ödemeler, tarife/kampanya bitişi, ciro taahhüdü riski vb.) 10
  farklı bildirim türü üretir; tür bazlı açık/kapalı, sessiz saatler ve
  günlük özet saati tercihleri kaydedilebilir. Rol bazlı yetkilendirme
  (`src/lib/notifications/role-gate.ts`) hangi bildirimin hangi role
  gideceğini belirler. `Notification` modeli `idempotencyKey` (yineleme
  engeli), `attemptCount`/`lastError` (retry) ve `status` (delivery log)
  alanlarıyla genişletildi. Telegram mesajlarında inline butonlar (Ödeme
  Geldi / Daha Sonra Hatırlat / Paneli Aç) bulunur — "Daha Sonra Hatırlat"
  gerçek bir webhook callback'iyle işlenir. Gerçek bir zamanlayıcı (cron)
  yok; üretim + gönderim `/bildirimler` sayfasındaki "Bildirimleri Kontrol
  Et" butonuyla tetiklenir.
- **Ek özellik — Telegram'dan gün sonu girişi**: kullanıcı isteği üzerine
  21 aşamalık planın dışında eklendi. Telegram'da `/gunsonu` komutu adım
  adım bir sohbet başlatır (POS seç → tek çekim tutarı → taksitli tutar →
  taksit sayısı → onay) ve web formuyla birebir aynı hesaplama/kayıt
  akışını (`dailySaleRepository.create()`) kullanır.
- **Aşama 13 — Raporlar**: `/raporlar` yedi gerçek rapor sunar — günlük
  özet, aylık maliyet, banka karşılaştırma, POS karşılaştırma, fark
  raporu, yıllık maliyet ve pazarlık raporu (doküman §17'deki en kapsamlı
  rapor: kapak, yönetici özeti, banka/POS analizi, gelecek yıl tahmini,
  pazarlık önerileri, veri kaynakları) ve sözleşme analiz özeti. Tüm
  raporlar `src/server/repositories/report-repository.ts` üzerinden
  gerçek verilerle çalışır. "Fark" yalnızca çözümlenmiş (gerçekleşen
  ödemesi kaydedilmiş) işlemler üzerinden hesaplanır; yıllık raporun
  yönetici özeti çözümlenme oranı düşükse (< %50) gerçekleşen kesinti
  iddiasını atlayıp yalnızca beklenen tutarı gösterir — yanıltıcı
  kıyaslamayı önler. Çıktı biçimleri: PDF (tarayıcı yazdırma), Excel
  uyumlu CSV (`src/lib/csv.ts`, tablo raporları için), Telegram'da
  paylaşılabilir bağlantı (`/api/reports/send-telegram`, kullanıcının
  kendi bağlı Telegram hesabına gönderilir). Rapor dili tarafsız —
  "hatalı kesinti" değil "kayıtlı koşullarla beklenen tutar arasında
  fark" (bkz. `src/server/reports/summary-text.ts`, birim testli).
- **Aşama 14 — Finans Asistanı**: `/asistan` doğal dilde soru/cevap sohbet
  ekranı. Katmanlar: saf/deterministik anahtar kelime sınıflandırıcı
  (`src/lib/finance-assistant/classify-intent.ts`, birim testli) → gerçek
  veriyi mevcut repository katmanından çekme (rapor/ödeme/tarife/sözleşme
  repository'leri tekrar kullanılır — yeni veri erişim kodu yazılmadı) →
  risk/önerilen kontrol/ilgili ekran bağlantısı deterministik servis
  katmanında karara bağlanır → `src/server/finance-assistant/mock-
  provider.ts` yalnızca doğal dil anlatımını üretir (AI hesaplama yapmaz,
  gerçek API anahtarı yok). Her yanıt 5 bölümden oluşur: net cevap, veri
  kaynağı, olası risk, önerilen kontrol, ilgili ekrana git. Kullanıcı
  yalnızca kendi firmasının verisini görebilir. "Valör nedeniyle tahmini
  maliyet" gibi bir faiz oranı varsayımı gerektiren sorularda sistem
  uydurma bir TL rakamı vermez, yalnızca elindeki gerçek veriyi
  (ör. ortalama valör günü) raporlar.
- **Aşama 15 — Yönetici Paneli**: `/admin/**` platform çalışanları için
  ayrı bir panel — normal kullanıcı panelinden **route ve yetki olarak
  tamamen ayrı**. Ayrı bir kimlik doğrulama kullanır: `SystemAdmin`
  (e-posta/şifre, Node'un yerleşik `scrypt` KDF'i ile hash'lenir — bcrypt
  eklenmedi), `SystemAdminSession` (ayrı `poskontrol_admin_session`
  cookie'si). `src/middleware.ts` `/admin` yolu için tamamen ayrı bir Edge
  kontrolü uygular. Fonksiyonlar: müşteri listesi ve firma detayı (kullanıcılar,
  bankalar, POS'lar, tarife kayıtları, veri giriş sıklığı, son rapor,
  kritik uyarılar, Telegram geçmişi), firma oluştur, paket/deneme
  süresi/durum yönetimi, kullanıcı ekle/pasife al/yönetici ata, Telegram
  eşleştirme kodu üret (yeni `TelegramPairingCode` modeli — `LoginApproval`
  akışından farklı olarak onay/red adımı yok, tek adımda hesabı bağlar),
  eksik veri uyarısı gönder, destek notları, tüm firmalar genelinde audit
  log. `src/server/admin/admin-repository.ts` kasıtlı olarak `TenantContext`
  almaz (tüm firmaları görebilmesi gerekir) — bu,
  [`prisma/TENANT_SECURITY.md`](prisma/TENANT_SECURITY.md)'nin belgelenmiş
  tek istisnasıdır; erişim ayrı oturum sistemiyle korunur. Playwright ile
  doğrulandı: tenant oturumu admin paneline giremiyor, admin oturumu tenant
  paneline sızmıyor. Ayrıca bu aşamada Aşama 13'teki bir eksiklik giderildi:
  7 rapor sayfası artık her görüntülemede gerçek bir `Report` kaydı
  oluşturuyor (önceden hesaplanıyordu ama hiç loglanmıyordu).

## Hesaplama motoru

`src/lib/tariff-engine/` UI'dan ve Prisma'dan tamamen bağımsız saf
fonksiyonlardır (Decimal.js, `decimal.js` paketiyle — floating point yok).
Resmî tatil takvimi `HolidayCalendar` arayüzüyle soyutlanmıştır
(`StaticTurkishHolidayCalendar` yalnızca sabit tarihli millî bayramları
içerir; dinî bayramlar (Ramazan/Kurban) için gerçek bir veri kaynağı
production öncesi eklenmelidir — bkz. dosyadaki not). Komisyon matematiği ve
tarih hesaplama tamamen deterministiktir, yapay zekâ kullanılmaz.

```bash
npm run test   # vitest — hesaplama motoru birim testleri
```

Prisma verisini motorun beklediği girdiye çeviren eşleme
`src/server/tariff/to-calculation-input.ts` içindedir; DB'ye yazan asıl akış
`src/server/repositories/daily-sale-repository.ts`.

Aynı şekilde `src/lib/payment-comparison/` de UI/DB'den bağımsız saf bir
karşılaştırma motorudur (Seviye 1: matematiksel fark, Seviye 2: kural
kontrolü) — beklenen/gerçekleşen tutarı, gecikme gününü ve kural tabanlı
açıklamayı üretir. DB'ye yazan akış
`src/server/repositories/actual-payment-repository.ts`.

## Teknoloji

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui (Radix) · Inter · PostgreSQL · Prisma 7 (driver adapter: `pg`)

## Veritabanı

Yerel geliştirme için Docker ile PostgreSQL:

```bash
docker run -d --name nocpos-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nocpos \
  -p 55432:5432 postgres:16-alpine
```

`.env` içindeki `DATABASE_URL` bu konteynerin bağlantı dizesini gösterir.
Ardından:

```bash
npx prisma migrate dev   # şemayı uygula
npx prisma generate      # istemciyi üret (src/generated/prisma)
npx prisma db seed       # örnek firma/banka/POS/tarife verisi
```

Tenant izolasyonu, soft-delete ve tarife sürümleme kuralları için
[`prisma/TENANT_SECURITY.md`](prisma/TENANT_SECURITY.md) dosyasına bakın.
Repository katmanı örnekleri: `src/server/repositories/`.

**Not:** Prisma 7 kullanıyoruz — driver adapter (`@prisma/adapter-pg`)
zorunlu, istemci `src/generated/prisma` altına üretiliyor,
bağlantı dizesi `prisma.config.ts` içinde tanımlı (artık `schema.prisma`
içinde değil). Ayrıntılar için `.agents/skills/prisma-upgrade-v7/`.

## Giriş / kimlik doğrulama

Giriş yalnızca Telegram doğrulamasıyla çalışır — kullanıcı adı/şifre yoktur.
Akış: `/login` → "Telegram ile Doğrula" → kullanıcı Telegram botunda
Onayla/Reddet seçer → `/login/waiting` onayı algılar → `/app` oturumu kurup
gerçek panele (`/`) yönlendirir. `httpOnly` çerezdeki oturum,
`src/middleware.ts` (Edge, yalnızca cookie var/yok kontrolü) ve
`src/server/auth/require-tenant-context.ts` (Node runtime, gerçek DB
doğrulaması — `(app)` route grubunun layout'unda çalışır) tarafından çift
katmanlı korunur.

**Gerçek bir Telegram botu olmadan** (bu ortamda `TELEGRAM_BOT_TOKEN` boş)
yerel geliştirme için `/login` sayfasında seed edilmiş kullanıcılarla anında
giriş yapılabilen bir "Yerel geliştirme girişi" paneli görünür
(`DEV_LOGIN_ENABLED=true` + `NODE_ENV !== production` şartıyla). Production'da
bu değişkeni tanımlamayın.

Gerçek bir bot bağlamak için:

1. BotFather'dan token alın → `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
2. Rastgele bir sır belirleyin → `TELEGRAM_WEBHOOK_SECRET`
3. `telegramBotClient.setWebhook("https://<domain>/api/telegram/webhook", secret)` çağrısını bir kere çalıştırın (bkz. `src/server/telegram/bot-client.ts`)

Ayrıntılar ve tenant/replay/expiry kuralları için
[`prisma/TENANT_SECURITY.md`](prisma/TENANT_SECURITY.md) ve
`src/server/auth/` altındaki servisler.

### Yönetici paneli girişi

`/admin/login` normal kullanıcı girişinden tamamen ayrıdır (e-posta/şifre,
ayrı oturum/cookie — bkz. `src/server/admin/`). Seed script yerel
geliştirme için bir sistem yöneticisi oluşturur:

```
admin@poskontrol.local / admin123
```

## İlk kurulum sihirbazı

Yeni bir firma ilk giriş yaptığında (`Company.onboardingCompletedAt` boşsa)
`(app)` route grubunun layout'u kullanıcıyı otomatik olarak `/kurulum`'a
yönlendirir. Sihirbaz `src/server/onboarding/` (Zod şemaları +
`onboarding-service.ts`) ve `src/components/onboarding/` altında yaşar; her
adım kendi API route'una (`/api/onboarding/step-1..4`) gerçek veri yazar,
`/api/onboarding/draft` alan değişikliklerini 800ms sessizlikten sonra
otomatik kaydeder (sayfa yenilense de kaldığı adımdan devam eder). Belge
yüklemeleri `src/server/storage/file-storage.ts` üzerinden `public/uploads`
altına yazılır (yalnızca dev — production'da S3 ile değiştirin).

Sihirbazı test etmek için seed script'i onboarding'i tamamlanmamış bir firma
da oluşturur ("Yeni Firma Sahibi" — `/login` sayfasındaki dev-login
listesinde görünür).

## Çalıştırma

```bash
npm install
npm run dev
```

`http://localhost:3000` — ana panel önizlemesi
`http://localhost:3000/showcase` — sahte verilerle bileşen vitrini

```bash
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit  # strict tip kontrolü
```

## Proje yapısı

- `src/app/` — rotalar (her rota `AppShell` ile sarmalanır)
- `src/components/layout/` — `AppShell`, `Sidebar`, `TopBar`, `MobileBottomNav`, `PageHeader`
- `src/components/shared/` — `StatCard`, `BankCard`, `PosCard`, `PaymentCard`,
  `StatusBadge`, `AlertBanner`, `EmptyState`, `LoadingSkeleton`,
  `ConfirmDialog`, `CurrencyInput`, `DateInput`, `FileUploader`
- `src/components/ui/` — shadcn/ui primitifleri
- `src/lib/format.ts` — `formatCurrency` (tr-TR, "33.742,50 TL"), `formatDate` (GG.AA.YYYY)
- `src/lib/nav-items.ts` — masaüstü/mobil menü tanımları
- `src/lib/mock-data.ts` — showcase ve ana sayfa için sahte veri

## Responsive test kontrol listesi

- [ ] Mobilde (375–430px) yatay kaydırma yok
- [ ] Tüm tıklanabilir butonlar en az 48px yüksekliğinde
- [ ] Mobil alt menü (5 öğe) ve masaüstü sol menü (13 öğe) tutarlı rotalara gider
- [ ] Para her yerde "33.742,50 TL" biçiminde (tabular rakamlar)
- [ ] Tarih her yerde GG.AA.YYYY biçiminde
- [ ] Kartlar mobilde tek sütun, masaüstünde çoklu sütun
- [ ] Yalnızca açık tema; dark mode yok
- [ ] `npx tsc --noEmit` ve `npm run lint` hatasız geçer
