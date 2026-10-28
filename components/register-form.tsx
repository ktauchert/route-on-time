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
  },
  en: {
    email: "Email",
    password: "Password",
    confirm: "Repeat password",
    submit: "Register",
    signIn: "Sign in",
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
    <form action={signUp} className="flex w-full flex-col gap-3">
      {failure ? <p role="alert">{registerFailureMessage(language, failure)}</p> : null}
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
          autoComplete="new-password"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm" htmlFor="confirm">
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
      <a href="/sign-in" className="text-sm underline-offset-4 hover:underline">
        {text.signIn}
      </a>
    </form>
  );
}
