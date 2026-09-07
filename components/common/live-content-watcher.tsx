"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function LiveContentWatcher({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  const currentVersionRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      try {
        const basePath = window.location.pathname.startsWith("/ICGIT") ? "/ICGIT" : "";
        const res = await fetch(`${basePath}/api/content-version?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          }
        });

        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = Number(data.version);

        if (!serverVersion || isNaN(serverVersion)) return;

        if (currentVersionRef.current === null) {
          // Initialize baseline version on first load
          currentVersionRef.current = serverVersion;
        } else if (serverVersion > currentVersionRef.current) {
          // New change detected from admin!
          console.log(`[LiveContentWatcher] Update detected (${serverVersion} > ${currentVersionRef.current}). Refreshing content...`);
          currentVersionRef.current = serverVersion;
          if (isMounted) {
            router.refresh();
          }
        }
      } catch (err) {
        // Silently skip on brief network glitch
      }
    }

    // Check initially
    checkVersion();

    // Check on window tab focus
    const onFocus = () => checkVersion();
    window.addEventListener("focus", onFocus);

    // Continuous polling timer
    const timer = setInterval(checkVersion, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
