import { describe, expect, it } from "vitest";
import { accountCreatedMessage, authRedirect, registerFailureMessage, signInFailureMessage, confirmedSessionPath } from "./auth";

describe("signInFailureMessage", () => {
  it("uses one German sentence and does not mention whether the email exists", () => {
    const message = signInFailureMessage("de");

    expect(message).toBe("E-Mail oder Passwort stimmt nicht.");
    expect(message.toLowerCase()).not.toContain("nicht gefunden");
  });

  it("uses one English sentence and does not mention whether the email exists", () => {
    const message = signInFailureMessage("en");

    expect(message).toBe("Email or password is incorrect.");
    expect(message.toLowerCase()).not.toContain("not found");
  });
});

describe("registerFailureMessage", () => {
  it("says when the passwords differ, in both languages", () => {
    expect(registerFailureMessage("de", "mismatch")).toBe(
      "Die Passwörter stimmen nicht überein.",
    );
    expect(registerFailureMessage("en", "mismatch")).toBe(
      "The passwords do not match.",
    );
  });

  it("says when the email is already registered, without the upstream text", () => {
    expect(registerFailureMessage("de", "exists")).toBe(
      "Es gibt schon ein Konto mit dieser E-Mail.",
    );
    expect(registerFailureMessage("en", "exists")).not.toContain("User already");
  });
});

describe("authRedirect", () => {
  it("sends a visitor without a session to the sign-in page", () => {
    expect(authRedirect("/routes", false)).toBe("/sign-in");
  });

  it("lets a visitor open the landing page", () => {
    expect(authRedirect("/", false)).toBeNull();
  });

  it("sends a signed-in person away from the sign-in page", () => {
    expect(authRedirect("/sign-in", true)).toBe("/routes");
  });

  it("sends a signed-in person from the landing to the route list", () => {
    expect(authRedirect("/", true)).toBe("/routes");
  });

  it("leaves a visitor on the sign-in page", () => {
    expect(authRedirect("/sign-in", false)).toBeNull();
  });

  it("leaves a visitor on the registration page", () => {
    expect(authRedirect("/register", false)).toBeNull();
  });

  it("leaves the clock route open so the secret can be checked there", () => {
    expect(authRedirect("/api/clock", false)).toBeNull();
  });

  it("sends a signed-in person away from registration", () => {
    expect(authRedirect("/register", true)).toBe("/routes");
  });
});

describe("accountCreatedMessage", () => {
  it("tells the person to confirm the email, in both languages", () => {
    expect(accountCreatedMessage("de")).toBe(
      "Schau in deine E-Mail und bestätige das Konto. Danach kannst du dich anmelden.",
    );
    expect(accountCreatedMessage("en")).toBe(
      "Check your email and confirm the account. Then you can sign in.",
    );
  });
});

describe("confirmedSessionPath", () => {
  it("opens the home page when the mail code becomes a session", () => {
    expect(confirmedSessionPath(true)).toBe("/");
  });

  it("returns to sign-in when the mail code is rejected", () => {
    expect(confirmedSessionPath(false)).toBe("/sign-in?error=confirmation");
  });
});
