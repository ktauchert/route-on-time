import { describe, expect, it } from "vitest";
import { isDue, normalizeInterval, planTick, secretsMatch, type ClockRoute } from "./clock";
import type { Auskunft, CheckResult, Suggestion } from "./check";
import type { Weekday } from "./route";

const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];
const during = new Date("2026-10-26T08:30:00+01:00");

function trip(arrival = "2026-10-26T08:40:00+01:00"): Suggestion {
  return {
    refreshToken: "carried",
    legs: [
      {
        walking: false,
        lineId: null,
        lineName: "S7",
        originId: "start-stop",
        originName: "Potsdam Hbf",
        destinationId: "griebnitzsee",
        destinationName: "S Griebnitzsee",
        departure: "2026-10-26T08:10:00+01:00",
        arrival,
        departureDelaySeconds: null,
        arrivalDelaySeconds: null,
        cancelled: false,
        stopovers: [],
      },
    ],
  };
}

function previous(checkedAt: string, connection: Suggestion | null = trip()): CheckResult {
  return {
    serviceDate: "2026-10-26",
    status: "fits",
    reason: null,
    checkedAt,
    connection,
    suggestions: connection ? [connection] : [],
    alternative: null,
    noAlternative: false,
    searched: true,
    searchFromName: null,
  };
}

function subject(overrides: Partial<ClockRoute> = {}): ClockRoute {
  return {
    id: "route-1",
    userId: "user-1",
    intervalMinutes: 5,
    previous: null,
    route: {
      startId: "start",
      destinationId: "destination",
      arrival: "09:00",
      weekdays,
      transferMinutes: null,
      maxTransfers: null,
      preferredMode: null,
      relaxed: false,
      avoidLines: [],
      todayRefreshToken: null,
      todayServiceDate: null,
    },
    ...overrides,
  };
}

describe("normalizeInterval", () => {
  it("keeps a whole number of minutes from 1 to 180", () => {
    expect(normalizeInterval("5")).toBe(5);
    expect(normalizeInterval("1")).toBe(1);
    expect(normalizeInterval(180)).toBe(180);
  });

  it("rejects a value below 1 minute, above 180, or a fraction", () => {
    expect(normalizeInterval("0")).toBeNull();
    expect(normalizeInterval(181)).toBeNull();
    expect(normalizeInterval("1.5")).toBeNull();
    expect(normalizeInterval("")).toBeNull();
  });
});

