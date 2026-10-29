import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  const result = manifest();

  it("opens as its own app on the route list through the start page", () => {
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
    expect(result.name).toBe("Route on Time");
  });

  it("offers the icon sizes Android and iOS ask for, with a maskable one", () => {
    const icons = result.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);

    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(icons.every((icon) => icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    expect(icons.every((icon) => icon.src.startsWith("/icons/"))).toBe(true);
  });

  it("sets colors so the splash does not flash white", () => {
    expect(result.background_color).toBeTruthy();
    expect(result.theme_color).toBeTruthy();
  });
});
