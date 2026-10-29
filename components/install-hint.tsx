"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const storageKey = "install-hint-dismissed";

const copy = {
  de: {
    text: "Lege die App auf den Home-Bildschirm: In Safari auf Teilen tippen und „Zum Home-Bildschirm“ wählen, in Chrome im Menü „App installieren“.",
    dismiss: "Verstanden",
  },
  en: {
    text: "Put the app on your home screen: in Safari tap Share and choose “Add to Home Screen”, in Chrome open the menu and choose “Install app”.",
    dismiss: "Got it",
  },
} as const;

function alreadyInstalled() {
  try {
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

function wasDismissed() {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

const noSubscription = () => () => {};

export function InstallHint({ language }: { language: Language }) {
  const eligible = useSyncExternalStore(
    noSubscription,
    () => !alreadyInstalled() && !wasDismissed(),
    () => false,
  );
  const [closed, setClosed] = useState(false);
  const text = copy[language];

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // without storage the hint comes back on the next visit
    }
  }

  if (!eligible || closed) return null;

  return (
    <aside className="flex items-start justify-between gap-3 rounded-2xl border bg-muted/50 p-3 text-sm md:items-center">
      <p>{text.text}</p>
      <Button type="button" size="sm" variant="outline" onClick={dismiss}>
        {text.dismiss}
      </Button>
    </aside>
  );
}
