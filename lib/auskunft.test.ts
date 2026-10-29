import { describe, expect, it } from "vitest";
import { avoidLinesProfile, liveAuskunft } from "./auskunft";

function fakeClient() {
  const seen: Array<Record<string, unknown>> = [];
  const client = {
    async journeys(_from: string, _to: string, options: Record<string, unknown>) {
      seen.push(options);
      return { journeys: [], realtimeDataUpdatedAt: null, earlierRef: null };
    },
  };
  return { client, seen };
}

describe("liveAuskunft", () => {
  const at = new Date("2026-10-26T17:12:00+01:00");

  it("asks for arrivals by default", async () => {
    const { client, seen } = fakeClient();

    await liveAuskunft((() => client) as never).journeys("a", "b", at);

    expect(seen[0]?.arrival).toBe(at);
    expect(seen[0]).not.toHaveProperty("departure");
    expect(seen[0]?.results).toBe(5);
  });

  it("asks for departures when the person leaves now", async () => {
    const { client, seen } = fakeClient();

    await liveAuskunft((() => client) as never).journeys("a", "b", at, "departure");

    expect(seen[0]?.departure).toBe(at);
    expect(seen[0]).not.toHaveProperty("arrival");
  });
});

describe("avoidLinesProfile", () => {
  it("adds an exclusion for each line to the journeys query", () => {
    const profile = avoidLinesProfile({ transformJourneysQuery: (_ctx: unknown, query: Record<string, unknown>) => query }, [
      "S7",
      "RE1",
    ]);

    const query = profile.transformJourneysQuery?.({}, { jnyFltrL: [{ type: "PROD", mode: "INC", value: "1" }] });

    expect(query?.jnyFltrL).toEqual([
      { type: "PROD", mode: "INC", value: "1" },
      { type: "LINE", mode: "EXC", value: "S7" },
      { type: "LINE", mode: "EXC", value: "RE1" },
    ]);
  });

  it("keeps the query of the base profile", () => {
    const profile = avoidLinesProfile(
      { transformJourneysQuery: (_ctx: unknown, query: Record<string, unknown>) => ({ ...query, extra: true }) },
      ["S7"],
    );

    expect(profile.transformJourneysQuery?.({}, {})).toMatchObject({ extra: true });
  });

  it("works on a profile without a query hook", () => {
    const profile = avoidLinesProfile({}, ["S7"]);

    expect(profile.transformJourneysQuery?.({}, {})?.jnyFltrL).toEqual([{ type: "LINE", mode: "EXC", value: "S7" }]);
  });
});

describe("liveAuskunft with avoided lines", () => {
  const at = new Date("2026-10-26T08:00:00+01:00");

  it("uses a client built for the avoided lines", async () => {
    const asked: string[][] = [];
    const makeClient = (avoid: string[]) => {
      asked.push(avoid);
      return fakeClient().client;
    };

    await liveAuskunft(makeClient as never).journeys("a", "b", at, "arrival", ["S7"]);
    await liveAuskunft(makeClient as never).journeys("a", "b", at);

    expect(asked).toEqual([["S7"], []]);
  });

  it("uses it for the earlier search too", async () => {
    const asked: string[][] = [];
    const makeClient = (avoid: string[]) => {
      asked.push(avoid);
      return fakeClient().client;
    };

    await liveAuskunft(makeClient as never).earlier?.("a", "b", "ref", ["S7"]);

    expect(asked).toEqual([["S7"]]);
  });
});
