import { signUp } from "@/app/register/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerFailureMessage, type RegisterFailure } from "@/lib/auth";
import type { Language } from "@/lib/preferences";

const labels = {
  de: {
    email: "E-Mail",
    password: "Passwort",
    confirm: "Passwort wiederholen",
    submit: "Registrieren",
    signIn: "Anmelden",
    lead: "Ein Zugang für deine Routen.",
    other: "Schon registriert?",
  },
  en: {
    email: "Email",
    password: "Password",
    confirm: "Repeat password",
    submit: "Register",
    signIn: "Sign in",
    lead: "One account for your routes.",
    other: "Already registered?",
  },
} as const;

export function RegisterForm({
  language,
  failure,
}: {
  language: Language;
  failure: RegisterFailure | null;
}) {
  const text = labels[language];

  return (
    <form action={signUp} className="flex w-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs md:mt-10 md:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{text.submit}</h2>
        <p className="text-sm text-muted-foreground">{text.lead}</p>
      </div>
      {failure ? <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-3 text-sm text-miss">{registerFailureMessage(language, failure)}</p> : null}
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
          autoComplete="new-password"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="confirm">
        {text.confirm}
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </label>
      <Button type="submit">{text.submit}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {text.other}{" "}
        <a href="/sign-in" className="font-medium text-signal underline-offset-4 hover:underline">
          {text.signIn}
        </a>
      </p>
    </form>
  );
}
