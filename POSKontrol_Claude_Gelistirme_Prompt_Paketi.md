# Claude Geliştirme Prompt Paketi
## POSKontrol Projesini Modül Modül Kodlatma Planı

> Bu dosyayı Claude’a tek seferde “hepsini yap” diye vermeyin. Önce ana bağlamı verin, ardından aşağıdaki aşamaları sırayla kodlatın. Her aşamadan sonra projeyi çalıştırın, hataları düzeltin ve sonra sonraki aşamaya geçin.

---

# 1. Claude’a İlk Verilecek Ana Bağlam

Aşağıdaki metni ilk mesaj olarak verin:

```text
POSKontrol isimli, mobil öncelikli, tam responsive bir finansal teknoloji web uygulaması geliştiriyoruz.

Amaç:
İşletmelerin banka POS tarifelerini kaydetmesi, günlük tek çekim/taksitli satışlarını girmesi, kayıtlı komisyon ve valör kurallarına göre beklenen net ödemeyi hesaplaması, banka hesabına geçen gerçek tutarla karşılaştırması ve farkları raporlamasıdır.

Ek olarak kullanıcı yeni bir POS veya banka sözleşmesini PDF/fotoğraf olarak yükleyerek yapay zekâ destekli sözleşme analizi alacaktır. Sistem sözleşmeyi avantajlar, riskler, finansal etki, bankaya sorulacak sorular ve mevcut sözleşmeyle karşılaştırma başlıklarında özetleyecektir.

Giriş yalnızca Telegram doğrulamasıyla çalışacaktır. Kullanıcı web linkini açar, Telegram botundan giriş onayı verir, Telegram hesabı sistemde kayıtlı bir firma kullanıcısıyla eşleşiyorsa panel açılır. Kayıtlı değilse panel açılmaz.

Temel prensipler:
- Mobile-first ve tam responsive
- Her ekran tek iş yaptırır
- Finansal hesaplamalar deterministik kurallarla yapılır
- Yapay zekâ matematik için değil; belge analizi, açıklama ve karar desteği için kullanılır
- Tarife kayıtları sürümlenir, eski tarife silinmez
- Kullanıcıya “banka hatalı kesti” denmez; “kayıtlı koşullarla beklenen tutar arasında fark var” denir
- Türkçe arayüz
- Para formatı tr-TR, örnek: 33.742,50 TL
- Tarih formatı GG.AA.YYYY
- Erişilebilir, sade, güven veren fintech tasarımı

Teknoloji:
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- NextAuth yerine özel Telegram oturum akışı
- Zod
- React Hook Form
- Recharts
- PDF üretimi için sunucu taraflı çözüm
- Dosya depolama için S3 uyumlu yapı
- API katmanında servis/repository ayrımı

Kod standartları:
- Bileşenler modüler olsun
- TypeScript strict açık olsun
- any kullanılmasın
- Tüm formlar Zod ile doğrulansın
- Hesaplama motoru UI’dan bağımsız saf fonksiyonlar olarak yazılsın
- Finansal işlemlerde floating point yerine Decimal kullanılmalı
- Kritik işlemler audit log üretmeli
- Her modül için loading, empty, error ve success state hazırlanmalı
- Masaüstü ve mobil görünümler ayrı ayrı test edilmeli

Ben sana modülleri sırayla vereceğim. Her modülde önce dosya yapısını, sonra kodu, sonra kurulum/test adımlarını ver. Mevcut kodu bozmadan ilerle.
```

---

# 2. Aşama 1 — Proje İskeleti ve Tasarım Sistemi

Claude’a şu promptu verin:

```text
Şimdi yalnızca proje iskeletini ve tasarım sistemini kur.

İstenenler:
1. Next.js 15 + TypeScript + Tailwind + shadcn/ui yapılandırması
2. Türkçe fintech tasarım sistemi
3. Renk tokenları:
   - navy #11213A
   - primary #2F6BFF
   - background #F5F7FB
   - success #16875B
   - warning #D97706
   - danger #C43D3D
4. Inter veya Manrope fontu
5. Para rakamlarında tabular numbers
6. Responsive AppShell:
   - masaüstünde sol menü
   - mobilde alt sabit menü
   - üst bar, bildirim, firma seçici, profil
7. Ortak bileşenler:
   - StatCard
   - BankCard
   - PosCard
   - PaymentCard
   - StatusBadge
   - AlertBanner
   - EmptyState
   - LoadingSkeleton
   - ConfirmDialog
   - CurrencyInput
   - DateInput
   - FileUploader
8. Sahte verilerle component showcase sayfası
9. Dark mode yapma; yalnızca açık tema
10. Henüz veritabanı ve Telegram entegrasyonu yapma

Çıktı:
- Dosya yapısı
- Tüm gerekli kodlar
- Çalıştırma komutları
- Responsive test kontrol listesi
```

