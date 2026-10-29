import { describe, expect, it } from "vitest";
import { ageLabel, connectionSummary, failedLabel } from "./check-copy";
import type { LegView } from "./check";

function leg(departure: string, arrival: string, walking = false): LegView {
  return {
    walking,
    lineId: null,
    lineName: walking ? null : "S7",
    originId: null,
    originName: "A",
    destinationId: null,
    destinationName: "B",
    departure,
    arrival,
    departureDelaySeconds: null,
    arrivalDelaySeconds: null,
    cancelled: false,
    stopovers: [],
  };
}

describe("connectionSummary", () => {
  it("names departure, arrival, duration and transfers, without counting a walk", () => {
    const legs = [
      leg("2026-10-26T08:02:00+01:00", "2026-10-26T08:08:00+01:00", true),
      leg("2026-10-26T08:10:00+01:00", "2026-10-26T08:30:00+01:00"),
      leg("2026-10-26T08:34:00+01:00", "2026-10-26T08:50:00+01:00"),
    ];

    expect(connectionSummary("de", legs)).toEqual({
      departure: "08:02",
      arrival: "08:50",
      duration: "48 min",
      transfers: "1 Umstieg",
    });
    expect(connectionSummary("en", legs)?.transfers).toBe("1 transfer");
  });

  it("says direct when there is no transfer, and counts several", () => {
    const direct = [leg("2026-10-26T08:10:00+01:00", "2026-10-26T09:25:00+01:00")];
    const three = [
      leg("2026-10-26T08:00:00+01:00", "2026-10-26T08:10:00+01:00"),
      leg("2026-10-26T08:12:00+01:00", "2026-10-26T08:20:00+01:00"),
      leg("2026-10-26T08:22:00+01:00", "2026-10-26T08:30:00+01:00"),
    ];

    expect(connectionSummary("de", direct)).toMatchObject({ duration: "1 h 15 min", transfers: "direkt" });
    expect(connectionSummary("en", direct)?.transfers).toBe("direct");
    expect(connectionSummary("de", three)?.transfers).toBe("2 Umstiege");
    expect(connectionSummary("en", three)?.transfers).toBe("2 transfers");
  });

  it("has nothing to say without legs", () => {
    expect(connectionSummary("de", [])).toBeNull();
  });
});

describe("ageLabel", () => {
  const now = new Date("2026-10-26T08:00:00+01:00");

  it("says just now within the first minute", () => {
    expect(ageLabel("de", "2026-10-26T07:59:40+01:00", now)).toBe("gerade eben");
    expect(ageLabel("en", "2026-10-26T07:59:40+01:00", now)).toBe("just now");
  });

  it("counts minutes", () => {
    expect(ageLabel("de", "2026-10-26T07:57:00+01:00", now)).toBe("vor 3 min");
    expect(ageLabel("en", "2026-10-26T07:57:00+01:00", now)).toBe("3 min ago");
  });

  it("counts hours and minutes beyond an hour", () => {
    expect(ageLabel("de", "2026-10-26T06:55:00+01:00", now)).toBe("vor 1 h 5 min");
    expect(ageLabel("en", "2026-10-26T06:00:00+01:00", now)).toBe("2 h ago");
  });

  it("never reports a negative age", () => {
    expect(ageLabel("de", "2026-10-26T08:05:00+01:00", now)).toBe("gerade eben");
  });
});

describe("failedLabel", () => {
  it("names the time of the failed check and says the stand above is older", () => {
    expect(failedLabel("de", "2026-10-26T07:30:00+01:00")).toBe(
      "Die Prüfung um 07:30 hat nicht geklappt. Der Stand ist älter.",
    );
    expect(failedLabel("en", "2026-10-26T07:30:00+01:00")).toBe(
      "The check at 07:30 did not work. This stand is older.",
    );
  });
});
