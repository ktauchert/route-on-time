import { describe, expect, it } from "vitest";
import { authRedirect, registerFailureMessage, signInFailureMessage } from "./auth";

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
    expect(authRedirect("/", false)).toBe("/anmelden");
  });

  it("sends a signed-in person away from the sign-in page", () => {
    expect(authRedirect("/anmelden", true)).toBe("/");
  });

  it("leaves a signed-in person on the home page", () => {
    expect(authRedirect("/", true)).toBeNull();
  });

  it("leaves a visitor on the sign-in page", () => {
    expect(authRedirect("/anmelden", false)).toBeNull();
  });

  it("leaves a visitor on the registration page", () => {
    expect(authRedirect("/registrieren", false)).toBeNull();
  });

  it("sends a signed-in person away from registration", () => {
    expect(authRedirect("/registrieren", true)).toBe("/");
  });
});
