/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartScreen } from "./start-screen";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

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

  it("ends the content at 1280 px and keeps the header at the top", () => {
    render(
      <StartScreen
        language="de"
        theme="paper"
        onLanguage={vi.fn()}
        onTheme={vi.fn()}
      />,
    );

    expect(screen.getByRole("main").className).toContain("max-w-7xl");
    expect(screen.getByRole("banner").className).toContain("sticky");
  });

  it("puts the navigation of a signed-in person into the header", () => {
    render(
      <StartScreen language="de" theme="paper" nav={<span>Routen</span>}>
        <p>Inhalt</p>
      </StartScreen>,
    );

    expect(screen.getByRole("banner").textContent).toContain("Routen");
    expect(screen.getByRole("main").textContent).toBe("Inhalt");
  });

  it("renders the page again in the chosen language", () => {
    render(<StartScreen language="de" theme="paper" />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(document.cookie).toContain("language=en");
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Deutsch" })).toBeTruthy();
  });
});
