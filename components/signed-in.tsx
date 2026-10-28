import Link from "next/link";
import { signOut } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const labels = {
  de: { status: "Du bist angemeldet.", settings: "Einstellungen", submit: "Abmelden" },
  en: { status: "You are signed in.", settings: "Settings", submit: "Sign out" },
} as const;

export function SignedIn({ language }: { language: Language }) {
  const text = labels[language];

  return (
    <div className="flex flex-col items-start gap-3">
      <p>{text.status}</p>
      <Link href="/settings" className="text-sm underline-offset-4 hover:underline">
        {text.settings}
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          {text.submit}
        </Button>
      </form>
    </div>
  );
}
