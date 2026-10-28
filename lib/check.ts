import { appliesOn, type Weekday } from "./route";

export type CheckStatus = "fits" | "doesnt-fit" | "unclear";

export type CheckReason =
  | "arrival"
  | "transfer"
  | "transfers"
  | "line"
  | "cancelled"
  | "empty"
  | "no-answer"
  | "stale";

export type RawLeg = {
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

export type RawJourney = {
  refreshToken?: string;
  legs?: RawLeg[];
};

export type LegView = {
  walking: boolean;
  lineId: string | null;
  lineName: string | null;
  originName: string;
  destinationName: string;
  departure: string;
  arrival: string;
  departureDelaySeconds: number | null;
  arrivalDelaySeconds: number | null;
  cancelled: boolean;
};

export type Suggestion = {
  refreshToken: string;
  legs: LegView[];
};

export type CheckResult = {
  serviceDate: string;
  status: CheckStatus;
  reason: CheckReason | null;
  checkedAt: string;
  connection: Suggestion | null;
  suggestions: Suggestion[];
};

export type RouteToCheck = {
  startId: string;
  destinationId: string;
  arrival: string;
  weekdays: readonly Weekday[];
  transferMinutes: number | null;
  maxTransfers: number | null;
  lineId: string | null;
  lineName: string | null;
  todayRefreshToken: string | null;
  todayServiceDate: string | null;
};

export type Auskunft = {
  journeys: (
    from: string,
    to: string,
    arrival: Date,
  ) => Promise<{ journeys: RawJourney[]; realtimeDataUpdatedAt: number | null }>;
  refreshJourney: (
    refreshToken: string,
  ) => Promise<{ journey: RawJourney | null; realtimeDataUpdatedAt: number | null }>;
};

const hourMs = 60 * 60 * 1000;
const staleMs = 15 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function berlinParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  const hour = Number(read("hour"));

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: hour === 24 ? 0 : hour,
    minute: Number(read("minute")),
  };
}

export function berlinDateString(date: Date) {
  const parts = berlinParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function berlinInstant(day: string, time: string) {
  const [year, month, date] = day.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, date, hour, minute));
  const shown = berlinParts(guess);
  const shownUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
  const wantedUtc = Date.UTC(year, month - 1, date, hour, minute);
  return new Date(guess.getTime() - (shownUtc - wantedUtc));
}

function addBerlinDays(day: string, count: number) {
  const noon = berlinInstant(day, "12:00");
  return berlinDateString(new Date(noon.getTime() + count * 24 * 60 * 60 * 1000));
}

export function searchDay(days: readonly Weekday[], arrival: string, now: Date) {
  const today = berlinDateString(now);
  const parts = berlinParts(now);
  const [hour, minute] = arrival.split(":").map(Number);
  const stillAhead = hour * 60 + minute > parts.hour * 60 + parts.minute;

  if (stillAhead && appliesOn(days, now)) return today;

  for (let step = 1; step <= 7; step += 1) {
    const next = addBerlinDays(today, step);
    if (appliesOn(days, berlinInstant(next, "12:00"))) return next;
  }

  return today;
}

function mapLeg(raw: RawLeg): LegView {
  return {
    walking: Boolean(raw.walking),
    lineId: raw.line?.id ?? null,
    lineName: raw.line?.name ?? null,
    originName: raw.origin?.name ?? "",
    destinationName: raw.destination?.name ?? "",
    departure: raw.departure || raw.plannedDeparture || "",
    arrival: raw.arrival || raw.plannedArrival || "",
    departureDelaySeconds: raw.departureDelay ?? null,
    arrivalDelaySeconds: raw.arrivalDelay ?? null,
    cancelled: Boolean(raw.cancelled),
  };
}

function toSuggestion(raw: RawJourney): Suggestion | null {
  const legs = (raw.legs ?? []).map(mapLeg);
  if (legs.length === 0) return null;
  return { refreshToken: raw.refreshToken ?? "", legs };
}

function rideLegs(suggestion: Suggestion) {
  return suggestion.legs.filter((leg) => !leg.walking);
}

