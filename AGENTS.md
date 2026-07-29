# POSKontrol

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui fintech
web uygulaması. Bkz. proje kökündeki iki plan dokümanı:

- `POSKontrol_Claude_Gelistirme_Prompt_Paketi.md` — aşama aşama geliştirme
  promptları
- `POSKontrol_Uctan_Uca_UX_UI_Urun_Dokumani.md` — ürün ve UX/UI dokümanı

Şu an **Aşama 1 (iskelet/tasarım)**, **Aşama 2 (veritabanı/Prisma)**,
**Aşama 3 (Telegram doğrulamalı giriş)**, **Aşama 4 (ilk kurulum sihirbazı)**,
**Aşama 5 (bankalar/POS/tarifeler)**, **Aşama 6 (gün sonu girişi + hesaplama
motoru)**, **Aşama 7 (beklenen/gerçekleşen ödemeler)**, **Aşama 8 (ana
panel)**, **Aşama 9 (Fark Analizi Merkezi)**, **Aşama 10 (Sözleşme Analiz
Merkezi)**, **Aşama 11 (Sözleşme Karşılaştırma)**, **Aşama 12 (Telegram
Bildirimleri)**, **Aşama 13 (Raporlar)**, **Aşama 14 (Finans Asistanı)** ve
**Aşama 15 (Yönetici Paneli)** tamamlandı. `/admin/**` — platform çalışanları
için ayrı bir panel: **route ve yetki olarak** `(app)` tenant panelinden
tamamen bağımsız. Ayrı bir kimlik doğrulama sistemi kullanır —
`SystemAdmin` modeli (CompanyUser'dan bağımsız, e-posta/şifre — Node'un
yerleşik `scrypt`'i ile hash'lenir, bcrypt bağımlılığı eklenmedi),
`SystemAdminSession` (ayrı `ADMIN_SESSION_COOKIE_NAME` cookie'si,
`src/middleware.ts`'te `/admin` yolu için ayrı bir Edge kontrolü). Playwright
ile doğrulandı: tenant oturumu `/admin/**`'e erişemiyor, admin oturumu
tenant paneline sızmıyor, cookie'ler tamamen ayrı. Fonksiyonlar: müşteri
listesi/detayı, firma oluştur, paket/deneme/durum yönetimi, kullanıcı
ekle/pasife al/yönetici ata, Telegram eşleştirme kodu üret (yeni
`TelegramPairingCode` modeli + webhook'a entegre — `LoginApproval`dan farklı
olarak onay/red akışı yok, tek adımda hesabı bağlar), eksik veri uyarısı
gönder (yeni `MISSING_DATA_WARNING` bildirim türü), destek notları, global
audit log. `src/server/admin/admin-repository.ts` **kasıtlı olarak**
`TenantContext` almaz — tüm firmaları görebilmesi gerektiğinden
`prisma/TENANT_SECURITY.md`'nin tek istisnasıdır (erişim
`requireSystemAdminContext()` ile korunur). Ayrıca Aşama 13'teki bir eksiklik
giderildi: 7 rapor sayfası artık her görüntülemede `Report` tablosuna
gerçek bir kayıt yazıyor (`reportRepository.logGenerated()`) — yönetici
panelindeki "Son rapor" alanı buna dayanır. `/asistan` — doğal dilde soru/cevap sohbet ekranı. Mimari
katı: saf/deterministik anahtar kelime sınıflandırıcı
(`src/lib/finance-assistant/classify-intent.ts`, birim testli) → tenant'a
özel gerçek veriyi mevcut repository katmanından çekme (rapor, ödeme,
tarife, sözleşme repository'leri tekrar kullanılır) → risk/önerilen
kontrol/ilgili ekran deterministik olarak karara bağlanır →
`src/server/finance-assistant/mock-provider.ts` yalnızca doğal dil
anlatımını üretir (AI hesaplama yapmaz). Her yanıt veri kaynağını ve
"ilgili ekrana git" bağlantısını gösterir; kullanıcı yalnızca kendi
firmasının verisini görebilir (tüm erişim `ctx.companyId` ile sınırlı
repository katmanından geçer). "Son 12 ayda valör nedeniyle tahmini
maliyetim ne kadar?" sorusunda sistem bir faiz oranı varsayımı olmadan
kesin TL rakamı uydurmaz — yalnızca ortalama valör sürelerini raporlar. `/raporlar` — 7
gerçek rapor (günlük özet, aylık maliyet, banka/POS karşılaştırma, fark
raporu, yıllık maliyet ve pazarlık raporu, sözleşme analiz özeti);
`src/server/repositories/report-repository.ts`. "Fark" hesabı yalnızca
çözümlenmiş (gerçekleşen ödemesi kaydedilmiş) işlemler üzerinden yapılır —
tüm dönemin beklenen tutarıyla karıştırılmaz (bkz. `getBankComparison`
içindeki not); yıllık raporun yönetici özeti, çözümlenme oranı %50'nin
altındaysa gerçekleşen kesinti iddiasını atlar. Çıktı biçimleri: PDF
(tarayıcı yazdırma, `PrintButton`), Excel-uyumlu CSV (tablo raporları için,
`src/lib/csv.ts`), Telegram'da paylaşılabilir bağlantı (kullanıcının kendi
bağlı hesabına gönderilir, `/api/reports/send-telegram`). Rapor dili
tarafsız — "hatalı kesinti" değil "kontrol edilmelidir" (bkz.
`src/server/reports/summary-text.ts`, birim testli). `/bildirimler` — 10 bildirim türü (ödeme
hatırlatmaları, tarife/kampanya bitişi, ciro taahhüdü riski, kritik ayar
değişikliği vb.), tür bazlı açık/kapalı + sessiz saatler + günlük özet
saati tercihleri, rol bazlı yetkilendirme (`src/lib/notifications/role-
gate.ts`) ve retry/idempotency/delivery-log alanları (`Notification.
attemptCount`/`lastError`/`idempotencyKey`) ile çalışıyor. Gerçek bir cron
altyapısı yok — üretim+gönderim `/bildirimler` sayfasındaki "Bildirimleri
Kontrol Et" butonuyla manuel tetiklenir
(`src/server/notifications/notification-service.ts`). Telegram inline
butonları ("Ödeme Geldi" deep-link, "Daha Sonra Hatırlat" callback, "Paneli
Aç") ve "Daha Sonra Hatırlat" webhook işleyicisi eklendi.
`/sozlesmeler/[id]/karsilastir` — analizi tamamlanmış ve bir POS'a bağlı her
sözleşme için kayıtlı aktif tarifeyle ("Mevcut") sözleşme analizinden gelen
yapılandırılmış alanları ("Yeni") karşılaştırır; saf/deterministik
`src/lib/contract-comparison/` motoru (birim testli) avantajlı/dezavantajlı
etiketlerini üretir ve **asla imzala/imzalama kararı vermez**. "PDF yönetici
özeti" tarayıcı yazdırma akışıyla (`window.print()` + `print:hidden`
sınıfları) sağlanır — ayrı bir PDF kütüphanesi eklenmedi. Ana sayfa (`/`)
artık tamamen gerçek verilerle çalışıyor — `src/server/repositories/dashboard-repository.ts` özet
kartları, uyarıları, aylık grafik verisini ve banka bazlı maliyet özetini
hesaplıyor; `src/server/dashboard/smart-summary.ts` saf/deterministik bir
cümle üreticisi (yapay zekâ kullanmaz, birim testli). `/fark-analizi` artık
gerçek verilerle 3 katmanlı analiz gösteriyor (Seviye 1 matematiksel fark,
Seviye 2 kural kontrolü, Seviye 3 rule-based açıklama — henüz gerçek AI
servisi yok) ve banka/POS/şube/durum filtreleriyle filtrelenebiliyor; bkz.
`src/server/repositories/difference-repository.ts` ve zenginleştirilmiş
`src/lib/payment-comparison/` kural motoru (`reasonCode`/`riskLevel`
alanları). `/sozlesmeler` gerçek yükleme (PDF/JPG/PNG, çoklu sayfa) →
işleme boru hattı (yüklendi→metin çıkarılıyor→maddeler
sınıflandırılıyor→finansal etki hesaplanıyor→tamamlandı/manuel kontrol
gerekli) → 6 bölümlü sonuç ekranıyla çalışıyor; bkz.
`src/server/contract-analysis/provider.ts` (AI sağlayıcı arayüzü) ve
`mock-provider.ts` (gerçek API anahtarı yok — mock sabit analiz döner),
`src/server/repositories/contract-repository.ts` (boru hattı + eşzamanlı
çağrılara karşı P2002 idempotent yakalama). 21 aşamalık planın 15
geliştirme aşamasının tamamı bitti — kalan tek adım "Son Deployment
Promptu" (canlıya alma). Tüm modüller (veri katmanı, giriş/oturum, kurulum
sihirbazı, banka/POS/tarife yönetimi, gün sonu, ödeme karşılaştırma/fark
analizi motorları, ana panel, sözleşme analizi, sözleşme karşılaştırma,
Telegram bildirimleri, raporlar, finans asistanı, yönetici paneli) gerçek
PostgreSQL + Prisma 7 üzerinde çalışır durumda; hiçbir ekran artık sahte
veri veya "yapım aşamasında" placeholder kullanmıyor.

