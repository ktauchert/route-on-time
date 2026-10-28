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
  alternative: Suggestion | null;
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
  const pool = [check.connection, check.alternative, ...check.suggestions].filter(
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
  return language === "de" ? `Abfahrt in ${minutes} min` : `Departs in ${minutes} min`;
}

export function underwayLabel(language: Language) {
  return language === "de" ? "Unterwegs" : "Underway";
}
