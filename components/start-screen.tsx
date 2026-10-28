"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/messages";
import type { Language, ThemeName } from "@/lib/preferences";

const year = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${year}; SameSite=Lax`;
}

export function StartScreen({
  language,
  theme,
  onLanguage,
  onTheme,
  children,
  nav,
  centered = false,
  wordmarkHref = "/routes",
}: {
  language: Language;
  theme?: ThemeName;
  onLanguage?: (language: Language) => void;
  onTheme?: (theme: ThemeName) => void;
  children?: ReactNode;
  nav?: ReactNode;
  centered?: boolean;
  wordmarkHref?: string;
}) {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const text = copy(currentLanguage);

  function chooseLanguage(next: Language) {
    writeCookie("language", next);
    setCurrentLanguage(next);
    document.documentElement.lang = next;
    onLanguage?.(next);
    router.refresh();
  }

  function chooseTheme(next: ThemeName) {
    writeCookie("theme", next);
    setCurrentTheme(next);
    document.documentElement.classList.toggle("dark", next === "stone");
    onTheme?.(next);
  }

  const switches = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => chooseLanguage(currentLanguage === "de" ? "en" : "de")}
      >
        {text.languageSwitch}
      </Button>
      <div className="flex rounded-lg border bg-muted/60 p-0.5">
        {(["paper", "stone"] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={currentTheme === name}
            onClick={() => chooseTheme(name)}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
          >
            {name === "paper" ? "Paper" : "Stone"}
          </button>
        ))}
      </div>
    </div>
  );

  const width = centered ? "max-w-md" : "max-w-7xl";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <h1 className="text-base font-semibold tracking-tight">
            <Link href={wordmarkHref} className="flex items-center gap-2">
              <Mark />
              Route on Time
            </Link>
          </h1>
          {nav ? <div className="order-last w-full md:order-none md:mr-auto md:w-auto">{nav}</div> : null}
          {switches}
        </div>
      </header>
      <main
        className={`mx-auto flex w-full ${width} flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-10`}
      >
        {children}
      </main>
    </div>
  );
}

function Mark() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-signal">
      <path d="M4 15 C 8 15, 8 5, 16 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <circle cx="4" cy="15" r="2.5" fill="currentColor" />
      <circle cx="16" cy="5" r="2.5" fill="currentColor" />
    </svg>
  );
}
