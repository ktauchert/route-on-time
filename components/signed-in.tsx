import Link from "next/link";
import { signOut } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const labels = {
  de: { navigation: "Hauptnavigation", routes: "Routen", settings: "Einstellungen", submit: "Abmelden" },
  en: { navigation: "Main navigation", routes: "Routes", settings: "Settings", submit: "Sign out" },
} as const;

export function SignedIn({
  language,
  current,
}: {
  language: Language;
  current?: "routes" | "settings";
}) {
  const text = labels[language];
  const item =
    "rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground";

  return (
    <nav aria-label={text.navigation} className="flex items-center gap-1">
      <Link href="/routes" className={item} aria-current={current === "routes" ? "page" : undefined}>
        {text.routes}
      </Link>
      <Link href="/settings" className={item} aria-current={current === "settings" ? "page" : undefined}>
        {text.settings}
      </Link>
      <form action={signOut} className="ml-auto md:ml-1">
        <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
          {text.submit}
        </Button>
      </form>
    </nav>
  );
}
