"use client";

import { useState, type ReactNode } from "react";
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
}: {
  language: Language;
  theme?: ThemeName;
  onLanguage?: (language: Language) => void;
  onTheme?: (theme: ThemeName) => void;
  children?: ReactNode;
  centered?: boolean;
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

  return (
    <main
      className={
        centered
          ? "mx-auto flex min-h-svh w-full max-w-md flex-col gap-8 p-6"
          : "flex min-h-svh flex-col gap-8 p-6 md:grid md:grid-cols-2 md:items-end md:p-12"
      }
    >
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
        Route on Time
      </h1>
      <div className="flex flex-col gap-3 md:items-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => chooseLanguage(currentLanguage === "de" ? "en" : "de")}
        >
          {text.languageSwitch}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={currentTheme === "paper" ? "default" : "outline"}
            aria-pressed={currentTheme === "paper"}
            onClick={() => chooseTheme("paper")}
          >
            Paper
          </Button>
          <Button
            type="button"
            variant={currentTheme === "stone" ? "default" : "outline"}
            aria-pressed={currentTheme === "stone"}
            onClick={() => chooseTheme("stone")}
          >
            Stone
          </Button>
        </div>
        {children}
      </div>
    </main>
  );
}
