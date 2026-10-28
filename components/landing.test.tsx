/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Landing } from "./landing";

describe("Landing", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers sign-in and registration, and keeps the longer story for desktop", () => {
    render(<Landing language="de" />);

    expect(screen.getByText("Sieh, ob deine Verbindung noch zur Vorgabe passt.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Anmelden" }).getAttribute("href")).toBe("/sign-in");
    expect(screen.getByRole("link", { name: "Registrieren" }).getAttribute("href")).toBe(
      "/register",
    );
    expect(screen.getByText("Unterwegs beginnt die Suche am nächsten Halt.").closest("ul")?.className).toContain(
      "md:flex",
    );
    expect(screen.getByText("Unterwegs beginnt die Suche am nächsten Halt.").closest("ul")?.className).toContain(
      "hidden",
    );
  });

  it("uses English for the same landing", () => {
    render(<Landing language="en" />);

    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe("/register");
    expect(screen.getByText("Doesn't fit", { exact: false })).toBeTruthy();
  });
});