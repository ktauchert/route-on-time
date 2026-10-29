import { describe, expect, it } from "vitest";
import { liveAuskunft } from "./auskunft";

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

    await liveAuskunft(client as never).journeys("a", "b", at);

    expect(seen[0]?.arrival).toBe(at);
    expect(seen[0]).not.toHaveProperty("departure");
    expect(seen[0]?.results).toBe(5);
  });

  it("asks for departures when the person leaves now", async () => {
    const { client, seen } = fakeClient();

    await liveAuskunft(client as never).journeys("a", "b", at, "departure");

    expect(seen[0]?.departure).toBe(at);
    expect(seen[0]).not.toHaveProperty("arrival");
  });
});
