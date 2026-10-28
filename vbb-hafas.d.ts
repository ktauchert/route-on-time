declare module "vbb-hafas" {
  type Place = { type?: string; id?: string; name?: string; lines?: Place[] };

  type HafasClient = {
    locations: (
      query: string,
      options: { results?: number; stops?: boolean; addresses?: boolean; poi?: boolean },
    ) => Promise<Place[]>;
    stop: (id: string, options: { linesOfStops?: boolean }) => Promise<Place>;
  };

  export function createVbbHafas(userAgent: string): HafasClient;
}
