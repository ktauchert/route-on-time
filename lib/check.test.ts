import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkCopy, delayLabel, serviceDayLabel } from "./check-copy";
import {
  checkRow,
  runCheck,
  searchDay,
  todayFromCheck,
  travelPosition,
  type Auskunft,
  type CheckResult,
  type LegView,
  type RawJourney,
  type Suggestion,
} from "./check";
import type { Weekday } from "./route";

const mondayMorning = new Date("2026-10-26T07:00:00+01:00");
const mondayLate = new Date("2026-10-26T10:00:00+01:00");
const saturdayMorning = new Date("2026-10-24T08:00:00+02:00");

const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];

function route(overrides: Record<string, unknown> = {}) {
  return {
    startId: "start",
    destinationId: "destination",
    arrival: "09:00",
    weekdays,
    transferMinutes: null,
    maxTransfers: null,
    lineId: null,
    lineName: null,
    todayRefreshToken: null,
    todayServiceDate: null,
    ...overrides,
  };
}

function ride(overrides: Record<string, unknown> = {}) {
  return {
    origin: { name: "S+U Alexanderplatz" },
    destination: { name: "S+U Zoologischer Garten" },
    departure: "2026-10-26T08:10:00+01:00",
    arrival: "2026-10-26T08:50:00+01:00",
    line: { id: "line-s7", name: "S7" },
    ...overrides,
  };
}

function journey(token: string, legs: Array<Record<string, unknown>>): RawJourney {
  return { refreshToken: token, legs };
}

function onTime(token = "on-time"): RawJourney {
  return journey(token, [ride()]);
}

function auskunft(options: {
  journeys?: RawJourney[];
  refreshed?: RawJourney | null;
  realtimeDataUpdatedAt?: number | null;
  fail?: boolean;
}): Auskunft & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async journeys() {
      calls.push("journeys");
      if (options.fail) throw new Error("down");
      return {
        journeys: options.journeys ?? [onTime()],
        realtimeDataUpdatedAt: options.realtimeDataUpdatedAt ?? null,
      };
    },
    async refreshJourney() {
      calls.push("refresh");
      if (options.fail) throw new Error("down");
      return {
        journey: options.refreshed === undefined ? onTime("chosen") : options.refreshed,
        realtimeDataUpdatedAt: options.realtimeDataUpdatedAt ?? null,
      };
    },
  };
}

describe("searchDay", () => {
  it("searches today when the arrival is still ahead and the route applies", () => {
    expect(searchDay(weekdays, "09:00", mondayMorning)).toBe("2026-10-26");
  });

  it("searches the next matching weekday once the arrival has passed", () => {
    expect(searchDay(weekdays, "09:00", mondayLate)).toBe("2026-10-27");
  });

  it("skips a day the route does not apply, even when the arrival is still ahead", () => {
    expect(searchDay(weekdays, "09:00", saturdayMorning)).toBe("2026-10-26");
  });
});

