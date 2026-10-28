/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks for email and password and has no registration", () => {
    render(<LoginForm language="de" failed={false} />);

    expect(screen.getByLabelText("E-Mail")).toBeTruthy();
    expect(screen.getByLabelText("Passwort")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Registrieren" }).getAttribute("href")).toBe(
      "/register",
    );
    expect(screen.queryByText("E-Mail oder Passwort stimmt nicht.")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the same failure in English and still links to registration", () => {
    render(<LoginForm language="en" failed />);

    expect(screen.getByText("Email or password is incorrect.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe(
      "/register",
    );
  });

  it("tells the person to confirm the email", () => {
    render(<LoginForm language="de" failed={false} accountCreated />);

    expect(screen.getByRole("status").textContent).toBe(
      "Schau in deine E-Mail und bestätige das Konto. Danach kannst du dich anmelden.",
    );
  });
});
