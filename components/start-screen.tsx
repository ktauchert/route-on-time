"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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
  centered = false,
  board = false,
  wordmarkHref = "/routes",
}: {
  language: Language;
  theme?: ThemeName;
  onLanguage?: (language: Language) => void;
  onTheme?: (theme: ThemeName) => void;
  children?: ReactNode;
  centered?: boolean;
  board?: boolean;
  wordmarkHref?: string;
}) {
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const text = copy(currentLanguage);

  function chooseLanguage(next: Language) {
    writeCookie("language", next);
    setCurrentLanguage(next);
    document.documentElement.lang = next;
    onLanguage?.(next);
  }

  function chooseTheme(next: ThemeName) {
    writeCookie("theme", next);
    setCurrentTheme(next);
    document.documentElement.classList.toggle("dark", next === "stone");
    onTheme?.(next);
  }

  const switches = (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => chooseLanguage(currentLanguage === "de" ? "en" : "de")}
      >
        {text.languageSwitch}
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={currentTheme === "paper" ? "default" : "outline"}
          aria-pressed={currentTheme === "paper"}
          onClick={() => chooseTheme("paper")}
        >
          Paper
        </Button>
        <Button
          type="button"
          size="sm"
          variant={currentTheme === "stone" ? "default" : "outline"}
          aria-pressed={currentTheme === "stone"}
          onClick={() => chooseTheme("stone")}
        >
          Stone
        </Button>
      </div>
    </>
  );

  const frame = centered
    ? "mx-auto flex min-h-svh w-full max-w-md flex-col gap-8 px-4 py-6"
    : "mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10";

  return (
    <main className={frame}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-medium tracking-tight">
          <Link href={wordmarkHref}>Route on Time</Link>
        </h1>
        <div className="flex flex-wrap items-center gap-2">{switches}</div>
      </header>
      {centered || board ? children : <div className="flex flex-col gap-6">{children}</div>}
    </main>
  );
}
