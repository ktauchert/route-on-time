import { cookies } from "next/headers";
import { resolveLanguage, type ThemeName } from "@/lib/preferences";

export async function readAppearance() {
  const jar = await cookies();
  const language = resolveLanguage(jar.get("language")?.value);
  const storedTheme = jar.get("theme")?.value;
  const theme: ThemeName | undefined =
    storedTheme === "paper" || storedTheme === "stone" ? storedTheme : undefined;

  return { language, theme };
}
