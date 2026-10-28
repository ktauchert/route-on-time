import { signIn } from "@/app/sign-in/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { accountCreatedMessage, signInFailureMessage } from "@/lib/auth";
import type { Language } from "@/lib/preferences";

const labels = {
  de: {
    email: "E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    lead: "Deine Routen warten auf dich.",
    other: "Noch kein Zugang?",
  },
  en: {
    email: "Email",
    password: "Password",
    submit: "Sign in",
    lead: "Your routes are waiting.",
    other: "No account yet?",
  },
} as const;

export function LoginForm({
  language,
  failed,
  accountCreated = false,
}: {
  language: Language;
  failed: boolean;
  accountCreated?: boolean;
}) {
  const text = labels[language];

  return (
    <form action={signIn} className="flex w-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs md:mt-10 md:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{text.submit}</h2>
        <p className="text-sm text-muted-foreground">{text.lead}</p>
      </div>
      {accountCreated ? <p role="status" className="rounded-xl border border-fits/30 bg-fits/10 p-3 text-sm text-fits">{accountCreatedMessage(language)}</p> : null}
      {failed ? <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-3 text-sm text-miss">{signInFailureMessage(language)}</p> : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="email">
        {text.email}
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="password">
        {text.password}
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button type="submit">{text.submit}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {text.other}{" "}
        <a href="/register" className="font-medium text-signal underline-offset-4 hover:underline">
          {language === "de" ? "Registrieren" : "Register"}
        </a>
      </p>
    </form>
  );
}
