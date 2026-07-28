"use client";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  return (
    <Button size="sm" variant="outline" className="border-white/30 text-navy-foreground hover:bg-white/10" onClick={logout}>
      Çıkış Yap
    </Button>
  );
}
