"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { PosBilgiFormMiniApp } from "@/components/telegram-app/pos-bilgi-form-mini-app";

export default function PosBilgiFormuPage() {
  const [initData, setInitData] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string>("");
  const resolved = useRef(false);

  useEffect(() => {
    // Yerel test kolaylığı: gerçek bir Telegram istemcisi/ağ erişimi olmadan
    // initData'yı query string üzerinden geçirmeye izin ver (bkz.
    // DEV_LOGIN_ENABLED ile aynı fikir, yalnızca dev/test için). Effect'te
    // (render sırasında değil) çalıştığı için hydration uyuşmazlığı olmaz.
    if (process.env.NODE_ENV === "production" || resolved.current) return;
    const devData = new URLSearchParams(window.location.search).get("dev_init_data");
    if (devData) {
      resolved.current = true;
      // queueMicrotask: effect gövdesinde senkron setState yerine bir
      // callback içinden çağrılır (bkz. react-hooks/set-state-in-effect).
      queueMicrotask(() => setInitData(devData));
    }
  }, []);

  function handleSdkLoad() {
    if (resolved.current) return; // dev_init_data zaten kullanıldı
    resolved.current = true;
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
    setDiagnostics(
      `Telegram: ${window.Telegram ? "var" : "yok"} · WebApp: ${webApp ? "var" : "yok"} · ` +
        `platform: ${webApp?.platform ?? "-"} · version: ${webApp?.version ?? "-"} · ` +
        `initData uzunluğu: ${webApp?.initData?.length ?? 0}`,
    );
    setInitData(webApp?.initData ?? "");
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" onLoad={handleSdkLoad} />
      {initData === null ? (
        <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Yükleniyor...
        </div>
      ) : initData === "" ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <p>Bu sayfa yalnızca Telegram uygulaması içinden açılabilir.</p>
          {diagnostics ? <p className="text-xs opacity-70">{diagnostics}</p> : null}
        </div>
      ) : (
        <PosBilgiFormMiniApp initData={initData} />
      )}
    </>
  );
}
