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
    expect(screen.queryByRole("link", { name: /registr/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /registr/i })).toBeNull();
    expect(screen.queryByText("E-Mail oder Passwort stimmt nicht.")).toBeNull();
  });

  it("shows the same failure in English without a sign-up path", () => {
    render(<LoginForm language="en" failed />);

    expect(screen.getByText("Email or password is incorrect.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /sign up/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /sign up/i })).toBeNull();
  });
});
