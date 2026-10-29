/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Landing } from "./landing";

describe("Landing", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks the question of the app and leads with registration", () => {
    render(<Landing language="de" />);

    expect(screen.getByRole("heading", { level: 2, name: "Kommst du noch rechtzeitig an?" })).toBeTruthy();
    const hero = screen.getByRole("heading", { name: "Kommst du noch rechtzeitig an?" }).closest("section")!;
    const register = within(hero).getByRole("link", { name: "Registrieren" });
    const signIn = within(hero).getByRole("link", { name: "Anmelden" });
    expect(register.getAttribute("href")).toBe("/register");
    expect(register.getAttribute("data-variant")).toBe("default");
    expect(signIn.getAttribute("href")).toBe("/sign-in");
    expect(signIn.getAttribute("data-variant")).toBe("outline");
  });

  it("keeps the preview, the three steps and the closing call for the desktop", () => {
    render(<Landing language="de" />);

    const steps = screen.getByRole("heading", { name: "So funktioniert es" }).closest("section")!;
    expect(steps.className).toContain("hidden");
    expect(steps.className).toContain("md:block");
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    expect(within(steps).getByText("Route anlegen")).toBeTruthy();
    expect(within(steps).getByText("Stand prüfen")).toBeTruthy();
    expect(within(steps).getByText("Unterwegs weiter")).toBeTruthy();

    const preview = screen.getByRole("figure");
    expect(preview.className).toContain("hidden");
    expect(within(preview).getByText("passt")).toBeTruthy();
    expect(within(preview).getByRole("progressbar")).toBeTruthy();

    const closing = screen.getByText("Leg deine erste Route an.").closest("section")!;
    expect(closing.className).toContain("md:flex");
    expect(within(closing).getByRole("link", { name: "Registrieren" }).getAttribute("href")).toBe(
      "/register",
    );
  });

  it("uses English for the same landing", () => {
    render(<Landing language="en" />);

    expect(screen.getByRole("heading", { level: 2, name: "Will you still arrive on time?" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Register" })[0].getAttribute("href")).toBe("/register");
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
    expect(screen.getByRole("heading", { name: "How it works" })).toBeTruthy();
  });
});
