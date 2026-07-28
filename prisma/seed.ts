import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/server/admin/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_ADMIN_EMAIL = "admin@poskontrol.local";
const DEV_ADMIN_PASSWORD = "admin123";

/** Aşama 15 (Yönetici Paneli) için yalnızca yerel geliştirmede kullanılacak sistem yöneticisi. */
async function seedSystemAdmin() {
  const existing = await prisma.systemAdmin.findUnique({ where: { email: DEV_ADMIN_EMAIL } });
  if (existing) {
    console.log("Sistem yöneticisi zaten var, atlanıyor.");
    return;
  }

  await prisma.systemAdmin.create({
    data: {
      email: DEV_ADMIN_EMAIL,
      passwordHash: hashPassword(DEV_ADMIN_PASSWORD),
      name: "Platform Yöneticisi",
    },
  });
  console.log(`Sistem yöneticisi oluşturuldu: ${DEV_ADMIN_EMAIL} / ${DEV_ADMIN_PASSWORD} (yalnızca yerel geliştirme)`);
}

async function seedFullyOnboardedCompany() {
  const company = await prisma.company.upsert({
    where: { taxNumber: "1234567890" },
    update: {},
    create: {
      name: "Örnek Ticaret A.Ş.",
      shortName: "Örnek Ticaret",
      taxNumber: "1234567890",
      contactName: "Şenol Yılmaz",
      phone: "+905551234567",
      email: "sahip@ornekticaret.com",
      city: "İstanbul",
      district: "Kadıköy",
      sector: "Perakende",
      estimatedAnnualVolume: 14_940_000,
      branchCount: 1,
      status: "ACTIVE",
      onboardingCompletedAt: new Date(),
    },
  });

  const alreadySeeded = await prisma.posDevice.findFirst({
    where: { companyId: company.id },
  });
  if (alreadySeeded) {
    console.log(`Şirket "${company.shortName}" zaten seed edilmiş, atlanıyor.`);
    return;
  }

  const owner = await prisma.companyUser.create({
    data: {
      companyId: company.id,
      name: "Şenol Yılmaz",
      email: "sahip@ornekticaret.com",
      phone: "+905551234567",
      role: "OWNER",
    },
  });

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: "Merkez Şube",
      city: "İstanbul",
      district: "Kadıköy",
      createdById: owner.id,
    },
  });

  const akbank = await prisma.bank.create({
    data: {
      companyId: company.id,
      name: "Akbank",
      branchName: "Kadıköy Şubesi",
      customerNumber: "AK-90210",
      createdById: owner.id,
      contacts: {
        create: {
          name: "Ayşe Demir",
          phone: "+902165550000",
          email: "ayse.demir@akbank.com",
          isPrimary: true,
          createdById: owner.id,
        },
      },
    },
  });

  const yapiKredi = await prisma.bank.create({
    data: {
      companyId: company.id,
      name: "Yapı Kredi",
      branchName: "Bağdat Caddesi Şubesi",
      customerNumber: "YK-44120",
      createdById: owner.id,
    },
  });

  const posAkbank = await prisma.posDevice.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      bankId: akbank.id,
      name: "POS-01 · Merkez Şube",
      terminalNo: "TR001234",
      merchantNo: "MID-100234",
      type: "PHYSICAL",
      createdById: owner.id,
    },
  });

  await prisma.posDevice.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      bankId: yapiKredi.id,
      name: "POS-03 · Bağdat Cd.",
      terminalNo: "TR005678",
      merchantNo: "MID-100678",
      type: "PHYSICAL",
      createdById: owner.id,
    },
  });

  // Akbank POS-01 için resmî tarife — v1 (bkz. POSKontrol_Uctan_Uca §9)
  const tariffV1 = await prisma.tariffVersion.create({
    data: {
      companyId: company.id,
      posId: posAkbank.id,
      bankId: akbank.id,
      versionNumber: 1,
      campaignName: "Standart Tarife",
      startDate: new Date("2026-01-01"),
      endDate: null,
      status: "ACTIVE",
      bankOfficerName: "Ayşe Demir",
      documentDate: new Date("2025-12-20"),
      createdById: owner.id,
      singlePaymentRates: {
        create: {
          nextDayRate: 2.85,
          valor2DayRate: 2.45,
          valor7DayRate: 1.95,
          foreignCardRate: 3.4,
          commercialCardRate: 3.6,
        },
      },
      installmentRates: {
        create: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => ({
          installmentCount: count,
          commissionRate: 2.85 + count * 0.045,
          valorDays: count <= 6 ? 2 : 3,
        })),
      },
      fees: {
        create: [
          { feeType: "MONTHLY_POS", amount: 0 },
          { feeType: "STATEMENT", amount: 15 },
        ],
      },
      documents: {
        create: {
          fileUrl: "https://example.com/documents/akbank-pos-bilgi-formu.pdf",
          fileType: "PDF",
          hasStamp: true,
          hasSignature: true,
          verifiedByUser: true,
          createdById: owner.id,
        },
      },
    },
    include: { installmentRates: true },
  });

  const sixInstallment = tariffV1.installmentRates.find(
    (r) => r.installmentCount === 6,
  );
  if (!sixInstallment) {
    throw new Error("6 taksit oranı seed verisinde bulunamadı");
  }

  // Gün sonu girişi örneği: 10.000 TL tek çekim + 25.000 TL 6 taksit
  const dailySale = await prisma.dailySale.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      bankId: akbank.id,
      posId: posAkbank.id,
      tariffVersionId: tariffV1.id,
      saleDate: new Date("2026-08-12"),
      createdById: owner.id,
      items: {
        create: [
          {
            transactionType: "SINGLE",
            amount: 10000,
            transactionCount: 1,
          },
          {
            transactionType: "INSTALLMENT",
            installmentCount: 6,
            amount: 25000,
            transactionCount: 1,
          },
        ],
      },
    },
    include: { items: true },
  });

  const singleItem = dailySale.items.find((i) => i.transactionType === "SINGLE");
  const installmentItem = dailySale.items.find(
    (i) => i.transactionType === "INSTALLMENT",
  );
  if (!singleItem || !installmentItem) {
    throw new Error("Gün sonu satış satırları seed verisinde bulunamadı");
  }

  const singleCommission = 10000 * 0.0285;
  const expectedSinglePayment = await prisma.expectedPayment.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      bankId: akbank.id,
      posId: posAkbank.id,
      tariffVersionId: tariffV1.id,
      dailySaleId: dailySale.id,
      dailySaleItemId: singleItem.id,
      saleDate: new Date("2026-08-12"),
      expectedPaymentDate: new Date("2026-08-13"),
      grossAmount: 10000,
      expectedDeduction: singleCommission,
      expectedNet: 10000 - singleCommission,
      status: "DUE_TODAY",
    },
  });

  const installmentCommission =
    25000 * (Number(sixInstallment.commissionRate) / 100);
  await prisma.expectedPayment.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      bankId: akbank.id,
      posId: posAkbank.id,
      tariffVersionId: tariffV1.id,
      dailySaleId: dailySale.id,
      dailySaleItemId: installmentItem.id,
      saleDate: new Date("2026-08-12"),
      expectedPaymentDate: new Date("2026-08-15"),
      grossAmount: 25000,
      expectedDeduction: installmentCommission,
      expectedNet: 25000 - installmentCommission,
      status: "WAITING",
    },
  });

  // Gerçekleşen ödeme örneği: beklenenden az geçen tek çekim tutarı → fark analizi
  const actualPayment = await prisma.actualPayment.create({
    data: {
      companyId: company.id,
      expectedPaymentId: expectedSinglePayment.id,
      receivedAmount: 9683.5,
      receivedDate: new Date("2026-08-13"),
      bankDescription: "POS tahsilat mutabakatı",
      createdById: owner.id,
    },
  });

  const differenceAmount =
    Number(expectedSinglePayment.expectedNet) - Number(actualPayment.receivedAmount);
  await prisma.paymentDifference.create({
    data: {
      companyId: company.id,
      expectedPaymentId: expectedSinglePayment.id,
      actualPaymentId: actualPayment.id,
      tariffVersionId: tariffV1.id,
      differenceAmount,
      differencePercentage:
        (differenceAmount / Number(expectedSinglePayment.expectedNet)) * 100,
      delayDays: 0,
      estimatedAppliedRate: 3.1,
      status: "NEEDS_REVIEW",
      ruleExplanations: {
        possibleReason:
          "Uygulanan oran (%3,10) kayıtlı tek çekim oranından (%2,85) yüksek görünüyor.",
        documentToCheck: "Banka işlem bazlı komisyon dökümü",
        questionForBank: "Bu işlemde ticari kart ek komisyonu uygulandı mı?",
        recommendedAction:
          "Bankadan işlem bazlı komisyon dökümü isteyin ve kart türünü doğrulayın.",
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      actorType: "SYSTEM",
      actorUserId: owner.id,
      action: "SEED_INITIAL_DATA",
      entityType: "Company",
      entityId: company.id,
      after: { seededAt: new Date().toISOString() },
    },
  });

  console.log(`Seed tamamlandı: ${company.name}`);
}

/**
 * Aşama 4 (kurulum sihirbazı) test edebilmek için: yönetici eşleştirmesi
 * yapılmış ama henüz hiçbir kurulum adımı tamamlanmamış "boş" bir firma.
 * Yalnızca ad + telefon dolu — bkz. UX §4.3.
 */
async function seedFreshOnboardingCompany() {
  const phone = "+905559998877";
  const existing = await prisma.company.findFirst({ where: { phone, name: null } });
  if (existing) {
    console.log("Taze kurulum firması zaten mevcut, atlanıyor.");
    return;
  }

  const company = await prisma.company.create({
    data: { phone, status: "TRIAL" },
  });

  const owner = await prisma.companyUser.create({
    data: {
      companyId: company.id,
      name: "Yeni Firma Sahibi",
      role: "OWNER",
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      actorType: "SYSTEM",
      actorUserId: owner.id,
      action: "SEED_FRESH_ONBOARDING_COMPANY",
      entityType: "Company",
      entityId: company.id,
    },
  });

  console.log(`Taze kurulum firması oluşturuldu (companyUserId: ${owner.id}).`);
}

async function main() {
  await seedSystemAdmin();
  await seedFullyOnboardedCompany();
  await seedFreshOnboardingCompany();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
