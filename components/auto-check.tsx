"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/lib/preferences";

const minimumGapMs = 60 * 1000;

export function AutoCheck({
  routeIds,
  intervalMinutes,
  run,
  language,
}: {
  routeIds: string[];
  intervalMinutes: number;
  run: (routeIds: string[]) => Promise<number>;
  language: Language;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const lastRun = useRef(0);
  const key = routeIds.join(",");

  useEffect(() => {
    if (routeIds.length === 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let active = true;

    async function attempt() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRun.current < minimumGapMs) return;
      lastRun.current = Date.now();
      setPending(true);
      try {
        const written = await run(routeIds);
        if (active && written > 0) router.refresh();
      } catch {
        // the next interval tries again; the last stand stays on screen
      } finally {
        if (active) setPending(false);
      }
    }

    function start() {
      if (timer) clearInterval(timer);
      timer = setInterval(attempt, intervalMinutes * 60 * 1000);
      void attempt();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        start();
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMinutes]);

  if (!pending) return null;

  return (
    <p role="status" className="text-sm text-muted-foreground">
      {language === "de" ? "Prüfe gerade …" : "Checking …"}
    </p>
  );
}
