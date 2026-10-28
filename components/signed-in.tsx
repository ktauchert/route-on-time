import { signOut } from "@/app/anmelden/actions";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const labels = {
  de: { status: "Du bist angemeldet.", submit: "Abmelden" },
  en: { status: "You are signed in.", submit: "Sign out" },
} as const;

export function SignedIn({ language }: { language: Language }) {
  const text = labels[language];

  return (
    <form action={signOut} className="flex flex-col items-start gap-3">
      <p>{text.status}</p>
      <Button type="submit" variant="outline">
        {text.submit}
      </Button>
    </form>
  );
}
