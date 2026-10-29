/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RegisterForm } from "./register-form";

describe("RegisterForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks for email, password, and a repeated password", () => {
    render(<RegisterForm language="de" failure={null} />);

    expect(screen.getByRole("heading", { name: "Registrieren" })).toBeTruthy();

    expect(screen.getByLabelText("E-Mail")).toBeTruthy();
    expect(screen.getByLabelText("Passwort")).toBeTruthy();
    expect(screen.getByLabelText("Passwort wiederholen")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrieren" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Anmelden" }).getAttribute("href")).toBe(
      "/sign-in",
    );
  });

  it("shows a mismatch in English", () => {
    render(<RegisterForm language="en" failure="mismatch" />);

    expect(screen.getByRole("alert").textContent).toBe("The passwords do not match.");
  });
});
