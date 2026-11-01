import { durationLabel } from "./check-copy";
import type { CheckStatus, Suggestion } from "./check";
import type { Language } from "./preferences";

export type TripMoment = {
  upcomingMinutes: number | null;
  progress: number | null;
};

export type RouteGlance = {
  status: CheckStatus;
  upcomingMinutes: number | null;
  progress: number | null;
};

type GlanceCheck = {
  serviceDate: string;
  status: CheckStatus;
  connection: Suggestion | null;
  suggestions: Suggestion[];
  alternatives: Suggestion[];
};

export function tripMoment(
  legs: Array<{ departure: string; arrival: string }>,
  now: Date,
): TripMoment {
  const start = legs[0]?.departure;
  const end = legs[legs.length - 1]?.arrival;
  if (!start || !end) return { upcomingMinutes: null, progress: null };

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    return { upcomingMinutes: Math.max(1, Math.ceil((startMs - nowMs) / 60000)), progress: null };
  }

  if (nowMs < endMs && endMs > startMs) {
    return { upcomingMinutes: null, progress: Math.min(1, (nowMs - startMs) / (endMs - startMs)) };
  }

  return { upcomingMinutes: null, progress: null };
}

export function countedTrip(
  route: { todayRefreshToken: string | null; todayServiceDate: string | null },
  check: GlanceCheck,
): Suggestion | null {
  const pool = [check.connection, ...check.alternatives, ...check.suggestions].filter(
    (item): item is Suggestion => Boolean(item && item.legs.length > 0),
  );
  if (route.todayRefreshToken && route.todayServiceDate === check.serviceDate) {
    return pool.find((item) => item.refreshToken === route.todayRefreshToken) ?? check.connection;
  }
  return check.connection && check.connection.legs.length > 0 ? check.connection : (pool[0] ?? null);
}

export function glanceFor(
  route: { todayRefreshToken: string | null; todayServiceDate: string | null },
  check: GlanceCheck | null,
  now: Date,
): RouteGlance | null {
  if (!check) return null;
  const trip = countedTrip(route, check);
  const moment = tripMoment(trip?.legs ?? [], now);
  return { status: check.status, ...moment };
}

export function upcomingLabel(language: Language, minutes: number) {
  const time = durationLabel(minutes);
  return language === "de" ? `Abfahrt in ${time}` : `Departs in ${time}`;
}

export function underwayLabel(language: Language) {
  return language === "de" ? "Unterwegs" : "Underway";
}

export function nextRouteId(glances: Record<string, RouteGlance>) {
  let next: string | null = null;
  let soonest = Infinity;
  for (const [id, glance] of Object.entries(glances)) {
    if (glance.upcomingMinutes != null && glance.upcomingMinutes < soonest) {
      soonest = glance.upcomingMinutes;
      next = id;
    }
  }
  return next;
}

export const onRouteLeadMinutes = 20;

// A route is active while its trip runs, or when it leaves within the lead time.
// A trip underway wins; among upcoming ones the nearest departure wins.
export function activeRoute<R>(
  entries: Array<{ route: R; trip: Suggestion | null }>,
  now: Date,
  leadMinutes = onRouteLeadMinutes,
): { route: R; trip: Suggestion; upcomingMinutes: number | null; progress: number | null } | null {
  let underway: { route: R; trip: Suggestion; upcomingMinutes: null; progress: number } | null = null;
  let upcoming: { route: R; trip: Suggestion; upcomingMinutes: number; progress: null } | null = null;

  for (const { route, trip } of entries) {
    if (!trip || trip.legs.length === 0) continue;
    const moment = tripMoment(trip.legs, now);
    if (moment.progress != null) {
      underway ??= { route, trip, upcomingMinutes: null, progress: moment.progress };
    } else if (moment.upcomingMinutes != null && moment.upcomingMinutes <= leadMinutes) {
      if (!upcoming || moment.upcomingMinutes < upcoming.upcomingMinutes) {
        upcoming = { route, trip, upcomingMinutes: moment.upcomingMinutes, progress: null };
      }
    }
  }

  return underway ?? upcoming;
}