Kabul kriterleri:

- Mobilde yatay kaydırma yok
- Butonlar en az 48 px
- Menü mobil ve masaüstünde tutarlı
- Para 33.742,50 TL biçiminde
- Ortak bileşenler tekrar kullanılabilir

---

# 3. Aşama 2 — Veritabanı ve Prisma

```text
Şimdi PostgreSQL ve Prisma veri modelini kur.

Tablolar:
companies
company_users
telegram_accounts
login_approvals
branches
banks
bank_contacts
pos_devices
tariff_versions
tariff_single_payment_rates
tariff_installment_rates
tariff_fees
tariff_commitments
tariff_documents
daily_sales
daily_sales_items
expected_payments
actual_payments
payment_differences
contracts
contract_pages
contract_analysis
contract_risks
contract_questions
reports
notifications
audit_logs

Kurallar:
- Tüm para alanları Decimal
- Tüm kayıtlar company_id ile tenant bazlı ayrılmalı
- Soft delete kullanılmalı
- created_at, updated_at, created_by alanları olmalı
- Tarife sürümleri silinmemeli
- İşlem tarihine göre aktif tarife bulunabilmeli
- Telegram user id benzersiz olmalı
- Audit log kritik değişiklikleri saklamalı
- Uygun index ve unique constraint ekle
- Seed dosyası oluştur
- Örnek firma, banka, POS ve tarife verisi ekle

Çıktı:
- prisma/schema.prisma
- migration
- seed
- repository katmanı örneği
- tenant güvenliği açıklaması
```

---

# 4. Aşama 3 — Telegram Doğrulamalı Giriş

```text
Şimdi Telegram zorunlu giriş akışını geliştir.

Akış:
1. Kullanıcı web linkini açar.
2. Sistem kısa ömürlü login request üretir.
3. Kullanıcı “Telegram ile Doğrula” butonuna basar.
4. Telegram botuna yönlenir.
5. Bot kullanıcıya firma, cihaz, tarih/saat ve giriş isteğini gösterir.
6. Kullanıcı Onayla veya Reddet seçer.
7. Telegram user id kayıtlı bir company_user ile eşleşiyorsa web oturumu açılır.
8. Eşleşmiyorsa “Bu hesap henüz bir firma ile eşleştirilmemiş” ekranı gösterilir.
9. Yeni cihaz girişlerinde Telegram onayı zorunlu olsun.
10. Onay isteği 5 dakika sonra geçersiz olsun.
11. Tek kullanımlık token ve replay attack koruması olsun.
12. Kritik işlemler için aynı altyapı yeniden kullanılabilsin.

Sayfalar:
- /login
- /login/waiting
- /login/not-linked
- /login/denied
- /app

Teknik:
- Telegram webhook endpoint
- Bot inline keyboard
- Secure, httpOnly cookie
- Session tablosu
- Rate limit
- Audit log

Ayrıca yerel geliştirme için Telegram kullanılmadan dev login seçeneği ekle; production’da kapalı olsun.
```

---

# 5. Aşama 4 — İlk Kurulum Sihirbazı

```text
Şimdi ilk kurulum sihirbazını geliştir.

Adımlar:
1. Firma bilgileri
2. Banka ekleme
3. POS ekleme
4. Resmî tarife girişi
5. Kontrol ve onay

Kurallar:
- Mobilde her adım tam ekran
- Masaüstünde sol stepper + sağ form
- Otomatik taslak kaydetme
- Sayfa yenilenirse kaldığı adımdan devam
- Zod doğrulama
- Son adımda tüm bilgileri özetle
- “Bilgileri Onayla ve Sistemi Başlat” butonu
- Tarife olmadan kurulum tamamlanmasın
- Banka belgesi fotoğrafı/PDF yüklenebilsin
- Belge kaşe/imza durumu kullanıcı tarafından işaretlensin

Henüz OCR veya AI yapma. Manuel giriş temel yöntem olsun.
```

---

# 6. Aşama 5 — Banka, POS ve Tarife Yönetimi

