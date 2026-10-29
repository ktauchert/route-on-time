import { describe, expect, it } from "vitest";
import { modeLabel, modeOf, preferableModes, timelineOf, usesMode } from "./mode";

function leg(overrides: Record<string, unknown> = {}) {
  return {
    walking: false,
    lineName: "S7",
    product: "suburban",
    departure: "2026-10-26T08:00:00+01:00",
    arrival: "2026-10-26T08:30:00+01:00",
    ...overrides,
  };
}

describe("modeOf", () => {
  it("takes the product the auskunft reports", () => {
    expect(modeOf(leg({ product: "suburban" }))).toBe("suburban");
    expect(modeOf(leg({ product: "subway", lineName: "U2" }))).toBe("subway");
    expect(modeOf(leg({ product: "regional", lineName: "RE1" }))).toBe("regional");
    expect(modeOf(leg({ product: "tram", lineName: "M4" }))).toBe("tram");
    expect(modeOf(leg({ product: "bus", lineName: "248" }))).toBe("bus");
    expect(modeOf(leg({ product: "ferry", lineName: "F10" }))).toBe("ferry");
    expect(modeOf(leg({ product: "express", lineName: "ICE 1" }))).toBe("express");
  });

  it("has no mode for a walk", () => {
    expect(modeOf(leg({ walking: true, product: null, lineName: null }))).toBeNull();
  });

  it("reads old stored legs without a product from the line name", () => {
    expect(modeOf(leg({ product: undefined, lineName: "S7" }))).toBe("suburban");
    expect(modeOf(leg({ product: undefined, lineName: "U2" }))).toBe("subway");
    expect(modeOf(leg({ product: undefined, lineName: "RB22" }))).toBe("regional");
    expect(modeOf(leg({ product: undefined, lineName: "RE1" }))).toBe("regional");
    expect(modeOf(leg({ product: undefined, lineName: "ICE 1" }))).toBe("express");
  });

  it("falls back to other for what it cannot place", () => {
    expect(modeOf(leg({ product: undefined, lineName: "248" }))).toBe("other");
    expect(modeOf(leg({ product: "taxi", lineName: "AST" }))).toBe("other");
  });
});

describe("modeLabel", () => {
  it("names the modes in both languages", () => {
    expect(modeLabel("de", "suburban")).toBe("S-Bahn");
    expect(modeLabel("de", "regional")).toBe("Regionalbahn");
    expect(modeLabel("de", "subway")).toBe("U-Bahn");
    expect(modeLabel("de", "tram")).toBe("Tram");
    expect(modeLabel("de", "bus")).toBe("Bus");
    expect(modeLabel("en", "regional")).toBe("Regional train");
    expect(modeLabel("en", "suburban")).toBe("S-Bahn");
  });

  it("offers the modes people choose from", () => {
    expect(preferableModes).toEqual(["suburban", "regional", "subway", "tram", "bus"]);
  });
});

describe("usesMode", () => {
  it("is true when any ride is of that mode", () => {
    const legs = [leg({ walking: true, product: null, lineName: null }), leg({ product: "regional", lineName: "RE1" })];
    expect(usesMode(legs, "regional")).toBe(true);
    expect(usesMode(legs, "suburban")).toBe(false);
  });
});

describe("timelineOf", () => {
  it("sizes each ride by its minutes and shows the wait between rides", () => {
    const parts = timelineOf([
      leg({ departure: "2026-10-26T08:00:00+01:00", arrival: "2026-10-26T08:30:00+01:00" }),
      leg({
        product: "regional",
        lineName: "RE1",
        departure: "2026-10-26T08:40:00+01:00",
        arrival: "2026-10-26T09:00:00+01:00",
      }),
    ]);

    expect(parts.map((part) => [part.kind, part.minutes])).toEqual([
      ["leg", 30],
      ["wait", 10],
      ["leg", 20],
    ]);
    expect(parts[0]?.mode).toBe("suburban");
    expect(parts[2]?.mode).toBe("regional");
    expect(parts[0]?.label).toBe("S7");
    expect(parts.reduce((sum, part) => sum + part.share, 0)).toBeCloseTo(1);
    expect(parts[0]?.share).toBeCloseTo(0.5);
  });

  it("marks a walk as a walk", () => {
    const parts = timelineOf([
      leg({ walking: true, product: null, lineName: null, departure: "2026-10-26T08:00:00+01:00", arrival: "2026-10-26T08:05:00+01:00" }),
      leg({ departure: "2026-10-26T08:05:00+01:00", arrival: "2026-10-26T08:35:00+01:00" }),
    ]);

    expect(parts.map((part) => part.kind)).toEqual(["walk", "leg"]);
    expect(parts[0]?.mode).toBeNull();
  });

  it("returns nothing for no legs and ignores legs without times", () => {
    expect(timelineOf([])).toEqual([]);
    expect(timelineOf([leg({ departure: "", arrival: "" })])).toEqual([]);
  });
});
