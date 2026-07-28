# Tenant Güvenliği

POSKontrol tek bir PostgreSQL veritabanını tüm firmalar (tenant) arasında
paylaşır ("shared database, shared schema" modeli). İzolasyon veritabanı
seviyesinde değil, **uygulama/repository katmanında** zorunlu kılınır.

## 1. Temel kural: `company_id` olmadan sorgu yok

Her tablo (kimlik eşleştirme öncesi geçici kayıtlar hariç — bkz. §4) doğrudan
bir `companyId` sütunu taşır. Her repository fonksiyonu bir
[`TenantContext`](../src/server/tenant-context.ts) (`{ companyId, companyUserId }`)
alır ve bunu **her** `where` koşuluna ekler.

Yasak / doğru kullanım:

```ts
// ❌ Yasak: id tek başına başka bir firmanın kaydını döndürebilir
await prisma.posDevice.findUnique({ where: { id } });

// ✅ Doğru: id + companyId birlikte, aksi halde null
await prisma.posDevice.findFirst({
  where: { id, companyId: ctx.companyId, deletedAt: null },
});
```

`findUnique` yalnızca `id` üzerinden çalıştığı için tenant kontrolüne
**kapalıdır** — repository katmanında hiçbir yerde tek başına
`findUnique({ where: { id } })` kullanılmamalıdır. Bkz.
[`pos-device-repository.ts`](../src/server/repositories/pos-device-repository.ts)
ve [`tariff-repository.ts`](../src/server/repositories/tariff-repository.ts)
referans örnekleri.

## 2. Neden Postgres Row-Level Security (RLS) değil?

Uygulama tek bir veritabanı bağlantı havuzu (bkz. `src/lib/prisma.ts`) ve tek
bir DB rolü kullanıyor; bu yüzden Postgres RLS politikaları (`current_setting`
üzerinden `app.company_id` okuyan) bu aşamada devreye alınmadı. İleride ek bir
güvenlik katmanı olarak:

1. Her tabloya `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` uygulanır,
2. Her istek başında bir transaction içinde
   `SET LOCAL app.company_id = '<id>'` çalıştırılır,
3. Politikalar `USING (company_id = current_setting('app.company_id')::text)`
   şeklinde yazılır.

Bu, repository katmanındaki hatalara karşı ikinci bir savunma hattı olur;
ancak şu an tek doğruluk kaynağı repository katmanındaki `companyId` filtresidir.

## 3. Silme yerine pasife alma

- Kullanıcı tarafından yönetilen tablolarda (`Company`, `CompanyUser`,
  `Branch`, `Bank`, `BankContact`, `PosDevice`, `DailySale`, `ActualPayment`,
  `Contract`, ...) gerçek `DELETE` hiç kullanılmaz. Bunun yerine `deletedAt`
  doldurulur ve repository sorguları varsayılan olarak
  `deletedAt: null` filtresiyle çalışır.
- `isActive` alanı (Company/Branch/Bank/PosDevice/CompanyUser) iş kuralı
  aktif/pasif durumunu ifade eder; `deletedAt` ise kaydın listelerden
  kalıcı olarak çıkarıldığını ifade eder. İkisi ayrı kavramdır — bkz.
  `posDeviceRepository.deactivate()`.

## 4. Tarife sürümleri asla silinmez

`TariffVersion` modelinde **`deletedAt` alanı yoktur** — bu bilinçli bir
tasarım kararıdır, kuralı şema seviyesinde imkânsız kılar. Yeni bir tarife
girildiğinde:

1. Aynı POS için açık uçlu (`endDate: null`) bir sürüm varsa, o sürümün
   `endDate`'i yeni sürümün başlangıcından bir gün öncesine ayarlanır,
   `status = SUPERSEDED` yapılır ve `supersededById` yeni sürüme işaret eder.
2. Kapalı (`endDate` dolu) bir sürümle tarih çakışması varsa işlem
   `TariffOverlapError` ile reddedilir.
3. Bir işlemin hangi sürüme göre hesaplandığını bulurken **`status` alanı
   değil, tarih aralığı** esas alınır — geçmiş bir satış tarihinin doğru
   karşılığı artık `SUPERSEDED` olsa da odur
   (`tariffRepository.findVersionForDate`).

Bu davranış `src/server/repositories/tariff-repository.ts` içinde gerçek bir
PostgreSQL veritabanına karşı test edilmiştir (üst üste binen tarih reddi,
supersede zinciri, geçmişe dönük doğru sürüm çözümü).

## 5. Audit log

Kritik mutasyonlar (`PosDevice` oluşturma/pasife alma, tarife sürümü
oluşturma) aynı `prisma.$transaction` içinde bir `AuditLog` satırı yazar —
mutasyon ile denetim kaydı ya birlikte başarılı olur ya da ikisi de geri
alınır. `AuditLog` tablosunun kendisi hiçbir zaman güncellenmez veya silinmez.

## 6. Kimlik benzersizliği

- `TelegramAccount.telegramUserId` veritabanı seviyesinde `@unique` —
  aynı Telegram hesabı iki firmaya bağlanamaz.
- `Company.taxNumber` `@unique`, `PosDevice` `@@unique([companyId, terminalNo])`,
  `TariffVersion` `@@unique([posId, versionNumber])`.

## 7. Firma eşleştirmesi öncesi tablolar

`TelegramAccount` ve `LoginApproval` firma eşleştirmesi tamamlanmadan var
olabildiği için `companyId` bu iki tabloda **nullable**'dır (bkz.
UX dokümanı §4.2 "Bu hesap henüz bir firma ile eşleştirilmemiş"). Eşleştirme
tamamlanana kadar bu kayıtlar hiçbir firmaya ait sayılmaz ve hiçbir
repository sorgusunda `companyId: null` olan satırlar başka bir firmanın
verisiyle karışacak şekilde döndürülmez.

## 8. Yeni bir repository yazarken kontrol listesi

- [ ] İlk parametre `ctx: TenantContext`
- [ ] Her `where` içinde `companyId: ctx.companyId`
- [ ] `findUnique({ where: { id } })` yok, `findFirst` + `companyId` var
- [ ] Soft-delete edilebilir tablolarda `deletedAt: null` filtresi var
- [ ] Kritik mutasyonlar `$transaction` içinde `AuditLog` yazıyor
- [ ] Silme yerine `deletedAt`/`isActive` güncelleniyor
- [ ] Tarife ile ilgili sorgular tarih aralığına göre, `status`'e göre değil