```text
Şimdi Bankalar, POS’lar ve Tarifeler modülünü geliştir.

Bankalar sayfası:
- Kart görünümü
- Banka logosu
- Aktif POS sayısı
- Aylık ciro
- Ortalama komisyon
- Bekleyen ödeme
- Uyarı durumu

Banka detay sekmeleri:
- Genel
- POS’lar
- Tarifeler
- Ödemeler
- Belgeler
- Raporlar

POS kartı:
- POS adı
- Terminal numarası
- POS türü
- Aktif tarife
- Son işlem tarihi
- Bu ay ciro
- Bu ay kesinti

Tarife girişi 8 kısa bölümden oluşsun:
1. Kimlik
2. Tek çekim
3. Taksit
4. Kart/işlem türleri
5. Sabit ücretler
6. Valör ve ödeme
7. Taahhütler
8. Belge ve onay

Tarife sürümleme:
- Yeni tarife geldiğinde eskiyi kapat
- Eskiyi silme
- Tarih çakışmasını engelle
- Her işlem hangi sürüme göre hesaplandı göstermeli
```

---

# 7. Aşama 6 — Gün Sonu Girişi

```text
Şimdi Gün Sonu Girişi modülünü geliştir.

Ekran:
- Tarih
- Şube
- Banka
- POS
- Dinamik satış satırları

Satış türleri:
- Tek çekim
- 2–12 taksit
- Yabancı kart
- Ticari kart
- İade
- İptal

Her satır:
- İşlem türü
- Toplam tutar
- İşlem adedi
- Kart türü
- Not

Kullanıcı örneğin:
- Tek çekim 10.000 TL
- 6 taksit 25.000 TL
girebilsin.

Hesapla butonundan sonra:
- Brüt satış
- Beklenen komisyon
- Sabit ücret
- Diğer kesinti
- Net ödeme
- Beklenen ödeme tarihi
- Kullanılan tarife sürümü

gösterilsin.

Kaydetme sonrası beklenen_payments kayıtları oluşsun.

Önemli:
- Hesaplama motorunu UI’dan bağımsız saf TypeScript fonksiyonları olarak yaz
- Decimal kullan
- Resmî tatil takvimini servis arayüzüyle soyutla
- Unit test yaz
- Tarife eksikse hesaplama yapma
```

---

# 8. Aşama 7 — Beklenen ve Gerçekleşen Ödemeler

```text
Şimdi Beklenen Ödemeler ve Gerçekleşen Ödeme Girişi modülünü geliştir.

Beklenen ödeme filtreleri:
- Bugün
- Yarın
- Bu hafta
- Geciken
- Banka
- POS
- Şube

Ödeme kartı:
- Banka
- POS
- Satış tarihi
- Ödeme tarihi
- Brüt satış
- Beklenen kesinti
- Beklenen net ödeme
- Durum
- “Hesabıma Geçti” butonu

Gerçekleşen ödeme formu:
- Hesaba geçen tutar
- Geçiş tarihi
- Banka açıklaması
- Dekont/ekstre dosyası

Kaydetme sonrası:
- Beklenen ve gerçekleşen tutarı karşılaştır
- Fark tutarı
- Fark yüzdesi
- Gecikme günü
- Tahmini uygulanan komisyon oranı
- İlgili tarife sürümü

Durumlar:
- uyumlu
- kontrol edilmeli
- gecikmiş
- kısmi ödeme
- fark bulundu

Yuvarlama toleransı ayarlanabilir olsun.
```

---

# 9. Aşama 8 — Ana Panel

```text
Şimdi gerçek verilerle çalışan ana paneli geliştir.

Kartlar:
1. Bugün beklenen ödeme
2. Bugün hesaba geçen
3. Bu ay toplam kesinti
4. Kontrol edilmesi gereken fark

Hızlı işlemler:
- Gün Sonu Gir
- Hesaba Geçeni Gir
- Yeni POS Ekle
- Sözleşme Analiz Et

Bölümler:
- Bekleyen ödemeler
- Son uyarılar
- Aylık ciro/kesinti grafiği
- Banka bazlı maliyet özeti
- Akıllı özet metni

Grafikler Recharts ile olsun.
Mobilde tablolar kart listesine dönüşsün.
Dashboard sorgularını performanslı yaz.
```

---

# 10. Aşama 9 — Fark Analizi

```text
Şimdi Fark Analizi Merkezi geliştir.

Üç katman:
1. Matematiksel fark
2. Kural kontrolü
3. AI açıklaması için hazır veri modeli

Ekranda:
- Beklenen
- Gerçekleşen
- Fark
- Fark yüzdesi
- Kayıtlı oran
- Tahmini uygulanan oran
- Valör uyumu
- Ek ücret uyumu
- İlgili tarife
- Kaynak belge

Henüz gerçek AI servisi bağlama. Önce rule-based açıklamalar üret:
- oran farkı
- valör farkı
- sabit ücret
- ticari kart farkı
- eksik veri
- kısmi ödeme
- yuvarlama

Her açıklamada:
- Olası neden
- Kontrol edilmesi gereken belge
- Bankaya sorulacak soru
- Önerilen işlem
```

