import { describe, expect, it } from "vitest";
import { onRouteCookie, resolveOnRouteMode, shouldShowOnRoute } from "./on-route";

describe("the on-route mode switch", () => {
  it("is on unless the device turned it off", () => {
    expect(resolveOnRouteMode(undefined)).toBe("on");
    expect(resolveOnRouteMode("on")).toBe("on");
    expect(resolveOnRouteMode("anything")).toBe("on");
    expect(resolveOnRouteMode("off")).toBe("off");
  });

  it("names its cookie", () => {
    expect(onRouteCookie).toBe("on-route");
  });

  it("shows the view only when the mode is on and a route is active", () => {
    expect(shouldShowOnRoute("on", { route: { id: "a" } })).toBe(true);
    expect(shouldShowOnRoute("on", null)).toBe(false);
    expect(shouldShowOnRoute("off", { route: { id: "a" } })).toBe(false);
  });
});
