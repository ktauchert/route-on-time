import { Suspense } from "react";
import { cookies } from "next/headers";
import { StartScreen } from "@/components/start-screen";
import { resolveLanguage, type ThemeName } from "@/lib/preferences";

function StartFallback() {
  return (
    <StartScreen language="de" theme="paper" />
  );
}

async function StoredStart() {
  const jar = await cookies();
  const language = resolveLanguage(jar.get("language")?.value);
  const storedTheme = jar.get("theme")?.value;
  const theme: ThemeName | undefined =
    storedTheme === "paper" || storedTheme === "stone" ? storedTheme : undefined;

  return (
    <StartScreen language={language} theme={theme} />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<StartFallback />}>
      <StoredStart />
    </Suspense>
  );
}
