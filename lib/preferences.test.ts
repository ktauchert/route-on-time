import { describe, expect, it } from "vitest";
import { resolveLanguage, resolveTheme } from "./preferences";

describe("resolveLanguage", () => {
  it("uses German when no choice is stored", () => {
    expect(resolveLanguage(undefined)).toBe("de");
  });

  it("keeps an explicit English choice", () => {
    expect(resolveLanguage("en")).toBe("en");
  });

  it("does not treat any other value as English", () => {
    expect(resolveLanguage("fr")).toBe("de");
  });
});

describe("resolveTheme", () => {
  it("follows a dark device when nothing is stored", () => {
    expect(resolveTheme(undefined, true)).toBe("stone");
  });

  it("follows a light device when nothing is stored", () => {
    expect(resolveTheme(undefined, false)).toBe("paper");
  });

  it("keeps Paper even when the device is dark", () => {
    expect(resolveTheme("paper", true)).toBe("paper");
  });

  it("keeps Stone even when the device is light", () => {
    expect(resolveTheme("stone", false)).toBe("stone");
  });
});
