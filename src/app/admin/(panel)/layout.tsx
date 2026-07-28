import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireSystemAdminContext } from "@/server/admin/require-system-admin-context";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireSystemAdminContext();

  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
