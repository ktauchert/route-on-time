export type Language = "de" | "en";
export type ThemeName = "paper" | "stone";

export function resolveLanguage(value: string | undefined): Language {
  return value === "en" ? "en" : "de";
}

export function resolveTheme(
  value: string | undefined,
  prefersDark: boolean,
): ThemeName {
  if (value === "paper" || value === "stone") {
    return value;
  }

  return prefersDark ? "stone" : "paper";
}

export const themeBootScript = `(function(){try{var theme=(document.cookie.match(/(?:^|; )theme=([^;]*)/)||[])[1];var stone=theme==="stone"||(!theme&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",stone);var language=(document.cookie.match(/(?:^|; )language=([^;]*)/)||[])[1];document.documentElement.lang=language==="en"?"en":"de";}catch(e){}})();`;