function problemOf(suggestion: Suggestion, route: RouteToCheck, serviceDate: string): CheckReason | null {
  if (suggestion.legs.some((leg) => leg.cancelled)) return "cancelled";

  const arrival = suggestion.legs[suggestion.legs.length - 1]?.arrival;
  const deadline = berlinInstant(serviceDate, route.arrival).getTime();
  if (!arrival || new Date(arrival).getTime() > deadline) return "arrival";

  const rides = rideLegs(suggestion);
  if (route.transferMinutes != null) {
    for (let index = 1; index < rides.length; index += 1) {
      const previous = rides[index - 1];
      const current = rides[index];
      if (!previous?.arrival || !current?.departure) return "transfer";
      const gap = new Date(current.departure).getTime() - new Date(previous.arrival).getTime();
      if (gap < route.transferMinutes * 60 * 1000) return "transfer";
    }
  }

  if (route.maxTransfers != null && Math.max(0, rides.length - 1) > route.maxTransfers) {
    return "transfers";
  }

  const lineId = route.lineId?.trim() || null;
  const lineName = route.lineName?.trim() || null;
  if (lineId || lineName) {
    const matches = rides.some(
      (leg) => (lineId && leg.lineId === lineId) || (lineName && leg.lineName === lineName),
    );
    if (!matches) return "line";
  }

  return null;
}

function isStale(departure: string, realtimeUpdatedAt: number | null, now: Date) {
  if (realtimeUpdatedAt == null || !departure) return false;
  const updatedMs = realtimeUpdatedAt < 1e12 ? realtimeUpdatedAt * 1000 : realtimeUpdatedAt;
  const departureMs = new Date(departure).getTime();
  const withinNextHour = departureMs >= now.getTime() && departureMs - now.getTime() <= hourMs;
  return withinNextHour && now.getTime() - updatedMs > staleMs;
}

function judge(
  raws: RawJourney[],
  realtimeUpdatedAt: number | null,
  route: RouteToCheck,
  serviceDate: string,
  now: Date,
  checkedAt: string,
): CheckResult {
  const suggestions = raws
    .map(toSuggestion)
    .filter((suggestion): suggestion is Suggestion => suggestion !== null)
    .slice(0, 5);

  if (suggestions.length === 0) {
    return {
      serviceDate,
      checkedAt,
      status: "doesnt-fit",
      reason: "empty",
      connection: null,
      suggestions: [],
    };
  }

  const fitting = suggestions.find((suggestion) => problemOf(suggestion, route, serviceDate) === null);
  const connection = fitting ?? suggestions[0];
  const departure = connection.legs[0]?.departure ?? "";

  if (isStale(departure, realtimeUpdatedAt, now)) {
    return { serviceDate, checkedAt, status: "unclear", reason: "stale", connection, suggestions };
  }

  const reason = problemOf(connection, route, serviceDate);
  return {
    serviceDate,
    checkedAt,
    status: reason ? "doesnt-fit" : "fits",
    reason,
    connection,
    suggestions,
  };
}

function unanswered(serviceDate: string, checkedAt: string): CheckResult {
  return {
    serviceDate,
    checkedAt,
    status: "unclear",
    reason: "no-answer",
    connection: null,
    suggestions: [],
  };
}

export async function runCheck(route: RouteToCheck, now: Date, auskunft: Auskunft): Promise<CheckResult> {
  const serviceDate = searchDay(route.weekdays, route.arrival, now);
  const checkedAt = now.toISOString();
  const chosen =
    route.todayRefreshToken && route.todayServiceDate === serviceDate ? route.todayRefreshToken : null;

  try {
    if (chosen) {
      const refreshed = await auskunft.refreshJourney(chosen);
      if (!refreshed.journey) return unanswered(serviceDate, checkedAt);
      return judge([refreshed.journey], refreshed.realtimeDataUpdatedAt, route, serviceDate, now, checkedAt);
    }

    const found = await auskunft.journeys(
      route.startId,
      route.destinationId,
      berlinInstant(serviceDate, route.arrival),
    );
    return judge(found.journeys, found.realtimeDataUpdatedAt, route, serviceDate, now, checkedAt);
  } catch {
    return unanswered(serviceDate, checkedAt);
  }
}

export function checkRow(userId: string, routeId: string, result: CheckResult) {
  return {
    user_id: userId,
    route_id: routeId,
    service_date: result.serviceDate,
    status: result.status,
    reason: result.reason,
    checked_at: result.checkedAt,
    connection: result.connection,
    suggestions: result.suggestions,
  };
}
