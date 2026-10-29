import Link from "next/link";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import { upcomingLabel } from "@/lib/moment";
import type { Language } from "@/lib/preferences";

const copy = {
  de: {
    eyebrow: "Für Bahn und Bus im VBB",
    title: "Kommst du noch rechtzeitig an?",
    lead: "Route on Time prüft deine gespeicherten Routen gegen die Echtzeit und sagt dir, ob die Verbindung noch zur Vorgabe passt.",
    signIn: "Anmelden",
    register: "Registrieren",
    preview: "Beispiel aus der Routenliste",
    work: "Zur Arbeit",
    home: "Heimweg",
    arrival: "Ankunft",
    weekdays: "Mo–Fr",
    stepsTitle: "So funktioniert es",
    steps: [
      { title: "Route anlegen", text: "Start, Ziel, Ankunftsuhrzeit und Wochentage. Eine Richtung, eine Vorgabe." },
      { title: "Stand prüfen", text: "Von Hand oder im Intervall. Der Stand sagt passt, passt nicht oder unklar." },
      { title: "Unterwegs weiter", text: "Bei einer Störung sucht die App ab dem nächsten Halt eine Alternative." },
    ],
    closing: "Leg deine erste Route an.",
    closingText: "Ein Zugang, deine Routen, sonst nichts.",
  },
  en: {
    eyebrow: "For trains and buses in the VBB",
    title: "Will you still arrive on time?",
    lead: "Route on Time checks your saved routes against realtime data and tells you whether the connection still meets what you asked for.",
    signIn: "Sign in",
    register: "Register",
    preview: "Example from the route list",
    work: "To work",
    home: "Way home",
    arrival: "Arrival",
    weekdays: "Mon–Fri",
    stepsTitle: "How it works",
    steps: [
      { title: "Create a route", text: "Start, destination, arrival time and weekdays. One direction, one requirement." },
      { title: "Check the result", text: "By hand or on an interval. The result says Fits, Doesn't fit, or Unclear." },
      { title: "Keep going", text: "When something breaks, the app searches an alternative from the next stop." },
    ],
    closing: "Create your first route.",
    closingText: "One account, your routes, nothing else.",
  },
} as const;

export function Landing({ language }: { language: Language }) {
  const text = copy[language];

  return (
    <div className="flex flex-1 flex-col gap-16 md:gap-24">
      <section className="flex flex-1 flex-col gap-10 md:grid md:flex-none md:grid-cols-2 md:items-center md:gap-12 md:pt-10">
        <div className="flex flex-1 flex-col gap-6">
          <p className="text-xs font-semibold tracking-widest text-signal uppercase">{text.eyebrow}</p>
          <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">{text.title}</h2>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">{text.lead}</p>
          <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row md:mt-2 md:pt-0">
            <Button size="lg" className="h-12 px-6 text-base md:h-11" asChild>
              <Link href="/register">{text.register}</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 text-base md:h-11" asChild>
              <Link href="/sign-in">{text.signIn}</Link>
            </Button>
          </div>
        </div>

        <figure className="relative hidden md:block">
          <div
            aria-hidden
            className="absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,var(--color-signal),transparent)] opacity-15 blur-2xl"
          />
          <ul className="flex flex-col gap-3">
            <li className="flex flex-col gap-2 rounded-2xl border border-signal/50 bg-card p-5 shadow-sm ring-1 ring-signal/20">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold">{text.work}</span>
                <StatusPill language={language} status="fits" />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {text.arrival} 08:45 · {text.weekdays}
              </p>
              <p className="text-sm font-medium text-signal tabular-nums">{upcomingLabel(language, 12)}</p>
            </li>
            <li className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold">{text.home}</span>
                <StatusPill language={language} status="doesnt-fit" />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {text.arrival} 18:30 · {text.weekdays}
              </p>
              <TripProgress language={language} progress={0.4} />
            </li>
          </ul>
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">{text.preview}</figcaption>
        </figure>
      </section>

      <section className="hidden md:block">
        <h2 className="text-2xl font-semibold tracking-tight">{text.stepsTitle}</h2>
        <ol className="mt-6 grid grid-cols-3 gap-4">
          {text.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-xs">
              <span className="flex size-8 items-center justify-center rounded-full bg-signal/10 text-sm font-semibold text-signal">
                {index + 1}
              </span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="hidden items-center justify-between gap-6 rounded-2xl border border-signal/30 bg-signal/10 p-8 md:flex">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold tracking-tight">{text.closing}</p>
          <p className="text-sm text-muted-foreground">{text.closingText}</p>
        </div>
        <Button size="lg" className="h-11 px-6 text-base" asChild>
          <Link href="/register">{text.register}</Link>
        </Button>
      </section>
    </div>
  );
}