**Ek özellik — Telegram'dan gün sonu girişi:** kullanıcı isteği üzerine,
21 aşamalık planın dışında ek bir kolaylık olarak eklendi. Telegram botunda
`/gunsonu` komutu adım adım bir sohbet akışı başlatır (POS seç → tek çekim
tutarı → taksitli tutar → taksit sayısı → onay) ve web'deki
`dailySaleRepository.create()` ile aynı hesaplama/kayıt akışını kullanır —
iki giriş kanalı (web formu ve Telegram sohbeti) aynı sonuca çıkar. Sohbet
durumu `TelegramConversationState` modelinde tutulur; bkz.
`src/server/telegram/gun-sonu-conversation.ts`.

**Ek özellik — `/kullanicilar` ve `/ayarlar`:** iskelet aşamasından beri
menüde duran ama 21 aşamalık planın hiçbir stage'ine dahil edilmemiş iki
sayfa, production deployment sonrası kullanıcı isteğiyle dolduruldu.
`/kullanicilar` firma içi kullanıcı listesi/davet/rol değiştirme/pasife
alma ve Telegram eşleştirme kodu üretimini `src/server/repositories/
user-repository.ts` (tenant-scoped, `TENANT_SECURITY.md` desenine uyar)
üzerinden sağlar — `canManageUsers()` ile OWNER/MANAGER dışı roller
(ACCOUNTANT, "kritik ayarları değiştiremez") salt-okunur görür, kimse
kendi rolünü değiştiremez/kendini pasife alamaz. `/ayarlar` firma profili
düzenleme (`company-settings-repository.ts`, onboarding'in
`companyInfoSchema`'sını yeniden kullanır) + "Hesabım" (kendi ad/e-posta/
telefon) + `/bildirimler`'e bağlantı içerir. Bu iki sayfa gerçek
`userName`/`companyName` değerlerini `AppShell`'e prop olarak geçiyor —
`AppShell`'in varsayılan "Şenol Bey"/"Örnek Ticaret A.Ş." değerleri hâlâ
diğer ~27 sayfada kullanılıyor (bilinen, henüz giderilmemiş bir eksiklik).

