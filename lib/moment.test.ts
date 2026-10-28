import { describe, expect, it } from "vitest";
import { glanceFor, tripMoment, upcomingLabel } from "./moment";
import type { Suggestion } from "./check";

function trip(departure: string, arrival: string, token = "one"): Suggestion {
  return {
    refreshToken: token,
    legs: [
      {
        walking: false,
        lineId: null,
        lineName: "S7",
        originId: "a",
        originName: "A",
        destinationId: "b",
        destinationName: "B",
        departure,
        arrival,
        departureDelaySeconds: null,
        arrivalDelaySeconds: null,
        cancelled: false,
        stopovers: [],
      },
    ],
  };
}

const now = new Date("2026-10-28T17:30:00.000Z");

describe("tripMoment", () => {
  it("counts whole minutes until departure", () => {
    expect(tripMoment([{ departure: "2026-10-28T18:00:00.000Z", arrival: "2026-10-28T18:40:00.000Z" }], now)).toEqual({
      upcomingMinutes: 30,
      progress: null,
    });
  });

  it("rounds a short wait up to one minute", () => {
    expect(
      tripMoment([{ departure: "2026-10-28T17:30:20.000Z", arrival: "2026-10-28T18:00:00.000Z" }], now)?.upcomingMinutes,
    ).toBe(1);
  });

  it("measures progress from the first departure to the last arrival", () => {
    expect(tripMoment([{ departure: "2026-10-28T17:00:00.000Z", arrival: "2026-10-28T18:00:00.000Z" }], now)).toEqual({
      upcomingMinutes: null,
      progress: 0.5,
    });
  });

  it("says nothing after the trip has arrived", () => {
    expect(tripMoment([{ departure: "2026-10-28T16:00:00.000Z", arrival: "2026-10-28T17:00:00.000Z" }], now)).toEqual({
      upcomingMinutes: null,
      progress: null,
    });
  });
});

describe("glanceFor", () => {
  it("uses the chosen connection instead of an earlier one", () => {
    const earlier = trip("2026-10-28T16:00:00.000Z", "2026-10-28T17:00:00.000Z", "earlier");
    const chosen = trip("2026-10-28T18:00:00.000Z", "2026-10-28T18:40:00.000Z", "chosen");

    expect(
      glanceFor(
        { todayRefreshToken: "chosen", todayServiceDate: "2026-10-28" },
        {
          serviceDate: "2026-10-28",
          status: "fits",
          connection: earlier,
          suggestions: [earlier, chosen],
          alternative: null,
        },
        now,
      ),
    ).toMatchObject({ status: "fits", upcomingMinutes: 30, progress: null });
  });
});

describe("upcomingLabel", () => {
  it("names the wait in both languages", () => {
    expect(upcomingLabel("de", 25)).toBe("Abfahrt in 25 min");
    expect(upcomingLabel("en", 25)).toBe("Departs in 25 min");
  });
});
