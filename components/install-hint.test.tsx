/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InstallHint } from "./install-hint";

function standalone(on: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: on && query.includes("standalone"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

describe("InstallHint", () => {
  beforeEach(() => {
    localStorage.clear();
    standalone(false);
  });

  afterEach(() => {
    cleanup();
  });

  it("explains how to put the app on the home screen", async () => {
    render(<InstallHint language="de" />);

    expect(await screen.findByText(/Home-Bildschirm/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Verstanden" })).toBeTruthy();
  });

  it("speaks English", async () => {
    render(<InstallHint language="en" />);

    expect(await screen.findByText(/home screen/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Got it" })).toBeTruthy();
  });

  it("goes away on click and stays away after a reload", async () => {
    const first = render(<InstallHint language="de" />);
    fireEvent.click(await screen.findByRole("button", { name: "Verstanden" }));
    expect(screen.queryByText(/Home-Bildschirm/)).toBeNull();
    first.unmount();

    render(<InstallHint language="de" />);
    await act(async () => {});
    expect(screen.queryByText(/Home-Bildschirm/)).toBeNull();
  });

  it("is not shown when the app already runs from the home screen", async () => {
    standalone(true);
    render(<InstallHint language="de" />);
    await act(async () => {});

    expect(screen.queryByText(/Home-Bildschirm/)).toBeNull();
  });

  it("still shows when the browser refuses storage", async () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    try {
      render(<InstallHint language="de" />);
      expect(await screen.findByText(/Home-Bildschirm/)).toBeTruthy();
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
