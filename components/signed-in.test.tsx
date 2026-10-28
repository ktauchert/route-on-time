/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SignedIn } from "./signed-in";

describe("SignedIn", () => {
  afterEach(() => {
    cleanup();
  });

  it("says the session exists and offers sign-out, not a route", () => {
    render(<SignedIn language="de" />);

    expect(screen.getByText("Du bist angemeldet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Einstellungen" }).getAttribute("href")).toBe(
      "/settings",
    );
    expect(screen.queryByLabelText("Ankunftsuhrzeit")).toBeNull();
  });

  it("says the same in English", () => {
    render(<SignedIn language="en" />);

    expect(screen.getByText("You are signed in.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
