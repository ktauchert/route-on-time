export const defaultWeekdays = ["mon", "tue", "wed", "thu", "fri"] as const;

export const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type Weekday = (typeof weekdays)[number];

const weekdayByShort: Record<string, Weekday> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

export type RouteDraft = {
  startId: string;
  destinationId: string;
  arrival: string;
  weekdays: Weekday[];
};

export function routeProblems(draft: RouteDraft) {
  const problems: Array<"same-stop" | "arrival" | "weekdays"> = [];

  if (draft.startId && draft.startId === draft.destinationId) {
    problems.push("same-stop");
  }

  if (!draft.arrival) {
    problems.push("arrival");
  }

  if (draft.weekdays.length === 0) {
    problems.push("weekdays");
  }

  return problems;
}

export function routeLabel(route: {
  name?: string | null;
  startName: string;
  destinationName: string;
}) {
  const name = route.name?.trim();
  return name ? name : `${route.startName} → ${route.destinationName}`;
}

export function storedRouteName(
  input: {
    name?: string | null;
    startId: string;
    destinationId: string;
    startName: string;
    destinationName: string;
  },
  existing: Array<{
    id: string;
    name: string | null;
    startId: string;
    destinationId: string;
  }>,
  currentId?: string,
) {
  const given = input.name?.trim();
  if (given) return given;

  const base = `${input.startName} → ${input.destinationName}`;
  const taken = new Set(
    existing
      .filter(
        (route) =>
          route.id !== currentId &&
          route.startId === input.startId &&
          route.destinationId === input.destinationId,
      )
      .map((route) => route.name?.trim())
      .filter((name): name is string => Boolean(name)),
  );

  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}

export function appliesOn(days: readonly Weekday[], date: Date) {
  const short = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
  const weekday = weekdayByShort[short];
  return Boolean(weekday && days.includes(weekday));
}

export type Place = { kind: "stop" | "line"; id: string; name: string };

export function findPlaces(
  results: Array<{ type?: string; id?: string; name?: string }>,
) {
  return results.flatMap((result): Place[] => {
    if ((result.type !== "stop" && result.type !== "line") || !result.id || !result.name) {
      return [];
    }

    return [{ kind: result.type, id: result.id, name: result.name }];
  });
}

export type StoredRoute = {
  id: string;
  name: string | null;
  startId: string;
  startName: string;
  destinationId: string;
  destinationName: string;
  arrival: string;
  weekdays: Weekday[];
  transferMinutes: number | null;
  maxTransfers: number | null;
  lineId: string | null;
  lineName: string | null;
  todayRefreshToken: string | null;
  todayServiceDate: string | null;
};

export function routesForToday(routes: StoredRoute[], date = new Date()) {
  return routes.filter((route) => appliesOn(route.weekdays, date));
}
