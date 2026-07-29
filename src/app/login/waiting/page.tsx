"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

type ApprovalStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "NOT_LINKED";

function LoginWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<ApprovalStatus | "ERROR">(
    token ? "PENDING" : "ERROR",
  );
  const finalizing = useRef(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/auth/login-status?token=${encodeURIComponent(token!)}`,
        );
        if (!res.ok) {
          if (!cancelled) setStatus("ERROR");
          return;
        }
        const data = (await res.json()) as { status: ApprovalStatus };
        if (cancelled) return;

        if (data.status === "APPROVED" && !finalizing.current) {
          finalizing.current = true;
          const sessionRes = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (sessionRes.ok) {
            // Sert yönlendirme: bkz. login/page.tsx'teki aynı not.
            window.location.assign("/app");
            return;
          }
          setStatus("ERROR");
          return;
        }

        setStatus(data.status);
        if (data.status === "NOT_LINKED") router.push("/login/not-linked");
        if (data.status === "DENIED") router.push("/login/denied");
      } catch {
        if (!cancelled) setStatus("ERROR");
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, router]);

  return (
    <AuthShell>
      <div className="space-y-4 text-center">
        {status === "PENDING" ? (
          <>
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Telegram&apos;da onay bekleniyor
            </h1>
            <p className="text-sm text-muted-foreground">
              Telegram&apos;a bir onay mesajı gönderdik. Mesajdaki &quot;Onayla&quot;
              butonuna basın. Bu istek 5 dakika içinde geçerliliğini yitirir.
            </p>
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </>
        ) : status === "EXPIRED" ? (
          <>
            <h1 className="font-heading text-lg font-semibold text-foreground">
              İstek süresi doldu
            </h1>
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Tekrar Dene</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Bir sorun oluştu
            </h1>
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Girişe Dön</Link>
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function LoginWaitingPage() {
  return (
    <Suspense fallback={null}>
      <LoginWaitingContent />
    </Suspense>
  );
}