describe("runCheck", () => {
  it("asks the auskunft for five journeys at today's arrival in Berlin", async () => {
    const seen: { arrival: Date | null } = { arrival: null };
    const client: Auskunft = {
      async journeys(_from, _to, at) {
        seen.arrival = at;
        return { journeys: [onTime()], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(seen.arrival?.toISOString()).toBe("2026-10-26T08:00:00.000Z");
    expect(result.serviceDate).toBe("2026-10-26");
    expect(result.status).toBe("fits");
    expect(result.reason).toBeNull();
    expect(result.suggestions[0]?.legs[0]?.originName).toBe("S+U Alexanderplatz");
    expect(result.suggestions[0]?.legs[0]?.lineName).toBe("S7");
  });

  it("searches the next weekday after the arrival has passed", async () => {
    const seen: { arrival: Date | null } = { arrival: null };
    const client: Auskunft = {
      async journeys(_from, _to, at) {
        seen.arrival = at;
        return { journeys: [onTime()], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayLate, client);

    expect(result.serviceDate).toBe("2026-10-27");
    expect(seen.arrival?.toISOString()).toBe("2026-10-27T08:00:00.000Z");
  });

  it("keeps a walking leg and a reported delay", async () => {
    const client = auskunft({
      journeys: [
        journey("walk", [
          {
            walking: true,
            origin: { name: "S+U Alexanderplatz" },
            destination: { name: "S+U Alexanderplatz" },
            departure: "2026-10-26T08:02:00+01:00",
            arrival: "2026-10-26T08:08:00+01:00",
          },
          ride({ departureDelay: 120, arrivalDelay: 120 }),
        ]),
      ],
    });

    const result = await runCheck(route(), mondayMorning, client);
    const legs = result.suggestions[0]?.legs ?? [];

    expect(legs[0]?.walking).toBe(true);
    expect(legs[1]?.departureDelaySeconds).toBe(120);
    expect(result.status).toBe("fits");
  });

  it("does not fit when the delayed arrival is after the set time", async () => {
    const client = auskunft({
      journeys: [
        journey("late", [
          ride({
            plannedArrival: "2026-10-26T08:50:00+01:00",
            arrival: "2026-10-26T09:10:00+01:00",
            arrivalDelay: 1200,
          }),
        ]),
      ],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("arrival");
    expect(result.connection?.refreshToken).toBe("late");
  });

  it("fits when the arrival is exactly the set time", async () => {
    const client = auskunft({
      journeys: [journey("exact", [ride({ arrival: "2026-10-26T09:00:00+01:00" })])],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("fits");
  });

  it("does not fit when a leg is cancelled, before any other reason", async () => {
    const client = auskunft({
      journeys: [
        journey("cancelled", [
          ride({
            cancelled: true,
            departure: null,
            arrival: null,
            plannedDeparture: "2026-10-26T08:10:00+01:00",
            plannedArrival: "2026-10-26T09:30:00+01:00",
          }),
        ]),
      ],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("cancelled");
  });

  it("does not fit when every suggestion misses the chosen line", async () => {
    const client = auskunft({ journeys: [onTime("u2-only")] });

    const result = await runCheck(
      route({ lineId: "line-s2", lineName: "S2" }),
      mondayMorning,
      client,
    );

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("line");
  });

  it("fits when one leg is the chosen line", async () => {
    const client = auskunft({ journeys: [onTime()] });

    const result = await runCheck(
      route({ lineId: "line-s7", lineName: "S7" }),
      mondayMorning,
      client,
    );

    expect(result.status).toBe("fits");
  });

  it("does not fit when every suggestion has too many transfers", async () => {
    const client = auskunft({
      journeys: [
        journey("two-rides", [
          ride({ destination: { name: "S Ostkreuz" }, arrival: "2026-10-26T08:30:00+01:00" }),
          ride({
            origin: { name: "S Ostkreuz" },
            departure: "2026-10-26T08:40:00+01:00",
            line: { id: "line-s3", name: "S3" },
          }),
        ]),
      ],
    });

    const result = await runCheck(route({ maxTransfers: 0 }), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("transfers");
  });

  it("does not fit when a transfer is shorter than the route asks", async () => {
    const client = auskunft({
      journeys: [
        journey("tight", [
          ride({ destination: { name: "S Ostkreuz" }, arrival: "2026-10-26T08:30:00+01:00" }),
          ride({
            origin: { name: "S Ostkreuz" },
            departure: "2026-10-26T08:33:00+01:00",
            arrival: "2026-10-26T08:50:00+01:00",
          }),
        ]),
      ],
    });

    const result = await runCheck(route({ transferMinutes: 5 }), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("transfer");
  });

  it("carries the first suggestion that fits, not an earlier one that misses", async () => {
    const client = auskunft({
      journeys: [
        journey("late", [ride({ arrival: "2026-10-26T09:20:00+01:00" })]),
        journey("also-late", [ride({ arrival: "2026-10-26T09:15:00+01:00" })]),
        onTime("fits"),
      ],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("fits");
    expect(result.suggestions).toHaveLength(3);
  });

  it("shows the first suggestion and its reason when none fit", async () => {
    const client = auskunft({
      journeys: [
        journey("late", [ride({ arrival: "2026-10-26T09:20:00+01:00" })]),
        journey("other-line", [ride({ line: { id: "line-u2", name: "U2" } })]),
      ],
    });

    const result = await runCheck(route({ lineName: "S2" }), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("arrival");
    expect(result.connection?.refreshToken).toBe("late");
  });

  it("ignores a sixth suggestion", async () => {
    const late = (token: string) =>
      journey(token, [ride({ arrival: "2026-10-26T09:20:00+01:00" })]);
    const client = auskunft({
      journeys: [late("1"), late("2"), late("3"), late("4"), late("5"), onTime("sixth")],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.suggestions).toHaveLength(5);
    expect(result.status).toBe("doesnt-fit");
  });

  it("uses an empty sentence when the auskunft returns no journey", async () => {
    const client = auskunft({ journeys: [] });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("empty");
    expect(result.connection).toBeNull();
    expect(result.suggestions).toEqual([]);
  });

  it("is unclear when the auskunft fails, and does not report fits", async () => {
    const client = auskunft({ fail: true });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("no-answer");
    expect(checkRow("user-1", "route-1", result).status).toBe("unclear");
  });

  it("trusts scheduled times when no realtime stamp and no delay are reported", async () => {
    const client = auskunft({
      journeys: [onTime()],
      realtimeDataUpdatedAt: null,
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("fits");
  });

  it("is unclear when departure is within the next hour and realtime is older than 15 minutes", async () => {
    const now = new Date("2026-10-26T07:50:00+01:00");
    const client = auskunft({
      journeys: [onTime()],
      realtimeDataUpdatedAt: Math.floor((now.getTime() - 20 * 60 * 1000) / 1000),
    });

    const result = await runCheck(route(), now, client);

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("stale");
  });

  it("keeps the judgment when realtime was updated within 15 minutes", async () => {
    const now = new Date("2026-10-26T07:50:00+01:00");
    const client = auskunft({
      journeys: [onTime()],
      realtimeDataUpdatedAt: Math.floor((now.getTime() - 5 * 60 * 1000) / 1000),
    });

    const result = await runCheck(route(), now, client);

    expect(result.status).toBe("fits");
  });

  it("keeps the judgment when departure is more than an hour away", async () => {
    const now = new Date("2026-10-26T06:00:00+01:00");
    const client = auskunft({
      journeys: [onTime()],
      realtimeDataUpdatedAt: Math.floor((now.getTime() - 20 * 60 * 1000) / 1000),
    });

    const result = await runCheck(route(), now, client);

    expect(result.status).toBe("fits");
  });

  it("judges only the chosen connection, even when another journey would fit", async () => {
    const client = auskunft({
      journeys: [onTime("other")],
      refreshed: journey("chosen", [ride({ cancelled: true, plannedArrival: "2026-10-26T08:40:00+01:00" })]),
    });

    const result = await runCheck(
      route({ todayRefreshToken: "chosen", todayServiceDate: "2026-10-26" }),
      mondayMorning,
      client,
    );

    expect(client.calls).toEqual(["refresh"]);
    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("cancelled");
    expect(result.connection?.refreshToken).toBe("chosen");
    expect(result.suggestions).toHaveLength(1);
  });

  it("searches again when the chosen connection belongs to another day", async () => {
    const client = auskunft({ journeys: [onTime()] });

    const result = await runCheck(
      route({ todayRefreshToken: "yesterday", todayServiceDate: "2026-10-25" }),
      mondayMorning,
      client,
    );

    expect(client.calls).toEqual(["journeys"]);
    expect(result.status).toBe("fits");
  });
});

describe("alternative", () => {
  const late = (token: string) =>
    journey(token, [ride({ arrival: "2026-10-26T09:20:00+01:00" })]);

  it("does not search further when a suggestion already fits", async () => {
    const calls: string[] = [];
    const client: Auskunft = {
      async journeys() {
        calls.push("journeys");
        return { journeys: [onTime()], realtimeDataUpdatedAt: null, earlierRef: "page-2" };
      },
      async earlier() {
        calls.push("earlier");
        return { journeys: [onTime("alt")], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("fits");
    expect(calls).toEqual(["journeys"]);
    expect(result.alternative).toBeNull();
    expect(todayFromCheck(result)).toBeNull();
  });

  it("takes the first later page connection that meets the arrival, not the second of the first five", async () => {
    const seen: { ref: string | null; arrival: Date | null } = { ref: null, arrival: null };
    const client: Auskunft = {
      async journeys(_from, _to, arrival) {
        seen.arrival = arrival;
        return {
          journeys: [late("first"), late("second")],
          realtimeDataUpdatedAt: null,
          earlierRef: "page-2",
        };
      },
      async earlier(_from, _to, ref) {
        seen.ref = ref;
        return {
          journeys: [
            late("still-late"),
            journey("alt", [
              ride({
                line: { id: "line-re1", name: "RE1" },
                arrival: "2026-10-26T08:40:00+01:00",
              }),
            ]),
          ],
          realtimeDataUpdatedAt: null,
        };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(seen.arrival?.toISOString()).toBe("2026-10-26T08:00:00.000Z");
    expect(seen.ref).toBe("page-2");
    expect(result.alternative?.refreshToken).toBe("alt");
    expect(result.alternative?.legs[0]?.lineName).toBe("RE1");
    expect(result.suggestions.map((item) => item.refreshToken)).toEqual(["first", "second"]);
    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("alt");
    expect(todayFromCheck(result)).toEqual({ refreshToken: "alt", serviceDate: "2026-10-26" });
    expect(checkRow("user-1", "route-1", result).alternative).toMatchObject({ refreshToken: "alt" });
  });

  it("does not search further when the first list is empty", async () => {
    const calls: string[] = [];
    const client: Auskunft = {
      async journeys() {
        calls.push("journeys");
        return { journeys: [], realtimeDataUpdatedAt: null, earlierRef: "page-2" };
      },
      async earlier() {
        calls.push("earlier");
        return { journeys: [onTime("alt")], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(calls).toEqual(["journeys"]);
    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("empty");
    expect(result.alternative).toBeNull();
    expect(result.noAlternative).toBe(false);
  });

  it("keeps doesnt-fit when the next page also misses the requirement", async () => {
    const client: Auskunft = {
      async journeys() {
        return { journeys: [late("first")], realtimeDataUpdatedAt: null, earlierRef: "page-2" };
      },
      async earlier() {
        return { journeys: [late("still-late")], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("arrival");
    expect(result.alternative).toBeNull();
    expect(result.noAlternative).toBe(true);
    expect(result.connection?.refreshToken).toBe("first");
    expect(todayFromCheck(result)).toBeNull();
  });

  it("skips a further connection that misses the line or has too many transfers", async () => {
    const direct = journey("direct", [
      ride({ line: { id: "line-s2", name: "S2" }, arrival: "2026-10-26T08:40:00+01:00" }),
    ]);
    const twoRides = journey("two", [
      ride({
        line: { id: "line-s2", name: "S2" },
        destination: { name: "S Ostkreuz" },
        arrival: "2026-10-26T08:20:00+01:00",
      }),
      ride({
        origin: { name: "S Ostkreuz" },
        departure: "2026-10-26T08:30:00+01:00",
        arrival: "2026-10-26T08:40:00+01:00",
        line: { id: "line-s2", name: "S2" },
      }),
    ]);
    const client: Auskunft = {
      async journeys() {
        return {
          journeys: [journey("u2", [ride({ line: { id: "line-u2", name: "U2" } })])],
          realtimeDataUpdatedAt: null,
          earlierRef: "page-2",
        };
      },
      async earlier() {
        return { journeys: [twoRides, direct], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(
      route({ lineName: "S2", maxTransfers: 0 }),
      mondayMorning,
      client,
    );

    expect(result.alternative?.refreshToken).toBe("direct");
    expect(result.status).toBe("fits");
  });

  it("says there is no alternative when the first page has no further ref", async () => {
    const calls: string[] = [];
    const client: Auskunft = {
      async journeys() {
        return { journeys: [late("first")], realtimeDataUpdatedAt: null, earlierRef: null };
      },
      async earlier() {
        calls.push("earlier");
        return { journeys: [onTime("alt")], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };

    const result = await runCheck(route(), mondayMorning, client);

    expect(calls).toEqual([]);
    expect(result.noAlternative).toBe(true);
    expect(result.status).toBe("doesnt-fit");
  });
});

function viewedLeg(overrides: Partial<LegView> = {}): LegView {
  return {
    walking: false,
    lineId: null,
    lineName: "S7",
    originId: "start-stop",
    originName: "Potsdam Hbf",
    destinationId: "griebnitzsee",
    destinationName: "S Griebnitzsee",
    departure: "2026-10-26T08:10:00+01:00",
    arrival: "2026-10-26T08:40:00+01:00",
    departureDelaySeconds: null,
    arrivalDelaySeconds: null,
    cancelled: false,
    stopovers: [],
    ...overrides,
  };
}

const carriedTrip: Suggestion = {
  refreshToken: "carried",
  legs: [
    viewedLeg(),
    viewedLeg({
      originId: "griebnitzsee",
      originName: "S Griebnitzsee",
      destinationId: "bernau",
      destinationName: "S Bernau",
      departure: "2026-10-26T08:50:00+01:00",
      arrival: "2026-10-26T09:20:00+01:00",
      lineName: "S2",
    }),
  ],
};

function carriedStand(): CheckResult {
  return {
    serviceDate: "2026-10-26",
    status: "fits",
    reason: null,
    checkedAt: "2026-10-26T06:00:00.000Z",
    connection: carriedTrip,
    suggestions: [carriedTrip],
    alternative: null,
    noAlternative: false,
    searched: true,
    searchFromName: null,
  };
}

const rawTrip: RawJourney = {
  refreshToken: "chosen",
  legs: [
    {
      origin: { id: "start-stop", name: "Potsdam Hbf" },
      destination: { id: "griebnitzsee", name: "S Griebnitzsee" },
      departure: "2026-10-26T08:10:00+01:00",
      arrival: "2026-10-26T08:40:00+01:00",
      line: { name: "S7" },
    },
    {
      origin: { id: "griebnitzsee", name: "S Griebnitzsee" },
      destination: { id: "bernau", name: "S Bernau" },
      departure: "2026-10-26T08:50:00+01:00",
      arrival: "2026-10-26T09:20:00+01:00",
      line: { name: "S2" },
    },
  ],
};

describe("travelPosition", () => {
  it("is before the trip until the first departure", () => {
    expect(travelPosition(carriedTrip, new Date("2026-10-26T08:00:00+01:00")).kind).toBe("before");
  });

  it("names the next stop while a leg is underway", () => {
    expect(travelPosition(carriedTrip, new Date("2026-10-26T08:20:00+01:00"))).toEqual({
      kind: "next-stop",
      id: "griebnitzsee",
      name: "S Griebnitzsee",
    });
  });

  it("names the upcoming stopover instead of the leg destination", () => {
    const withStop = {
      ...carriedTrip,
      legs: [
        viewedLeg({
          stopovers: [{ id: "wannsee", name: "S Wannsee", departure: "2026-10-26T08:25:00+01:00", arrival: "2026-10-26T08:24:00+01:00" }],
        }),
        carriedTrip.legs[1],
      ],
    };

    expect(travelPosition(withStop, new Date("2026-10-26T08:20:00+01:00"))).toEqual({
      kind: "next-stop",
      id: "wannsee",
      name: "S Wannsee",
    });
  });

  it("names the transfer stop between two legs", () => {
    expect(travelPosition(carriedTrip, new Date("2026-10-26T08:45:00+01:00"))).toEqual({
      kind: "transfer",
      id: "griebnitzsee",
      name: "S Griebnitzsee",
    });
  });

  it("is done once the last leg has arrived", () => {
    expect(travelPosition(carriedTrip, new Date("2026-10-26T09:20:00+01:00")).kind).toBe("done");
  });
});

describe("underway", () => {
  function recording(journeys: RawJourney[] = [onTime()], earlierRef: string | null = null) {
    const seen: { from: string | null; to: string | null; earlierFrom: string | null } = {
      from: null,
      to: null,
      earlierFrom: null,
    };
    const calls: string[] = [];
    const client: Auskunft = {
      async journeys(from, to) {
        calls.push("journeys");
        seen.from = from;
        seen.to = to;
        return { journeys, realtimeDataUpdatedAt: null, earlierRef };
      },
      async earlier(from) {
        calls.push("earlier");
        seen.earlierFrom = from;
        return {
          journeys: [journey("alt", [ride({ arrival: "2026-10-26T08:40:00+01:00", line: { name: "RE1" } })])],
          realtimeDataUpdatedAt: null,
        };
      },
      async refreshJourney() {
        calls.push("refresh");
        return { journey: rawTrip, realtimeDataUpdatedAt: null };
      },
    };
    return { seen, calls, client };
  }

  it("searches from the route start before departure and leaves that start unchanged", async () => {
    const { seen, client } = recording();
    const saved = route();

    const result = await runCheck(saved, new Date("2026-10-26T08:00:00+01:00"), client, carriedStand());

    expect(seen.from).toBe("start");
    expect(seen.to).toBe("destination");
    expect(saved.startId).toBe("start");
    expect(result.searchFromName).toBeNull();
  });

  it("searches the rest of the trip from the next stop while the first leg is underway", async () => {
    const { seen, client } = recording();

    const result = await runCheck(route(), new Date("2026-10-26T08:20:00+01:00"), client, carriedStand());

    expect(seen.from).toBe("griebnitzsee");
    expect(seen.to).toBe("destination");
    expect(result.searchFromName).toBe("S Griebnitzsee");
  });

  it("searches from the upcoming stopover", async () => {
    const { seen, client } = recording();
    const previous = carriedStand();
    previous.connection = {
      ...carriedTrip,
      legs: [
        viewedLeg({
          stopovers: [{ id: "wannsee", name: "S Wannsee", departure: "2026-10-26T08:25:00+01:00", arrival: "" }],
        }),
        carriedTrip.legs[1]!,
      ],
    };

    await runCheck(route(), new Date("2026-10-26T08:20:00+01:00"), client, previous);

    expect(seen.from).toBe("wannsee");
  });

  it("searches from the transfer stop between two legs", async () => {
    const { seen, client } = recording();

    const result = await runCheck(route(), new Date("2026-10-26T08:45:00+01:00"), client, carriedStand());

    expect(seen.from).toBe("griebnitzsee");
    expect(result.searchFromName).toBe("S Griebnitzsee");
  });

  it("keeps the day's stand and does not search after the last arrival", async () => {
    const { calls, client } = recording();

    const result = await runCheck(
      route({ arrival: "10:00" }),
      new Date("2026-10-26T09:30:00+01:00"),
      client,
      carriedStand(),
    );

    expect(calls).toEqual([]);
    expect(result.searched).toBe(false);
    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("carried");
  });

  it("searches the rest from the next stop when today's connection is already underway", async () => {
    const { seen, calls, client } = recording();

    await runCheck(
      route({ todayRefreshToken: "chosen", todayServiceDate: "2026-10-26" }),
      new Date("2026-10-26T08:20:00+01:00"),
      client,
      carriedStand(),
    );

    expect(calls).toEqual(["refresh", "journeys"]);
    expect(seen.from).toBe("griebnitzsee");
  });

  it("follows the same trip on the next check instead of returning to the start", async () => {
    const { seen, client } = recording();
    const first = await runCheck(route(), new Date("2026-10-26T08:20:00+01:00"), client, carriedStand());
    seen.from = null;

    await runCheck(route(), new Date("2026-10-26T08:25:00+01:00"), client, first);

    expect(seen.from).toBe("griebnitzsee");
  });

  it("looks for an alternative of the rest of the trip from the next stop", async () => {
    const late = journey("late", [ride({ arrival: "2026-10-26T09:20:00+01:00" })]);
    const { seen, client } = recording([late], "page-2");

    const result = await runCheck(route(), new Date("2026-10-26T08:20:00+01:00"), client, carriedStand());

    expect(seen.earlierFrom).toBe("griebnitzsee");
    expect(result.alternative?.refreshToken).toBe("alt");
    expect(result.status).toBe("fits");
  });
});

describe("checkCopy", () => {
  it("uses the domain status words in both languages", () => {
    expect(checkCopy("de").status.fits).toBe("passt");
    expect(checkCopy("de").status["doesnt-fit"]).toBe("passt nicht");
    expect(checkCopy("de").status.unclear).toBe("unklar");
    expect(checkCopy("en").status.fits).toBe("Fits");
    expect(checkCopy("en").status["doesnt-fit"]).toBe("Doesn't fit");
    expect(checkCopy("en").status.unclear).toBe("Unclear");
  });

  it("uses a different sentence for an empty list than for an unreachable auskunft", () => {
    const german = checkCopy("de");
    const english = checkCopy("en");

    expect(german.reason.empty).not.toBe(german.reason["no-answer"]);
    expect(english.reason.empty).not.toBe(english.reason["no-answer"]);
    expect(german.reason.arrival).toContain("Ankunft");
    expect(german.reason.transfer).toContain("Umstieg");
    expect(german.reason.transfers).toContain("Umstiege");
    expect(german.reason.line).toContain("Linie");
    expect(german.reason.cancelled).toContain("aus");
  });
});

describe("delayLabel", () => {
  it("shows a reported delay in minutes and hides an unreported one", () => {
    expect(delayLabel(120)).toBe("+2 min");
    expect(delayLabel(null)).toBeNull();
    expect(delayLabel(0)).toBeNull();
  });
});

describe("serviceDayLabel", () => {
  it("names the searched day", () => {
    expect(serviceDayLabel("de", "2026-10-26")).toContain("Montag");
    expect(serviceDayLabel("en", "2026-10-26")).toContain("Monday");
  });
});

describe("route check access", () => {
  it("stores the alternative next to the check", () => {
    const sql = readFileSync("supabase/migrations/20261028170000_route_check_alternative.sql", "utf8");

    expect(sql).toContain("alternative jsonb");
    expect(sql).toContain("no_alternative");
  });

  it("limits a saved check to the signed-in user", () => {
    const sql = readFileSync("supabase/migrations/20261028160000_route_checks.sql", "utf8");

    expect(sql).toContain("enable row level security");
    expect(sql).toContain("auth.uid() = user_id");
  });
});
