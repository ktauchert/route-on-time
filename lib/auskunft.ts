import { createVbbHafas, defaults } from "vbb-hafas";
import type { Auskunft } from "@/lib/check";

const userAgent =
  process.env.HAFAS_USER_AGENT ??
  "route-on-time (https://github.com/ktauchert/route-on-time)";

type Query = Record<string, unknown> & { jnyFltrL?: unknown[] };
type Profile = { transformJourneysQuery?: (context: unknown, query: Query) => Query };

// HAFAS can leave single lines out of a search, but hafas-client has no option for it.
export function avoidLinesProfile<P extends Profile>(profile: P, names: readonly string[]): P & Profile {
  return {
    ...profile,
    transformJourneysQuery(context: unknown, query: Query) {
      const base = profile.transformJourneysQuery ? profile.transformJourneysQuery(context, query) : query;
      return {
        ...base,
        jnyFltrL: [
          ...(base.jnyFltrL ?? []),
          ...names.map((value) => ({ type: "LINE", mode: "EXC", value })),
        ],
      };
    },
  };
}

export function hafasClient(avoid: readonly string[] = []) {
  if (avoid.length === 0) return createVbbHafas(userAgent);
  return createVbbHafas(userAgent, { profile: avoidLinesProfile(defaults.profile, avoid) });
}

export function liveAuskunft(makeClient: (avoid: string[]) => ReturnType<typeof hafasClient> = hafasClient): Auskunft {
  return {
    async journeys(from, to, at, direction = "arrival", avoid = []) {
      const result = await makeClient(avoid).journeys(from, to, {
        ...(direction === "departure" ? { departure: at } : { arrival: at }),
        results: 5,
        language: "de",
        stopovers: true,
      });
      return {
        journeys: result.journeys ?? [],
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
        earlierRef: result.earlierRef ?? null,
      };
    },
    async earlier(from, to, earlierRef, avoid = []) {
      const result = await makeClient(avoid).journeys(from, to, {
        earlierThan: earlierRef,
        results: 5,
        language: "de",
        stopovers: true,
      });
      return {
        journeys: result.journeys ?? [],
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
        earlierRef: result.earlierRef ?? null,
      };
    },
    async refreshJourney(refreshToken) {
      const result = await makeClient([]).refreshJourney(refreshToken, { language: "de", stopovers: true });
      return {
        journey: result.journey ?? null,
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
      };
    },
  };
}
