/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PixelProgress } from "./pixel-progress";

describe("PixelProgress", () => {
  afterEach(() => cleanup());

  it("fills as many of twenty blocks as the progress says", () => {
    const { container } = render(<PixelProgress value={0.5} label="Noch 20 min" />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
    expect(container.querySelectorAll("[data-block]").length).toBe(20);
    expect(container.querySelectorAll('[data-block="filled"]').length).toBe(10);
    expect(screen.getByText("Noch 20 min")).toBeTruthy();
  });

  it("is empty at zero and full at one", () => {
    const empty = render(<PixelProgress value={0} label="a" />);
    expect(empty.container.querySelectorAll('[data-block="filled"]').length).toBe(0);
    cleanup();
    const full = render(<PixelProgress value={1} label="a" />);
    expect(full.container.querySelectorAll('[data-block="filled"]').length).toBe(20);
  });
});
