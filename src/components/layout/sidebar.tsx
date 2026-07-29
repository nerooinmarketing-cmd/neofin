"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col print:hidden">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
          P
        </span>
        <span className="font-heading text-lg font-semibold text-navy">
          POSKontrol
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {primaryNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/panel" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
