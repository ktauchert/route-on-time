import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkCopy, delayLabel, serviceDayLabel } from "./check-copy";
import {
  checkRow,
  moreSuggestions,
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
    preferredMode: null,
    relaxed: false,
    avoidLines: [],
    windowMinutes: 60,
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

  it("prefers a fitting connection with the preferred mode", async () => {
    const client = auskunft({
      journeys: [
        journey("s-bahn", [ride({ line: { id: "s7", name: "S7", product: "suburban" } })]),
        journey("regional", [
          ride({ line: { id: "re1", name: "RE1", product: "regional" }, departure: "2026-10-26T08:15:00+01:00", arrival: "2026-10-26T08:55:00+01:00" }),
        ]),
      ],
    });

    const result = await runCheck(route({ preferredMode: "regional" }), mondayMorning, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("regional");
  });

  it("still fits without the preferred mode when no connection has it", async () => {
    const client = auskunft({
      journeys: [journey("s-bahn", [ride({ line: { id: "s7", name: "S7", product: "suburban" } })])],
    });

    const result = await runCheck(route({ preferredMode: "regional" }), mondayMorning, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("s-bahn");
  });

  it("does not take a preferred connection that misses the arrival", async () => {
    const client = auskunft({
      journeys: [
        journey("s-bahn", [ride({ line: { id: "s7", name: "S7", product: "suburban" } })]),
        journey("regional-late", [
          ride({ line: { id: "re1", name: "RE1", product: "regional" }, departure: "2026-10-26T08:30:00+01:00", arrival: "2026-10-26T09:10:00+01:00" }),
        ]),
      ],
    });

    const result = await runCheck(route({ preferredMode: "regional" }), mondayMorning, client);

    expect(result.connection?.refreshToken).toBe("s-bahn");
  });

  describe("picking the connection", () => {
    function through(token: string, departure: string, arrival: string, rides = 1, extra: Record<string, unknown> = {}) {
      const legs = Array.from({ length: rides }, (_, index) =>
        ride({
          departure: index === 0 ? departure : "2026-10-26T07:30:00+01:00",
          arrival: index === rides - 1 ? arrival : "2026-10-26T07:25:00+01:00",
          ...extra,
        }),
      );
      return journey(token, legs);
    }

    it("takes the connection that arrives closest to the arrival time, not the first of the list", async () => {
      const client = auskunft({
        journeys: [
          through("early", "2026-10-26T05:57:00+01:00", "2026-10-26T07:14:00+01:00"),
          through("later", "2026-10-26T06:37:00+01:00", "2026-10-26T07:45:00+01:00"),
        ],
      });

      const result = await runCheck(route({ arrival: "08:00" }), new Date("2026-10-26T05:00:00+01:00"), client);

      expect(result.status).toBe("fits");
      expect(result.connection?.refreshToken).toBe("later");
    });

    it("does not drop the best connection when the auskunft returns more than five", async () => {
      const early = Array.from({ length: 5 }, (_, index) =>
        through(`early-${index}`, `2026-10-26T04:${10 + index}:00+01:00`, `2026-10-26T07:${10 + index}:00+01:00`),
      );
      const client = auskunft({
        journeys: [...early, through("best", "2026-10-26T06:46:00+01:00", "2026-10-26T07:45:00+01:00")],
      });

      const result = await runCheck(route({ arrival: "08:00" }), new Date("2026-10-26T04:00:00+01:00"), client);

      expect(result.connection?.refreshToken).toBe("best");
      expect(result.suggestions).toHaveLength(5);
      expect(result.suggestions.map((item) => item.refreshToken)).toContain("best");
      expect(result.suggestions.map((item) => item.refreshToken)).not.toContain("early-0");
    });

    it("prefers fewer transfers when two connections arrive together, then the shorter trip", async () => {
      const client = auskunft({
        journeys: [
          through("two-rides", "2026-10-26T06:00:00+01:00", "2026-10-26T07:30:00+01:00", 2),
          through("long-direct", "2026-10-26T06:10:00+01:00", "2026-10-26T07:30:00+01:00"),
          through("short-direct", "2026-10-26T06:40:00+01:00", "2026-10-26T07:30:00+01:00"),
        ],
      });

      const result = await runCheck(route({ arrival: "08:00" }), new Date("2026-10-26T05:00:00+01:00"), client);

      expect(result.connection?.refreshToken).toBe("short-direct");
    });

    it("takes the earliest arrival for a route that starts with the leave button", async () => {
      const now = new Date("2026-10-26T17:12:00+01:00");
      const client = auskunft({
        journeys: [
          through("soon", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00"),
          through("later", "2026-10-26T17:50:00+01:00", "2026-10-26T18:40:00+01:00"),
        ],
      });

      const result = await runCheck(route({ arrival: "", leftAt: now.toISOString() }), now, client);

      expect(result.connection?.refreshToken).toBe("soon");
    });
  });

  describe("relaxed travel", () => {
    function viaTransfer(token: string, arrival: string) {
      return journey(token, [
        ride({ departure: "2026-10-26T08:00:00+01:00", arrival: "2026-10-26T08:20:00+01:00" }),
        ride({ departure: "2026-10-26T08:25:00+01:00", arrival, line: { id: "s2", name: "S2", product: "suburban" } }),
      ]);
    }

    function direct(token: string, arrival: string) {
      return journey(token, [ride({ departure: "2026-10-26T08:10:00+01:00", arrival })]);
    }

    it("takes the latest fitting arrival by default, even with a transfer", async () => {
      const client = auskunft({ journeys: [direct("calm", "2026-10-26T08:45:00+01:00"), viaTransfer("quick", "2026-10-26T08:55:00+01:00")] });

      const result = await runCheck(route(), mondayMorning, client);

      expect(result.connection?.refreshToken).toBe("quick");
    });

    it("takes fewer transfers when the arrival is at most 20 minutes earlier", async () => {
      const client = auskunft({ journeys: [direct("calm", "2026-10-26T08:45:00+01:00"), viaTransfer("quick", "2026-10-26T08:55:00+01:00")] });

      const result = await runCheck(route({ relaxed: true }), mondayMorning, client);

      expect(result.status).toBe("fits");
      expect(result.connection?.refreshToken).toBe("calm");
    });

    it("does not arrive more than 20 minutes earlier for it", async () => {
      const client = auskunft({ journeys: [direct("far-too-early", "2026-10-26T08:20:00+01:00"), viaTransfer("quick", "2026-10-26T08:55:00+01:00")] });

      const result = await runCheck(route({ relaxed: true }), mondayMorning, client);

      expect(result.connection?.refreshToken).toBe("quick");
    });

    it("takes fewer transfers within 20 minutes later when the person leaves now", async () => {
      const now = new Date("2026-10-26T17:12:00+01:00");
      const client = auskunft({
        journeys: [
          journey("quick", [
            ride({ departure: "2026-10-26T17:20:00+01:00", arrival: "2026-10-26T17:50:00+01:00" }),
            ride({ departure: "2026-10-26T17:55:00+01:00", arrival: "2026-10-26T18:10:00+01:00" }),
          ]),
          journey("calm", [ride({ departure: "2026-10-26T17:30:00+01:00", arrival: "2026-10-26T18:25:00+01:00" })]),
        ],
      });

      const result = await runCheck(route({ arrival: "", leftAt: now.toISOString(), relaxed: true }), now, client);

      expect(result.connection?.refreshToken).toBe("calm");
    });

    it("applies the preferred mode first and relaxes within it", async () => {
      const client = auskunft({
        journeys: [
          direct("calm-s-bahn", "2026-10-26T08:50:00+01:00"),
          journey("regional-transfer", [
            ride({ line: { id: "re1", name: "RE1", product: "regional" }, departure: "2026-10-26T08:00:00+01:00", arrival: "2026-10-26T08:20:00+01:00" }),
            ride({ line: { id: "s2", name: "S2", product: "suburban" }, departure: "2026-10-26T08:25:00+01:00", arrival: "2026-10-26T08:45:00+01:00" }),
          ]),
        ],
      });

      const result = await runCheck(route({ preferredMode: "regional", relaxed: true }), mondayMorning, client);

      expect(result.connection?.refreshToken).toBe("regional-transfer");
    });
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
        journey("later", [ride({ arrival: "2026-10-26T09:25:00+01:00" })]),
      ],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("arrival");
    expect(result.connection?.refreshToken).toBe("late");
  });

  it("shows five suggestions and still finds a fitting sixth one", async () => {
    const late = (token: string) =>
      journey(token, [ride({ arrival: "2026-10-26T09:20:00+01:00" })]);
    const client = auskunft({
      journeys: [late("1"), late("2"), late("3"), late("4"), late("5"), onTime("sixth")],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.suggestions).toHaveLength(5);
    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("sixth");
    expect(result.suggestions.map((item) => item.refreshToken)).toContain("sixth");
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

  it("skips a further connection that has too many transfers", async () => {
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
          journeys: [journey("late", [ride({ arrival: "2026-10-26T09:20:00+01:00" })])],
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
      route({ maxTransfers: 0 }),
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

describe("a failed check keeps the last good stand", () => {
  const later = new Date("2026-10-26T07:30:00+01:00");

  async function good() {
    return runCheck(route(), mondayMorning, auskunft({ journeys: [onTime()] }));
  }

  it("keeps the stand, the connection and its time when the auskunft does not answer", async () => {
    const before = await good();

    const result = await runCheck(route(), later, auskunft({ fail: true }), before);

    expect(result.status).toBe("fits");
    expect(result.connection).toEqual(before.connection);
    expect(result.suggestions).toEqual(before.suggestions);
    expect(result.checkedAt).toBe(before.checkedAt);
    expect(result.failedAt).toBe(later.toISOString());
    expect(result.searched).toBe(true);
  });

  it("keeps the stand when the realtime data is too old to judge", async () => {
    const before = await good();
    const now = new Date("2026-10-26T07:50:00+01:00");
    const stale = auskunft({
      journeys: [onTime()],
      realtimeDataUpdatedAt: Math.floor((now.getTime() - 20 * 60 * 1000) / 1000),
    });

    const result = await runCheck(route(), now, stale, before);

    expect(result.status).toBe("fits");
    expect(result.checkedAt).toBe(before.checkedAt);
    expect(result.failedAt).toBe(now.toISOString());
  });

  it("clears the failure once a check answers again", async () => {
    const before = await good();
    const failed = await runCheck(route(), later, auskunft({ fail: true }), before);

    const result = await runCheck(route(), new Date("2026-10-26T07:35:00+01:00"), auskunft({}), failed);

    expect(result.status).toBe("fits");
    expect(result.failedAt ?? null).toBeNull();
    expect(result.checkedAt).toBe("2026-10-26T06:35:00.000Z");
  });

  it("does not carry a stand over from another day", async () => {
    const yesterday = { ...(await good()), serviceDate: "2026-10-23" };

    const result = await runCheck(route(), later, auskunft({ fail: true }), yesterday);

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("no-answer");
    expect(result.failedAt ?? null).toBeNull();
  });

  it("is unclear when there was no good stand before", async () => {
    const result = await runCheck(route(), later, auskunft({ fail: true }), null);

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("no-answer");
  });

  it("does not hide an answered doesnt-fit behind an older fits", async () => {
    const before = await good();
    const tooLate = auskunft({
      journeys: [
        journey("late", [ride({ arrival: "2026-10-26T09:30:00+01:00" })]),
      ],
    });

    const result = await runCheck(route(), later, tooLate, before);

    expect(result.status).toBe("doesnt-fit");
    expect(result.failedAt ?? null).toBeNull();
  });

  it("writes the failure time to its own column", async () => {
    const before = await good();
    const result = await runCheck(route(), later, auskunft({ fail: true }), before);

    expect(checkRow("user-1", "route-1", result).failed_at).toBe(later.toISOString());
    expect(checkRow("user-1", "route-1", before).failed_at).toBeNull();
  });
});

describe("a route that starts with the leave button", () => {
  const left = new Date("2026-10-26T17:12:00+01:00");

  function leaving(overrides: Record<string, unknown> = {}) {
    return route({ arrival: "", leftAt: left.toISOString(), ...overrides });
  }

  function departing(token: string, departure: string, arrival: string, extra: Record<string, unknown> = {}) {
    return journey(token, [ride({ departure, arrival, ...extra })]);
  }

  function seeing(pages: RawJourney[][]) {
    const asked: Array<{ at: Date; direction: string | undefined }> = [];
    const client: Auskunft = {
      async journeys(_from, _to, at, direction) {
        asked.push({ at, direction });
        return { journeys: pages.shift() ?? [], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        return { journey: null, realtimeDataUpdatedAt: null };
      },
    };
    return { client, asked };
  }

  it("does not search before the person has left today", async () => {
    const { client, asked } = seeing([[onTime()]]);

    const result = await runCheck(route({ arrival: "", leftAt: null }), left, client);

    expect(asked).toEqual([]);
    expect(result.searched).toBe(false);
  });

  it("does not search on a leave from another day", async () => {
    const { client, asked } = seeing([[onTime()]]);

    const result = await runCheck(
      route({ arrival: "", leftAt: "2026-10-23T17:10:00+02:00" }),
      left,
      client,
    );

    expect(asked).toEqual([]);
    expect(result.searched).toBe(false);
  });

  it("searches departures from now and calls the first usable one fitting", async () => {
    const { client, asked } = seeing([
      [departing("first", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00")],
    ]);

    const result = await runCheck(leaving(), left, client);

    expect(asked).toEqual([{ at: left, direction: "departure" }]);
    expect(result.serviceDate).toBe("2026-10-26");
    expect(result.status).toBe("fits");
    expect(result.reason).toBeNull();
    expect(result.connection?.refreshToken).toBe("first");
  });

  it("does not judge the arrival, whatever the hour", async () => {
    const { client } = seeing([
      [departing("late", "2026-10-26T22:00:00+01:00", "2026-10-26T23:30:00+01:00")],
    ]);

    const result = await runCheck(leaving(), left, client);

    expect(result.status).toBe("fits");
  });

  it("takes the first connection that keeps the requirement", async () => {
    const { client } = seeing([
      [
        departing("cancelled", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00", { cancelled: true }),
        departing("running", "2026-10-26T17:35:00+01:00", "2026-10-26T18:25:00+01:00"),
      ],
    ]);

    const result = await runCheck(leaving(), left, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("running");
  });

  it("says it does not fit when every connection breaks the requirement", async () => {
    const { client } = seeing([
      [departing("cancelled", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00", { cancelled: true })],
    ]);

    const result = await runCheck(leaving(), left, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("cancelled");
  });

  it("is unclear when the auskunft does not answer", async () => {
    const result = await runCheck(leaving(), left, auskunft({ fail: true }));

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("no-answer");
  });

  it("reads the chosen connection again and keeps it while it runs", async () => {
    const client = auskunft({
      refreshed: departing("chosen", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00"),
    });

    const result = await runCheck(
      leaving({ todayRefreshToken: "chosen", todayServiceDate: "2026-10-26" }),
      new Date("2026-10-26T17:14:00+01:00"),
      client,
    );

    expect(client.calls).toEqual(["refresh"]);
    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("chosen");
  });

  it("searches again when the chosen connection is cancelled and offers the next one as the alternative", async () => {
    const { client } = seeing([
      [departing("next", "2026-10-26T17:40:00+01:00", "2026-10-26T18:30:00+01:00")],
    ]);
    client.refreshJourney = async () => ({
      journey: departing("chosen", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00", { cancelled: true }),
      realtimeDataUpdatedAt: null,
    });

    const result = await runCheck(
      leaving({ todayRefreshToken: "chosen", todayServiceDate: "2026-10-26" }),
      new Date("2026-10-26T17:14:00+01:00"),
      client,
    );

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("next");
    expect(result.alternative?.refreshToken).toBe("next");
    expect(todayFromCheck(result)).toEqual({ refreshToken: "next", serviceDate: "2026-10-26" });
  });

  it("says it does not fit when the chosen connection is cancelled and nothing else runs", async () => {
    const { client } = seeing([[]]);
    client.refreshJourney = async () => ({
      journey: departing("chosen", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00", { cancelled: true }),
      realtimeDataUpdatedAt: null,
    });

    const result = await runCheck(
      leaving({ todayRefreshToken: "chosen", todayServiceDate: "2026-10-26" }),
      new Date("2026-10-26T17:14:00+01:00"),
      client,
    );

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("empty");
  });
});

describe("the transport mode of a leg", () => {
  it("is kept from the auskunft's product", async () => {
    const client = auskunft({
      journeys: [journey("a", [ride({ line: { id: "line-s7", name: "S7", product: "suburban" } })])],
    });

    const result = await runCheck(route(), mondayMorning, client);

    expect(result.suggestions[0]?.legs[0]?.product).toBe("suburban");
  });

  it("is empty when the auskunft names none", async () => {
    const result = await runCheck(route(), mondayMorning, auskunft({}));

    expect(result.suggestions[0]?.legs[0]?.product ?? null).toBeNull();
  });
});

describe("tapping the leave button again", () => {
  const during = new Date("2026-10-26T08:45:00+01:00");

  function recording() {
    const from: string[] = [];
    const client: Auskunft = {
      async journeys(start) {
        from.push(start);
        return {
          journeys: [
            journey("fresh", [ride({ departure: "2026-10-26T08:50:00+01:00", arrival: "2026-10-26T09:30:00+01:00" })]),
          ],
          realtimeDataUpdatedAt: null,
        };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };
    return { client, from };
  }

  function stand(checkedAt: string): CheckResult {
    return { ...carriedStand(), checkedAt };
  }

  it("searches from the start of the route, not from where the old connection would be", async () => {
    const { client, from } = recording();
    const earlier = stand("2026-10-26T08:30:00+01:00");

    const result = await runCheck(
      route({ arrival: "", leftAt: during.toISOString() }),
      during,
      client,
      earlier,
    );

    expect(from).toEqual(["start"]);
    expect(result.searchFromName).toBeNull();
    expect(result.connection?.refreshToken).toBe("fresh");
  });

  it("keeps searching from the next stop after that tap, once the new connection is under way", async () => {
    const { client, from } = recording();
    const afterTap = stand("2026-10-26T08:46:00+01:00");

    const result = await runCheck(
      route({ arrival: "", leftAt: "2026-10-26T08:44:00+01:00" }),
      new Date("2026-10-26T08:47:00+01:00"),
      client,
      afterTap,
    );

    expect(from).toEqual(["griebnitzsee"]);
    expect(result.searchFromName).toBe("S Griebnitzsee");
  });

  it("does not bring the old connection back when the new search fails", async () => {
    const earlier = stand("2026-10-26T08:30:00+01:00");

    const result = await runCheck(
      route({ arrival: "", leftAt: during.toISOString() }),
      during,
      auskunft({ fail: true }),
      earlier,
    );

    expect(result.status).toBe("unclear");
    expect(result.reason).toBe("no-answer");
    expect(result.connection).toBeNull();
  });
});

describe("avoided lines", () => {
  function recordingClient(pages: RawJourney[][]) {
    const asked: Array<{ method: string; direction?: string; avoid?: string[] }> = [];
    const client: Auskunft = {
      async journeys(_from, _to, _at, direction, avoid) {
        asked.push({ method: "journeys", direction, avoid });
        return { journeys: pages.shift() ?? [], realtimeDataUpdatedAt: null, earlierRef: "ref" };
      },
      async earlier(_from, _to, _ref, avoid) {
        asked.push({ method: "earlier", avoid });
        return { journeys: pages.shift() ?? [], realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        throw new Error("unused");
      },
    };
    return { client, asked };
  }

  const s7 = { id: "s7", name: "S7", product: "suburban" };
  const s2 = { id: "s2", name: "S2", product: "suburban" };

  it("asks the auskunft to leave the lines out", async () => {
    const { client, asked } = recordingClient([[journey("a", [ride({ line: s2 })])]]);

    await runCheck(route({ avoidLines: ["S7"] }), mondayMorning, client);

    expect(asked[0]).toMatchObject({ method: "journeys", avoid: ["S7"] });
  });

  it("asks again without the lines for the further search", async () => {
    const { client, asked } = recordingClient([
      [journey("late", [ride({ line: s2, arrival: "2026-10-26T09:30:00+01:00" })])],
      [journey("alt", [ride({ line: s2 })])],
    ]);

    const result = await runCheck(route({ avoidLines: ["S7"] }), mondayMorning, client);

    expect(asked.map((entry) => [entry.method, entry.avoid])).toEqual([
      ["journeys", ["S7"]],
      ["earlier", ["S7"]],
    ]);
    expect(result.alternative?.refreshToken).toBe("alt");
  });

  it("keeps them when the person leaves now", async () => {
    const { client, asked } = recordingClient([[journey("a", [ride({ line: s2 })])]]);

    await runCheck(
      route({ arrival: "", leftAt: mondayMorning.toISOString(), avoidLines: ["S7"] }),
      mondayMorning,
      client,
    );

    expect(asked[0]).toMatchObject({ direction: "departure", avoid: ["S7"] });
  });

  it("does not take a connection with an avoided line, even when the auskunft returns one", async () => {
    const { client } = recordingClient([
      [journey("with-s7", [ride({ line: s7 })]), journey("with-s2", [ride({ line: s2 })])],
    ]);

    const result = await runCheck(route({ avoidLines: ["S7"] }), mondayMorning, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("with-s2");
  });

  it("says it does not fit when every connection uses an avoided line", async () => {
    const { client } = recordingClient([[journey("with-s7", [ride({ line: s7 })])]]);

    const result = await runCheck(route({ avoidLines: ["S7"] }), mondayMorning, client);

    expect(result.status).toBe("doesnt-fit");
    expect(result.reason).toBe("avoided");
  });

  it("ignores spaces and case in the line name", async () => {
    const { client } = recordingClient([
      [journey("with-s7", [ride({ line: { id: "s7", name: "S 7", product: "suburban" } })])],
    ]);

    const result = await runCheck(route({ avoidLines: ["s7"] }), mondayMorning, client);

    expect(result.reason).toBe("avoided");
  });

  it("does not avoid a line that merely starts with the same letters", async () => {
    const { client } = recordingClient([
      [journey("with-s75", [ride({ line: { id: "s75", name: "S75", product: "suburban" } })])],
    ]);

    const result = await runCheck(route({ avoidLines: ["S7"] }), mondayMorning, client);

    expect(result.status).toBe("fits");
  });

  it("asks with no avoid list when nothing is avoided", async () => {
    const { client, asked } = recordingClient([[journey("a", [ride({ line: s2 })])]]);

    await runCheck(route(), mondayMorning, client);

    expect(asked[0]?.avoid ?? []).toEqual([]);
  });
});

describe("the window before the arrival time", () => {
  const before = new Date("2026-10-26T05:00:00+01:00");

  function arriving(token: string, arrival: string, rides = 1) {
    const legs = Array.from({ length: rides }, (_, index) =>
      ride({
        departure: index === 0 ? "2026-10-26T05:30:00+01:00" : "2026-10-26T06:00:00+01:00",
        arrival: index === rides - 1 ? arrival : "2026-10-26T05:55:00+01:00",
      }),
    );
    return journey(token, legs);
  }

  it("shows only connections that arrive within an hour of the arrival time", async () => {
    const client = auskunft({
      journeys: [
        arriving("way-early", "2026-10-26T06:10:00+01:00"),
        arriving("early", "2026-10-26T07:10:00+01:00"),
        arriving("close", "2026-10-26T07:30:00+01:00"),
        arriving("closest", "2026-10-26T07:50:00+01:00"),
      ],
    });

    const result = await runCheck(route({ arrival: "08:00" }), before, client);

    expect(result.suggestions.map((item) => item.refreshToken)).toEqual(["early", "close", "closest"]);
  });

  it("uses the window the route carries", async () => {
    const client = auskunft({
      journeys: [
        arriving("early", "2026-10-26T07:10:00+01:00"),
        arriving("close", "2026-10-26T07:30:00+01:00"),
      ],
    });

    const result = await runCheck(route({ arrival: "08:00", windowMinutes: 45 }), before, client);

    expect(result.suggestions.map((item) => item.refreshToken)).toEqual(["close"]);
  });

  it("falls back to 60 minutes when the route carries none", async () => {
    const client = auskunft({
      journeys: [arriving("early", "2026-10-26T07:10:00+01:00"), arriving("close", "2026-10-26T07:30:00+01:00")],
    });

    const result = await runCheck(route({ arrival: "08:00", windowMinutes: undefined }), before, client);

    expect(result.suggestions).toHaveLength(2);
  });

  it("still fits with the closest connection when every one is earlier than the window", async () => {
    const client = auskunft({
      journeys: [
        arriving("far", "2026-10-26T05:50:00+01:00"),
        arriving("less-far", "2026-10-26T06:20:00+01:00"),
      ],
    });

    const result = await runCheck(route({ arrival: "08:00" }), before, client);

    expect(result.status).toBe("fits");
    expect(result.connection?.refreshToken).toBe("less-far");
    expect(result.suggestions.map((item) => item.refreshToken)).toEqual(["less-far"]);
  });

  it("does not leave the window to save a transfer", async () => {
    const client = auskunft({
      journeys: [
        arriving("calm-but-early", "2026-10-26T06:30:00+01:00"),
        arriving("in-window", "2026-10-26T07:50:00+01:00", 2),
      ],
    });

    const result = await runCheck(route({ arrival: "08:00", relaxed: true }), before, client);

    expect(result.connection?.refreshToken).toBe("in-window");
  });

  it("does not apply to a route that starts with the leave button", async () => {
    const now = new Date("2026-10-26T17:12:00+01:00");
    const client = auskunft({
      journeys: [journey("soon", [ride({ departure: "2026-10-26T17:20:00+01:00", arrival: "2026-10-26T18:10:00+01:00" })])],
    });

    const result = await runCheck(route({ arrival: "", leftAt: now.toISOString() }), now, client);

    expect(result.suggestions).toHaveLength(1);
  });
});

describe("moreSuggestions", () => {
  const now = new Date("2026-10-26T05:00:00+01:00");

  function ending(token: string, departure: string, arrival: string) {
    return journey(token, [ride({ departure, arrival })]);
  }

  function recording(journeys: RawJourney[]) {
    const asked: { at: Date; direction?: string }[] = [];
    const client: Auskunft = {
      async journeys(_from, _to, at, direction) {
        asked.push({ at, direction });
        return { journeys, realtimeDataUpdatedAt: null };
      },
      async refreshJourney() {
        return { journey: null, realtimeDataUpdatedAt: null };
      },
    };
    return { client, asked };
  }

  async function stand(routeOverrides = {}, journeys: RawJourney[] = []) {
    const first = auskunft({ journeys });
    return runCheck(route({ arrival: "08:00", ...routeOverrides }), now, first);
  }

  it("asks for connections that arrive before the earliest one already shown", async () => {
    const current = await stand({}, [ending("shown", "2026-10-26T06:30:00+01:00", "2026-10-26T07:30:00+01:00")]);
    const { client, asked } = recording([]);

    await moreSuggestions(route({ arrival: "08:00" }), now, client, current);

    expect(asked).toEqual([{ at: new Date("2026-10-26T07:29:00+01:00"), direction: "arrival" }]);
  });

  it("adds new connections in arrival order and keeps the status and the chosen connection", async () => {
    const current = await stand({}, [ending("shown", "2026-10-26T06:30:00+01:00", "2026-10-26T07:30:00+01:00")]);
    const { client } = recording([
      ending("shown", "2026-10-26T06:30:00+01:00", "2026-10-26T07:30:00+01:00"),
      ending("older", "2026-10-26T05:30:00+01:00", "2026-10-26T06:30:00+01:00"),
      ending("oldest", "2026-10-26T04:30:00+01:00", "2026-10-26T05:30:00+01:00"),
    ]);

    const more = await moreSuggestions(route({ arrival: "08:00" }), now, client, current);

    expect(more?.suggestions.map((item) => item.refreshToken)).toEqual(["oldest", "older", "shown"]);
    expect(more?.status).toBe(current.status);
    expect(more?.connection?.refreshToken).toBe("shown");
  });

  it("asks for departures after the latest one shown on a leave route", async () => {
    const leftAt = "2026-10-26T17:12:00+01:00";
    const leaveRoute = route({ arrival: "", leftAt });
    const current = await runCheck(
      leaveRoute,
      new Date(leftAt),
      auskunft({ journeys: [ending("first", "2026-10-26T17:20:00+01:00", "2026-10-26T18:10:00+01:00")] }),
    );
    const { client, asked } = recording([ending("next", "2026-10-26T17:40:00+01:00", "2026-10-26T18:30:00+01:00")]);

    const more = await moreSuggestions(leaveRoute, new Date(leftAt), client, current);

    expect(asked).toEqual([{ at: new Date("2026-10-26T17:21:00+01:00"), direction: "departure" }]);
    expect(more?.suggestions.map((item) => item.refreshToken)).toEqual(["first", "next"]);
  });

  it("stops growing at fifteen suggestions", async () => {
    const current = await stand({}, [ending("shown", "2026-10-26T06:30:00+01:00", "2026-10-26T07:30:00+01:00")]);
    const many = Array.from({ length: 20 }, (_, index) =>
      ending(`old-${index}`, `2026-10-26T04:${10 + index}:00+01:00`, `2026-10-26T05:${10 + index}:00+01:00`),
    );
    const { client } = recording(many);

    const more = await moreSuggestions(route({ arrival: "08:00" }), now, client, current);

    expect(more?.suggestions).toHaveLength(15);
    expect(more?.suggestions.map((item) => item.refreshToken)).toContain("shown");
  });

  it("returns nothing when the auskunft fails or there is no stand to extend", async () => {
    const current = await stand({}, [ending("shown", "2026-10-26T06:30:00+01:00", "2026-10-26T07:30:00+01:00")]);
    const failing: Auskunft = {
      async journeys() {
        throw new Error("down");
      },
      async refreshJourney() {
        return { journey: null, realtimeDataUpdatedAt: null };
      },
    };

    expect(await moreSuggestions(route({ arrival: "08:00" }), now, failing, current)).toBeNull();
    expect(await moreSuggestions(route({ arrival: "08:00" }), now, recording([]).client, null)).toBeNull();
  });
});
