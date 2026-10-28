import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/preferences";

const copy = {
  de: {
    lead: "Sieh, ob deine Verbindung noch zur Vorgabe passt.",
    signIn: "Anmelden",
    register: "Registrieren",
    points: [
      "Eine Richtung, eine Vorgabe.",
      "Der Stand sagt passt, passt nicht oder unklar.",
      "Unterwegs beginnt die Suche am nächsten Halt.",
    ],
  },
  en: {
    lead: "See whether your connection still meets what you asked for.",
    signIn: "Sign in",
    register: "Register",
    points: [
      "One direction, one requirement.",
      "The result says Fits, Doesn't fit, or Unclear.",
      "Once you are underway, the search starts at the next stop.",
    ],
  },
} as const;

export function Landing({ language }: { language: Language }) {
  const text = copy[language];

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-end">
      <div className="flex flex-col gap-6">
        <p className="max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">
          {text.lead}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/sign-in">{text.signIn}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">{text.register}</Link>
          </Button>
        </div>
      </div>
      <ul className="hidden flex-col gap-3 text-sm text-muted-foreground md:flex">
        {text.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
