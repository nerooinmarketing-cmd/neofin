import type { ReactNode } from "react";
import Link from "next/link";
import { AdminLogoutButton } from "./admin-logout-button";

export function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-navy px-4 text-navy-foreground sm:px-8">
        <div className="flex items-center gap-6">
          <span className="font-heading text-lg font-semibold">POSKontrol · Yönetici Paneli</span>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/admin/musteriler" className="hover:underline">
              Müşteriler
            </Link>
            <Link href="/admin/teklifler" className="hover:underline">
              Teklif Talepleri
            </Link>
            <Link href="/admin/audit-log" className="hover:underline">
              Audit Log
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">{adminName}</span>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
