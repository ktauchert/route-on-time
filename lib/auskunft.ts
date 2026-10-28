import { createVbbHafas } from "vbb-hafas";
import type { Auskunft } from "@/lib/check";

const userAgent =
  process.env.HAFAS_USER_AGENT ??
  "route-on-time (https://github.com/ktauchert/route-on-time)";

export function hafasClient() {
  return createVbbHafas(userAgent);
}

export function liveAuskunft(): Auskunft {
  const client = hafasClient();
  return {
    async journeys(from, to, arrival) {
      const result = await client.journeys(from, to, {
        arrival,
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
    async earlier(from, to, earlierRef) {
      const result = await client.journeys(from, to, {
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
      const result = await client.refreshJourney(refreshToken, { language: "de", stopovers: true });
      return {
        journey: result.journey ?? null,
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
      };
    },
  };
}
