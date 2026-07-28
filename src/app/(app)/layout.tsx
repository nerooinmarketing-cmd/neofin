import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { prisma } from "@/lib/prisma";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const ctx = await requireTenantContext(); // geçerli oturum yoksa /login'e yönlendirir

  const company = await prisma.company.findUniqueOrThrow({ where: { id: ctx.companyId } });
  if (!company.onboardingCompletedAt) {
    redirect("/kurulum"); // "İlk girişte kullanıcı boş bir panel görmemelidir"
  }

  return children;
}
