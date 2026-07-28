import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/server/admin/password";

/**
 * Production'da tek seferlik, güvenli sistem yöneticisi oluşturma script'i.
 * `prisma/seed.ts`'in aksine demo şirket/veri oluşturmaz. E-posta ve şifre
 * env değişkenlerinden okunur; asla kod içine yazılmaz.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx prisma/create-admin.ts
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL ve ADMIN_PASSWORD env değişkenleri gerekli.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD en az 12 karakter olmalı.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.systemAdmin.findUnique({ where: { email } });
  if (existing) {
    await prisma.systemAdmin.update({
      where: { email },
      data: { passwordHash: hashPassword(password) },
    });
    console.log(`Mevcut sistem yöneticisinin şifresi güncellendi: ${email}`);
  } else {
    await prisma.systemAdmin.create({
      data: { email, passwordHash: hashPassword(password), name: "Platform Yöneticisi" },
    });
    console.log(`Sistem yöneticisi oluşturuldu: ${email}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