---

# 11. Aşama 10 — Sözleşme Analiz Merkezi

```text
Şimdi Sözleşme Analiz Merkezi geliştir.

Yükleme:
- PDF
- JPG/PNG
- Çok sayfa
- Kamera
- Mevcut sözleşme seçimi

İşlem durumları:
- yüklendi
- metin çıkarılıyor
- maddeler sınıflandırılıyor
- finansal etki hesaplanıyor
- analiz tamamlandı
- manuel kontrol gerekli

Analiz veri modeli:
- 60 saniyelik özet
- avantajlar
- dikkat edilmesi gerekenler
- kritik maddeler
- komisyon ve ücretler
- valör
- ciro taahhüdü
- erken fesih
- otomatik yenileme
- tek taraflı değişiklik
- bankaya sorulacak sorular
- şerh/düzeltme önerileri
- güven skoru
- kaynak sayfa/madde

AI entegrasyonunu provider interface olarak tasarla:
- analyzeDocument()
- summarizeContract()
- extractFinancialTerms()
- compareContracts()
- generateQuestions()

Mock provider oluştur. Gerçek API anahtarını koda yazma.

Sonuç ekranı sade kartlardan oluşsun. Her bulgu hangi sayfa ve maddeye dayandığını göstersin.

Uyarı:
“Bu analiz hukukî veya finansal danışmanlık yerine geçmez.”
```

---

# 12. Aşama 11 — Sözleşme Karşılaştırma

```text
Şimdi mevcut ve yeni sözleşme karşılaştırma ekranını geliştir.

Karşılaştırılacak alanlar:
- Tek çekim oranı
- 2–12 taksit oranları
- Valör
- Aylık cihaz ücreti
- Diğer sabit ücretler
- Ciro taahhüdü
- Erken fesih
- Otomatik yenileme
- Ticari kart
- Yabancı kart
- Tarife değişiklik yetkisi

Çıktı:
- Yan yana tablo
- Avantajlı/dezavantajlı etiketleri
- Tahmini aylık ve yıllık etki
- Ciro senaryosu
- Kısa karar özeti
- PDF yönetici özeti

Sistem “imzala / imzalama” kararı vermesin.
```

---

# 13. Aşama 12 — Telegram Bildirimleri

```text
Şimdi Telegram bildirim sistemini geliştir.

Bildirimler:
- Yarın beklenen ödeme
- Bugün ödeme bekleniyor
- Ödeme gecikti
- Beklenenden düşük ödeme
- Tarife bitişi
- Kampanya bitişi
- Ciro taahhüdü riski
- Aylık rapor hazır
- Kritik ayar değişikliği

Mesajlarda inline buton:
- Ödeme Geldi
- Daha Sonra Hatırlat
- Paneli Aç

Bildirim tercihleri:
- tür bazlı açık/kapalı
- günlük özet saati
- sessiz saatler
- kullanıcı bazlı yetki

Retry, idempotency ve delivery log ekle.
```

---

# 14. Aşama 13 — Raporlar

```text
Şimdi rapor merkezini geliştir.

Raporlar:
- Günlük özet
- Aylık maliyet
- Banka karşılaştırma
- POS karşılaştırma
- Fark raporu
- Yıllık pazarlık raporu
- Sözleşme analiz özeti

Yıllık rapor bölümleri:
- Yönetici özeti
- Toplam POS cirosu
- Toplam kesinti
- Beklenen kesinti
- Fark
- Banka bazlı tablo
- POS bazlı tablo
- Gelecek yıl tahmini
- Pazarlık önerileri
- Veri kaynakları ve tarife sürümleri

Çıktı:
- PDF
- Excel
- HTML
- Telegram’da paylaşılabilir bağlantı

Rapor dili tarafsız olsun:
“Banka hatalı kesti” yazma.
“Kayıtlı koşullarla beklenen tutar arasında fark bulunuyor” yaz.
```

---

# 15. Aşama 14 — Finans Asistanı

```text
Şimdi Finans Asistanı sohbet ekranını geliştir.

Sorular:
- Bu ay neden fazla kesinti oldu?
- Hangi banka daha pahalı?
- Yarın ne kadar para yatacak?
- 6 taksitli satış hangi POS’ta daha avantajlı?
- Bu sözleşmenin en riskli maddeleri neler?
- Bankayla görüşürken ne istemeliyim?

Mimari:
- Kullanıcı sorusu intent sınıflandırma
- Yetki ve tenant kontrolü
- İlgili verileri güvenli biçimde çekme
- Hesaplamaları deterministik servislerden alma
- AI yalnızca açıklama üretmeli
- Her cevap veri kaynağını göstermeli
- “İlgili ekrana git” bağlantısı olmalı
- Kullanıcı başka firmaların ham verisini görememeli

Mock AI ile başla, sonra provider interface üzerinden gerçek modele geç.
```

