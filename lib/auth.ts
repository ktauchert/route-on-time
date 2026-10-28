import type { Language } from "./preferences";

export function signInFailureMessage(language: Language) {
  return language === "en"
    ? "Email or password is incorrect."
    : "E-Mail oder Passwort stimmt nicht.";
}

export type RegisterFailure = "mismatch" | "exists" | "failed";

export function registerFailureMessage(language: Language, failure: RegisterFailure) {
  const messages = {
    de: {
      mismatch: "Die Passwörter stimmen nicht überein.",
      exists: "Es gibt schon ein Konto mit dieser E-Mail.",
      failed: "Die Registrierung ist fehlgeschlagen.",
    },
    en: {
      mismatch: "The passwords do not match.",
      exists: "An account with this email already exists.",
      failed: "Registration failed.",
    },
  } as const;

  return messages[language][failure];
}

export function registerFailureReason(error: { message: string; code?: string }): RegisterFailure {
  const message = error.message.toLowerCase();

  if (error.code === "user_already_exists" || message.includes("already")) {
    return "exists";
  }

  return "failed";
}

const publicPaths = new Set(["/sign-in", "/register"]);

export function authRedirect(pathname: string, signedIn: boolean) {
  if (!signedIn && !publicPaths.has(pathname)) {
    return "/sign-in";
  }

  if (signedIn && publicPaths.has(pathname)) {
    return "/";
  }

  return null;
}

export function accountCreatedMessage(language: Language) {
  return language === "en"
    ? "Check your email and confirm the account. Then you can sign in."
    : "Schau in deine E-Mail und bestätige das Konto. Danach kannst du dich anmelden.";
}

export function confirmedSessionPath(exchanged: boolean) {
  return exchanged ? "/" : "/sign-in?error=confirmation";
}
