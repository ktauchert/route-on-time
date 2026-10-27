import type { Language } from "./preferences";

export const messages = {
  de: {
    languageSwitch: "English",
  },
  en: {
    languageSwitch: "Deutsch",
  },
} as const;

export function copy(language: Language) {
  return messages[language];
}
