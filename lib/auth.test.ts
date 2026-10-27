import { describe, expect, it } from "vitest";
import { authRedirect, signInFailureMessage } from "./auth";

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
});
