import { describe, expect, it } from "vitest";
import { defaultWindowMinutes, maximumWindowMinutes, minimumWindowMinutes, normalizeWindow } from "./window";

describe("normalizeWindow", () => {
  it("starts at an hour", () => {
    expect(defaultWindowMinutes).toBe(60);
  });

  it("keeps a whole number of minutes in range", () => {
    expect(normalizeWindow("30")).toBe(30);
    expect(normalizeWindow(60)).toBe(60);
    expect(normalizeWindow(String(minimumWindowMinutes))).toBe(minimumWindowMinutes);
    expect(normalizeWindow(maximumWindowMinutes)).toBe(maximumWindowMinutes);
  });

  it("rejects what is too small, too large, a fraction or empty", () => {
    expect(normalizeWindow(minimumWindowMinutes - 1)).toBeNull();
    expect(normalizeWindow(maximumWindowMinutes + 1)).toBeNull();
    expect(normalizeWindow("45.5")).toBeNull();
    expect(normalizeWindow("")).toBeNull();
    expect(normalizeWindow(null)).toBeNull();
  });
});
