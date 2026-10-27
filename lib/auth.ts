import type { Language } from "./preferences";

export function signInFailureMessage(language: Language) {
  return language === "en"
    ? "Email or password is incorrect."
    : "E-Mail oder Passwort stimmt nicht.";
}

export function authRedirect(pathname: string, signedIn: boolean) {
  if (!signedIn && pathname !== "/anmelden") {
    return "/anmelden";
  }

  if (signedIn && pathname === "/anmelden") {
    return "/";
  }

  return null;
}