---

# 16. Aşama 15 — Yönetici Paneli

```text
Şimdi sistem yöneticisi panelini geliştir.

Fonksiyonlar:
- Firma oluştur
- Firma aktif/pasif
- Paket ve abonelik
- Kullanıcı ekle
- Telegram eşleştirme kodu oluştur
- Telegram eşleşmesini yenile
- Son giriş
- Banka ve POS sayısı
- Veri giriş sıklığı
- Kritik uyarılar
- Destek notları
- Eksik veri uyarısı gönder
- Audit log görüntüle

Admin paneli normal kullanıcı panelinden route ve yetki olarak ayrı olsun.
```

---

# 17. Her Modülde Claude’dan İstenecek Son Kontrol

Her aşamanın sonunda şu promptu verin:

```text
Şimdi bu modülü denetle.

Kontrol et:
- TypeScript strict hatası var mı?
- any kullanılmış mı?
- Tenant güvenliği doğru mu?
- Mobilde taşma var mı?
- Loading, empty, error ve success state var mı?
- Para tr-TR biçiminde mi?
- Tarih GG.AA.YYYY biçiminde mi?
- Formlar Zod ile doğrulanıyor mu?
- Finansal hesaplar Decimal kullanıyor mu?
- Kritik işlemler audit log üretiyor mu?
- Aynı bileşen gereksiz tekrar edilmiş mi?
- Erişilebilirlik sorunları var mı?
- Unit/integration test eksik mi?

Bulduğun sorunları düzelt. Sonra değişen dosyaları ve test komutlarını yaz.
```

---

# 18. Claude’a Tasarım Kalitesi İçin Ek Talimat

```text
Arayüzü klasik muhasebe programı gibi yoğun ve tablo ağırlıklı yapma.

İstenen his:
- Stripe Dashboard sadeliği
- Linear düzen disiplini
- Notion okunabilirliği
- Kurumsal Türk fintech güveni

Kurallar:
- Her ekranda tek ana aksiyon
- Mobilde tek sütun
- Ana finansal rakamlar büyük
- Gereksiz renk, gölge ve gradient yok
- Kırmızı yalnızca gerçek riskte
- Metinler kısa ve anlaşılır
- Teknik banka terimlerini açıklama metniyle destekle
- Tablolar mobilde kart görünümüne dönüşsün
- Tüm formlarda taslak kaydetme düşün
- Kullanıcı hiçbir zaman “şimdi ne yapacağım?” diye kalmamalı
```

---

# 19. Claude’a Gönderim Sırası

1. Ana bağlam
2. Proje iskeleti
3. Veritabanı
4. Telegram giriş
5. İlk kurulum
6. Banka/POS/tarife
7. Gün sonu
8. Beklenen/gerçekleşen ödeme
9. Dashboard
10. Fark analizi
11. Sözleşme analizi
12. Sözleşme karşılaştırma
13. Telegram bildirimleri
14. Raporlar
15. Finans asistanı
16. Admin paneli
17. Güvenlik ve test denetimi
18. Deployment

---

# 20. Claude’a Vermemeniz Gereken Talimat

Şunu yazmayın:

> “Bütün sistemi tek seferde eksiksiz kodla.”

Bu yaklaşımda bağlam kaybı, eksik veri modeli, bozuk entegrasyon ve tutarsız tasarım riski artar.

Doğru yöntem:

> “Mevcut projeyi bozmadan yalnızca bu modülü tamamla. Çalıştırma ve test adımlarını ver. Sonraki modüle benim onayımla geç.”

---

# 21. Son Deployment Promptu

```text
Şimdi projeyi production’a hazırlamak için son kontrol yap.

İstenenler:
- Environment variable şablonu
- Dockerfile
- docker-compose local geliştirme
- PostgreSQL migration stratejisi
- S3 dosya depolama yapılandırması
- Telegram webhook kurulumu
- Güvenli secret yönetimi
- Rate limiting
- Error monitoring
- Backup stratejisi
- Health check endpoint
- CI pipeline
- Production build testi
- Seed’in production’da çalışmaması
- Admin hesabı güvenli oluşturma
- KVKK açısından veri saklama ve silme notları
- Audit log saklama politikası

Sonuçta deployment kontrol listesi ve adım adım komutları ver.
```
