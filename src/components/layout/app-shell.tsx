import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileBottomNav } from "./mobile-bottom-nav";

export interface AppShellProps {
  children: ReactNode;
  userName?: string;
  companyName?: string;
  greeting?: string;
  notificationCount?: number;
}

/**
 * Responsive shell: fixed left menu on desktop, fixed bottom menu on mobile,
 * shared top bar with notifications / company switcher / profile.
 */
export function AppShell({
  children,
  userName = "Şenol Bey",
  companyName = "Örnek Ticaret A.Ş.",
  greeting,
  notificationCount = 2,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          userName={userName}
          companyName={companyName}
          greeting={greeting}
          notificationCount={notificationCount}
        />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
