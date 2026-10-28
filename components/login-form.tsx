import { signIn } from "@/app/anmelden/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { accountCreatedMessage, signInFailureMessage } from "@/lib/auth";
import type { Language } from "@/lib/preferences";

const labels = {
  de: { email: "E-Mail", password: "Passwort", submit: "Anmelden" },
  en: { email: "Email", password: "Password", submit: "Sign in" },
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
    <form action={signIn} className="flex w-full flex-col gap-3">
      {accountCreated ? <p role="status">{accountCreatedMessage(language)}</p> : null}
      {failed ? <p role="alert">{signInFailureMessage(language)}</p> : null}
      <label className="flex flex-col gap-1 text-sm" htmlFor="email">
        {text.email}
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1 text-sm" htmlFor="password">
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
      <a href="/registrieren" className="text-sm underline-offset-4 hover:underline">
        {language === "de" ? "Registrieren" : "Register"}
      </a>
    </form>
  );
}
