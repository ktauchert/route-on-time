/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartScreen } from "./start-screen";

describe("StartScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the app name in German and offers English", () => {
    render(
      <StartScreen
        language="de"
        theme="paper"
        onLanguage={vi.fn()}
        onTheme={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Route on Time" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "English" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paper" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("offers German when the page is English", () => {
    render(
      <StartScreen
        language="en"
        theme="stone"
        onLanguage={vi.fn()}
        onTheme={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Deutsch" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stone" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("uses a column on small screens and two columns from the desktop width", () => {
    const { container } = render(
      <StartScreen
        language="de"
        theme="paper"
        onLanguage={vi.fn()}
        onTheme={vi.fn()}
      />,
    );

    expect(container.firstElementChild?.className).toContain("flex-col");
    expect(container.firstElementChild?.className).toContain("max-w-7xl");
  });
});