**Hesaplama motoru kuralı:** `src/lib/tariff-engine/` UI'dan/Prisma'dan
tamamen bağımsız saf fonksiyonlardır — Prisma tipi, `@/lib/prisma`, React
veya Next.js import ETMEZ. DB↔motor eşlemesi sınırda
(`src/server/tariff/to-calculation-input.ts`) yapılır. Yeni bir hesaplama
kuralı eklerken bu ayrımı bozmayın; `npm run test` ile birim testleri
çalıştırın.

**Önemli — çok adımlı client formlar:** Ara "İleri" adımlarında native
`<form onSubmit>` kullanmayın. React 19 + Next.js 15'te, bir `type="button"`
tıklamasının `onClick` içinde `await` sonrası `setState` çağırması, formu
sarmalayan `<form>` varsa son adımdaki gizli submit'i (veya `handleSubmit`'i)
yanlışlıkla tetikleyebiliyor (Aşama 5'te tarife sihirbazında gerçek bir
double-submit bug'ı olarak gözlemlendi — bkz. `tariff-wizard.tsx`). Çözüm:
adım içeriğini düz bir `<div>` içine koyun, son adımın "Kaydet" butonu
`type="button"` kalsın ve `onClick={form.handleSubmit(onSubmit)}` ile
doğrudan tetiklensin — native form submit event'ine hiç güvenmeyin.

Yeni bir firma onboarding'i tamamlamadan (`Company.onboardingCompletedAt`
boş) `(app)` grubundaki hiçbir sayfayı göremez — `/kurulum`'a yönlendirilir.
Yeni bir modül/sayfa eklerken bunu hesaba katın (test firmalarının çoğu
zaten onboarding'i tamamlanmış durumda — bkz. seed script).

Tüm `(app)` route grubu altındaki sayfalar (`src/app/(app)/...`, yani `/`,
`/bankalar`, `/tarifeler`, ... hepsi) oturum zorunludur — bkz. §"Giriş"
bölümü. `/login/**`, `/showcase` ve `/api/**` bu korumanın dışındadır.

## Kurallar

- TypeScript strict açık, `any` kullanma.
- Para: tr-TR formatı, `src/lib/format.ts` içindeki `formatCurrency`/`formatDate`.
  Veritabanında tüm para/oran alanları `Decimal`.
- Tarih: GG.AA.YYYY.
- Dark mode yok, yalnızca açık tema (`src/app/globals.css`).
- Ortak bileşenler `src/components/shared/`, sayfa düzeni `src/components/layout/`.
- Yeni bir sayfa eklerken `AppShell` ile sarmalayın; nav girişini
  `src/lib/nav-items.ts` üzerinden ekleyin.
- Veritabanına her erişim `src/server/repositories/` altındaki repository
  katmanı üzerinden olur; doğrudan `src/lib/prisma` sayfa/route kodundan
  çağrılmaz. Tenant izolasyonu kuralları için **mutlaka**
  [`prisma/TENANT_SECURITY.md`](prisma/TENANT_SECURITY.md) dosyasına bakın —
  özellikle `findUnique({ where: { id } })` yasağı ve tarife sürümleme kuralı.
- Prisma 7 kullanıyoruz (training verinizdeki Prisma'dan farklı: driver
  adapter zorunlu, `prisma.config.ts`, `output` zorunlu). Şema/istemci
  değişikliği yapmadan önce `.agents/skills/prisma-*` altındaki referans
  dosyalarını okuyun.
- Giriş/oturum: `src/server/auth/` — `login-approval-service.ts` (Telegram
  akışı), `session-service.ts` (cookie/oturum), `require-tenant-context.ts`
  (sayfa içinde zorunlu kontrol). Yeni bir server component sayfası
  eklerken tenant verisine erişmeden önce `requireTenantContext()`'i
  çağırın (ya da `(app)` grubunun layout'una güvenin).
- `src/middleware.ts` Edge runtime'da çalışır — Prisma'yı **import etmeyin**
  (bkz. `src/server/auth/cookie.ts`, DB'siz sabitler için ayrı tutuldu).
