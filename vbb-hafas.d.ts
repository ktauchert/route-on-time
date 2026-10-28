declare module "vbb-hafas" {
  type Place = { type?: string; id?: string; name?: string; lines?: Place[] };

  type JourneyLeg = {
    walking?: boolean;
    cancelled?: boolean;
    line?: { id?: string; name?: string } | null;
    origin?: { name?: string } | null;
    destination?: { name?: string } | null;
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
      options: { arrival?: Date; results?: number; language?: string },
    ) => Promise<{ journeys?: Journey[]; realtimeDataUpdatedAt?: number | null }>;
    refreshJourney: (
      refreshToken: string,
      options?: { language?: string },
    ) => Promise<{ journey?: Journey | null; realtimeDataUpdatedAt?: number | null }>;
  };

  export function createVbbHafas(userAgent: string): HafasClient;
}
