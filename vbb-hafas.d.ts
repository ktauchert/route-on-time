declare module "vbb-hafas" {
  type Place = { type?: string; id?: string; name?: string; lines?: Place[] };

  type JourneyLeg = {
    walking?: boolean;
    cancelled?: boolean;
    line?: { id?: string; name?: string; product?: string } | null;
    origin?: { id?: string; name?: string } | null;
    destination?: { id?: string; name?: string } | null;
    stopovers?: Array<{
      stop?: { id?: string; name?: string } | null;
      departure?: string | null;
      arrival?: string | null;
    }>;
    departure?: string | null;
    plannedDeparture?: string | null;
    departureDelay?: number | null;
    arrival?: string | null;
    plannedArrival?: string | null;
    arrivalDelay?: number | null;
  };

  type Journey = { refreshToken?: string; legs?: JourneyLeg[] };

  type HafasClient = {
    locations: (
      query: string,
      options: { results?: number; stops?: boolean; addresses?: boolean; poi?: boolean },
    ) => Promise<Place[]>;
    stop: (id: string, options: { linesOfStops?: boolean }) => Promise<Place>;
    journeys: (
      from: string,
      to: string,
      options: {
        arrival?: Date;
        departure?: Date;
        earlierThan?: string;
        results?: number;
        language?: string;
        stopovers?: boolean;
      },
    ) => Promise<{
      journeys?: Journey[];
      earlierRef?: string | null;
      laterRef?: string | null;
      realtimeDataUpdatedAt?: number | null;
    }>;
    refreshJourney: (
      refreshToken: string,
      options?: { language?: string; stopovers?: boolean },
    ) => Promise<{ journey?: Journey | null; realtimeDataUpdatedAt?: number | null }>;
  };

  type Profile = {
    transformJourneysQuery?: (
      context: unknown,
      query: Record<string, unknown> & { jnyFltrL?: unknown[] },
    ) => Record<string, unknown> & { jnyFltrL?: unknown[] };
    [key: string]: unknown;
  };

  export const defaults: { profile: Profile };

  export function createVbbHafas(userAgent: string, options?: { profile?: Profile }): HafasClient;
}
