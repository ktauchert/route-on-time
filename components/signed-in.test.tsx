/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SignedIn } from "./signed-in";

describe("SignedIn", () => {
  afterEach(() => {
    cleanup();
  });

  it("navigates to the routes and settings and offers sign-out, without a sentence about the session", () => {
    render(<SignedIn language="de" />);

    expect(screen.getByRole("navigation")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Routen" }).getAttribute("href")).toBe("/routes");
    expect(screen.getByRole("link", { name: "Einstellungen" }).getAttribute("href")).toBe(
      "/settings",
    );
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeTruthy();
    expect(screen.queryByText("Du bist angemeldet.")).toBeNull();
    expect(screen.queryByLabelText("Ankunftsuhrzeit")).toBeNull();
  });

  it("says the same in English", () => {
    render(<SignedIn language="en" />);

    expect(screen.getByRole("link", { name: "Routes" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
