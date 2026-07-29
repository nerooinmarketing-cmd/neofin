"use client";

import Link from "next/link";
import { Bell, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TopBarProps {
  userName: string;
  companyName: string;
  greeting?: string;
  notificationCount?: number;
}

export function TopBar({
  userName,
  companyName,
  greeting,
  notificationCount = 0,
}: TopBarProps) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8 print:hidden">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          Günaydın, {userName}
        </p>
        {greeting ? (
          <p className="truncate text-xs text-muted-foreground">{greeting}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden gap-1.5 lg:flex">
              <Plus className="size-4" />
              Hızlı İşlem
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/gun-sonu">Gün Sonu Gir</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/odemeler/gerceklesen">Hesaba Geçeni Gir</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bankalar">Yeni POS Ekle</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sozlesmeler">Sözleşme Analiz Et</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 sm:flex"
            >
              {companyName}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>{companyName}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Firma değiştir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Bildirimler"
        >
          <Bell className="size-5" />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-danger-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full"
              aria-label="Profil"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-navy text-sm font-medium text-navy-foreground">
                  {userName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/ayarlar">Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/ayarlar">Ayarlar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Çıkış yap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