describe("isDue", () => {
  it("opens three hours before the arrival on a saved weekday", () => {
    expect(isDue(subject(), new Date("2026-10-26T06:00:00+01:00"))).toBe(true);
    expect(isDue(subject(), new Date("2026-10-26T05:59:00+01:00"))).toBe(false);
  });

  it("skips a weekday the route does not use", () => {
    expect(isDue(subject(), new Date("2026-10-25T08:00:00+02:00"))).toBe(false);
  });

  it("waits out the person's interval", () => {
    const recent = previous("2026-10-26T08:26:00+01:00");
    expect(isDue(subject({ intervalMinutes: 5, previous: recent }), during)).toBe(false);
    const ready = previous("2026-10-26T08:25:00+01:00");
    expect(isDue(subject({ intervalMinutes: 5, previous: ready }), during)).toBe(true);
  });

  it("allows a one-minute interval for trying the clock", () => {
    const now = new Date("2026-10-26T08:30:00+01:00");
    const tooSoon = previous(new Date(now.getTime() - 50_000).toISOString());
    const ready = previous(new Date(now.getTime() - 60_000).toISOString());

    expect(isDue(subject({ intervalMinutes: 1, previous: tooSoon }), now)).toBe(false);
    expect(isDue(subject({ intervalMinutes: 1, previous: ready }), now)).toBe(true);
  });

  it("follows the chosen connection when an earlier saved journey has already arrived", () => {
    const earlier = trip("2026-10-26T18:36:00+01:00");
    earlier.refreshToken = "earlier";
    earlier.legs[0]!.departure = "2026-10-26T17:50:00+01:00";
    const chosen = trip("2026-10-26T18:49:00+01:00");
    chosen.refreshToken = "chosen";
    chosen.legs[0]!.departure = "2026-10-26T18:11:00+01:00";
    const saved = previous("2026-10-26T17:00:00+01:00", earlier);
    saved.suggestions = [earlier, chosen];
    const route = subject({
      previous: saved,
      route: {
        ...subject().route,
        arrival: "19:00",
        todayRefreshToken: "chosen",
        todayServiceDate: "2026-10-26",
      },
    });

    expect(isDue(route, new Date("2026-10-26T18:38:00+01:00"))).toBe(true);
  });

  it("stops once today's connection has arrived", () => {
    const arrived = previous("2026-10-26T06:00:00+01:00", trip("2026-10-26T08:20:00+01:00"));
    expect(isDue(subject({ previous: arrived }), during)).toBe(false);
  });

  it("stops after the arrival time when nobody is underway", () => {
    expect(isDue(subject(), new Date("2026-10-26T09:10:00+01:00"))).toBe(false);
  });

  it("keeps checking a trip that is still running after the arrival time", () => {
    const late = previous(
      "2026-10-26T06:00:00+01:00",
      trip("2026-10-26T09:20:00+01:00"),
    );
    late.connection = {
      ...trip("2026-10-26T09:20:00+01:00"),
      legs: [
        {
          ...trip("2026-10-26T09:20:00+01:00").legs[0]!,
          departure: "2026-10-26T08:50:00+01:00",
        },
      ],
    };

    expect(isDue(subject({ previous: late }), new Date("2026-10-26T09:10:00+01:00"))).toBe(true);
  });

  it("uses the departure of today's connection when the route has no arrival time", () => {
    const connection = trip("2026-10-26T09:20:00+01:00");
    const route = subject({
      previous: previous("2026-10-26T06:00:00+01:00", connection),
      route: { ...subject().route, arrival: "" },
    });

    expect(isDue(route, new Date("2026-10-26T07:39:00+01:00"))).toBe(false);
    expect(isDue(route, new Date("2026-10-26T07:40:00+01:00"))).toBe(true);
  });

  it("does not check a route with neither an arrival time nor a connection", () => {
    const route = subject({
      route: { ...subject().route, arrival: "" },
    });

    expect(isDue(route, during)).toBe(false);
  });
});

describe("secretsMatch", () => {
  it("accepts only the configured secret", () => {
    expect(secretsMatch("clock-secret", "clock-secret")).toBe(true);
    expect(secretsMatch("nope", "clock-secret")).toBe(false);
    expect(secretsMatch(null, "clock-secret")).toBe(false);
    expect(secretsMatch("clock-secret", null)).toBe(false);
  });
});

describe("planTick", () => {
  it("does not call the auskunft when the secret is wrong", async () => {
    const calls: string[] = [];
    const auskunft: Auskunft = {
      async journeys() {
        calls.push("journeys");
        return { journeys: [], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        calls.push("refresh");
        return { journey: null, realtimeDataUpdatedAt: null };
      },
    };

    const result = await planTick({
      secret: "nope",
      expectedSecret: "clock-secret",
      routes: [subject()],
      now: during,
      auskunft,
    });

    expect(result.refused).toBe(true);
    expect(result.checks).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("leaves a route outside the window untouched", async () => {
    const calls: string[] = [];
    const auskunft: Auskunft = {
      async journeys() {
        calls.push("journeys");
        return { journeys: [], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await planTick({
      secret: "clock-secret",
      expectedSecret: "clock-secret",
      routes: [subject()],
      now: new Date("2026-10-26T05:00:00+01:00"),
      auskunft,
    });

    expect(result.refused).toBe(false);
    expect(result.checks).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("checks an underway trip from the next stop", async () => {
    const seen: { from: string | null } = { from: null };
    const auskunft: Auskunft = {
      async journeys(from) {
        seen.from = from;
        return { journeys: [], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await planTick({
      secret: "clock-secret",
      expectedSecret: "clock-secret",
      routes: [subject({ previous: previous("2026-10-26T06:00:00+01:00") })],
      now: during,
      auskunft,
    });

    expect(seen.from).toBe("griebnitzsee");
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]?.userId).toBe("user-1");
  });
});
