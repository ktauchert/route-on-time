import { usesMode } from "./mode";
import { appliesOn, type Weekday } from "./route";

export type CheckStatus = "fits" | "doesnt-fit" | "unclear";

export type CheckReason =
  | "arrival"
  | "transfer"
  | "transfers"
  | "cancelled"
  | "empty"
  | "no-answer"
  | "stale";

export type RawLeg = {
  walking?: boolean;
  cancelled?: boolean;
  line?: { id?: string; name?: string; product?: string } | null;
  origin?: { id?: string; name?: string } | null;
  destination?: { id?: string; name?: string } | null;
  departure?: string | null;
  plannedDeparture?: string | null;
  departureDelay?: number | null;
  arrival?: string | null;
  plannedArrival?: string | null;
  arrivalDelay?: number | null;
  stopovers?: Array<{
    stop?: { id?: string; name?: string } | null;
    departure?: string | null;
    arrival?: string | null;
  }>;
};

export type RawJourney = {
  refreshToken?: string;
  legs?: RawLeg[];
};

export type LegView = {
  walking: boolean;
  lineId: string | null;
  lineName: string | null;
  product?: string | null;
  originId: string | null;
  originName: string;
  destinationId: string | null;
  destinationName: string;
  departure: string;
  arrival: string;
  departureDelaySeconds: number | null;
  arrivalDelaySeconds: number | null;
  cancelled: boolean;
  stopovers: Array<{ id: string | null; name: string; departure: string; arrival: string }>;
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
  alternative: Suggestion | null;
  noAlternative: boolean;
  searched: boolean;
  searchFromName: string | null;
  failedAt?: string | null;
};

export type TravelPosition =
  | { kind: "before" }
  | { kind: "done" }
  | { kind: "next-stop"; id: string; name: string }
  | { kind: "transfer"; id: string; name: string };

export type RouteToCheck = {
  startId: string;
  destinationId: string;
  arrival: string;
  weekdays: readonly Weekday[];
  transferMinutes: number | null;
  maxTransfers: number | null;
  preferredMode: string | null;
  relaxed: boolean;
  todayRefreshToken: string | null;
  todayServiceDate: string | null;
  leftAt?: string | null;
};

export type JourneyPage = {
  journeys: RawJourney[];
  realtimeDataUpdatedAt: number | null;
  earlierRef?: string | null;
};

export type Auskunft = {
  journeys: (
    from: string,
    to: string,
    at: Date,
    direction?: "arrival" | "departure",
  ) => Promise<JourneyPage>;
  earlier?: (from: string, to: string, earlierRef: string) => Promise<JourneyPage>;
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
    product: raw.line?.product ?? null,
    originId: raw.origin?.id ?? null,
    originName: raw.origin?.name ?? "",
    destinationId: raw.destination?.id ?? null,
    destinationName: raw.destination?.name ?? "",
    departure: raw.departure || raw.plannedDeparture || "",
    arrival: raw.arrival || raw.plannedArrival || "",
    departureDelaySeconds: raw.departureDelay ?? null,
    arrivalDelaySeconds: raw.arrivalDelay ?? null,
    cancelled: Boolean(raw.cancelled),
    stopovers: (raw.stopovers ?? [])
      .map((stop) => ({
        id: stop.stop?.id ?? null,
        name: stop.stop?.name ?? "",
        departure: stop.departure || "",
        arrival: stop.arrival || "",
      }))
      .filter((stop) => stop.id || stop.name),
  };
}

function pointsOf(leg: LegView) {
  const points: Array<{ id: string | null; name: string; at: number }> = [];
  if (leg.departure) {
    points.push({ id: leg.originId, name: leg.originName, at: new Date(leg.departure).getTime() });
  }
  for (const stop of leg.stopovers ?? []) {
    const at = stop.departure || stop.arrival;
    if (at) points.push({ id: stop.id, name: stop.name, at: new Date(at).getTime() });
  }
  if (leg.arrival) {
    points.push({ id: leg.destinationId, name: leg.destinationName, at: new Date(leg.arrival).getTime() });
  }
  return points;
}

export function travelPosition(connection: Suggestion, now: Date): TravelPosition {
  const legs = connection.legs;
  if (legs.length === 0) return { kind: "before" };

  const nowMs = now.getTime();
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  if (!firstLeg || !lastLeg) return { kind: "before" };
  const first = pointsOf(firstLeg)[0];
  const lastPoints = pointsOf(lastLeg);
  const last = lastPoints[lastPoints.length - 1];
  if (first && nowMs <= first.at) return { kind: "before" };
  if (last && nowMs >= last.at) return { kind: "done" };

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    if (!leg) continue;
    const points = pointsOf(leg);
    const start = points[0];
    const end = points[points.length - 1];
    if (start && end && nowMs > start.at && nowMs < end.at) {
      const next = points.find((point) => point.at > nowMs && point.id);
      if (next?.id) return { kind: "next-stop", id: next.id, name: next.name };
    }

    const following = legs[index + 1];
    if (!following || !end) continue;
    const nextStart = pointsOf(following)[0];
    if (nextStart && nowMs >= end.at && nowMs <= nextStart.at) {
      const id = following.originId || leg.destinationId;
      const name = following.originName || leg.destinationName;
      if (id) return { kind: "transfer", id, name };
    }
  }

  return { kind: "before" };
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

  if (route.arrival) {
    const arrival = suggestion.legs[suggestion.legs.length - 1]?.arrival;
    const deadline = berlinInstant(serviceDate, route.arrival).getTime();
    if (!arrival || new Date(arrival).getTime() > deadline) return "arrival";
  }

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

  return null;
}

function isStale(departure: string, realtimeUpdatedAt: number | null, now: Date) {
  if (realtimeUpdatedAt == null || !departure) return false;
  const updatedMs = realtimeUpdatedAt < 1e12 ? realtimeUpdatedAt * 1000 : realtimeUpdatedAt;
  const departureMs = new Date(departure).getTime();
  const withinNextHour = departureMs >= now.getTime() && departureMs - now.getTime() <= hourMs;
  return withinNextHour && now.getTime() - updatedMs > staleMs;
}

const relaxedSlackMs = 20 * 60 * 1000;

function endOf(suggestion: Suggestion) {
  const arrival = suggestion.legs[suggestion.legs.length - 1]?.arrival;
  return arrival ? new Date(arrival).getTime() : Infinity;
}

function transfersOf(suggestion: Suggestion) {
  return Math.max(0, rideLegs(suggestion).length - 1);
}

function pickFitting(fitting: Suggestion[], route: RouteToCheck): Suggestion | undefined {
  if (fitting.length === 0) return undefined;

  const preferred = route.preferredMode
    ? fitting.filter((suggestion) => usesMode(suggestion.legs, route.preferredMode as string))
    : [];
  const pool = preferred.length > 0 ? preferred : fitting;
  if (!route.relaxed) return pool[0];

  const earliest = Math.min(...pool.map(endOf));
  const near = pool.filter((suggestion) => endOf(suggestion) <= earliest + relaxedSlackMs);
  return near.reduce((best, next) => (transfersOf(next) < transfersOf(best) ? next : best));
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
      alternative: null,
      noAlternative: false,
      searched: true,
      searchFromName: null,
    };
  }

  const fitting = pickFitting(
    suggestions.filter((suggestion) => problemOf(suggestion, route, serviceDate) === null),
    route,
  );
  const connection = fitting ?? suggestions[0];
  const departure = connection.legs[0]?.departure ?? "";

  if (isStale(departure, realtimeUpdatedAt, now)) {
    return {
      serviceDate,
      checkedAt,
      status: "unclear",
      reason: "stale",
      connection,
      suggestions,
      alternative: null,
      noAlternative: false,
      searched: true,
      searchFromName: null,
    };
  }

  const reason = problemOf(connection, route, serviceDate);
  return {
    serviceDate,
    checkedAt,
    status: reason ? "doesnt-fit" : "fits",
    reason,
    connection,
    suggestions,
    alternative: null,
    noAlternative: false,
    searched: true,
    searchFromName: null,
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
    alternative: null,
    noAlternative: false,
    searched: true,
    searchFromName: null,
  };
}

async function withAlternative(
  route: RouteToCheck,
  now: Date,
  auskunft: Auskunft,
  result: CheckResult,
  fromId: string,
  earlierRef: string | null | undefined,
): Promise<CheckResult> {
  if (result.status !== "doesnt-fit" || result.suggestions.length === 0) {
    return { ...result, alternative: null, noAlternative: false };
  }

  if (!earlierRef || !auskunft.earlier) {
    return { ...result, alternative: null, noAlternative: true };
  }

  let page: JourneyPage;
  try {
    page = await auskunft.earlier(fromId, route.destinationId, earlierRef);
  } catch {
    return { ...result, alternative: null, noAlternative: true };
  }

  const seen = new Set(result.suggestions.map((item) => item.refreshToken).filter(Boolean));
  const alternative = page.journeys
    .map(toSuggestion)
    .filter((item): item is Suggestion => item !== null)
    .find((item) => {
      if (!item.refreshToken || seen.has(item.refreshToken)) return false;
      if (problemOf(item, route, result.serviceDate) !== null) return false;
      const departure = item.legs[0]?.departure ?? "";
      return !isStale(departure, page.realtimeDataUpdatedAt, now);
    });

  if (!alternative) return { ...result, alternative: null, noAlternative: true };

  return {
    ...result,
    status: "fits",
    reason: null,
    connection: alternative,
    alternative,
    noAlternative: false,
  };
}

function afterLeaveSearch(judged: CheckResult, chosen: string | null): CheckResult {
  if (judged.status === "doesnt-fit") return { ...judged, noAlternative: Boolean(chosen) };
  const next = judged.connection;
  if (chosen && judged.status === "fits" && next && next.refreshToken !== chosen) {
    return { ...judged, alternative: next };
  }
  return judged;
}

function keptStand(previous: CheckResult): CheckResult {
  return { ...previous, searched: false };
}

function isFailure(result: CheckResult) {
  return result.status === "unclear" && (result.reason === "no-answer" || result.reason === "stale");
}

function leftAfter(route: RouteToCheck, previous: CheckResult | null) {
  if (route.arrival || !route.leftAt || !previous) return false;
  return new Date(route.leftAt).getTime() > new Date(previous.checkedAt).getTime();
}

export async function runCheck(
  route: RouteToCheck,
  now: Date,
  auskunft: Auskunft,
  carried: CheckResult | null = null,
): Promise<CheckResult> {
  // A new tap on the leave button starts over: the old connection says nothing about where the person is now.
  const previous = leftAfter(route, carried) ? null : carried;
  const result = await judgeRoute(route, now, auskunft, previous);
  if (!isFailure(result)) return { ...result, failedAt: null };

  const kept = previous?.serviceDate === result.serviceDate && !isFailure(previous) ? previous : null;
  if (!kept) return result;
  return { ...kept, searched: true, failedAt: now.toISOString() };
}

async function judgeRoute(
  route: RouteToCheck,
  now: Date,
  auskunft: Auskunft,
  previous: CheckResult | null,
): Promise<CheckResult> {
  const leave = !route.arrival;
  const serviceDate = leave ? berlinDateString(now) : searchDay(route.weekdays, route.arrival, now);
  const checkedAt = now.toISOString();
  if (leave && !(route.leftAt && berlinDateString(new Date(route.leftAt)) === serviceDate)) {
    return { ...unanswered(serviceDate, checkedAt), reason: null, searched: false };
  }
  const chosen =
    route.todayRefreshToken && route.todayServiceDate === serviceDate ? route.todayRefreshToken : null;
  const sameDay = previous?.serviceDate === serviceDate ? previous : null;

  try {
    let located: Suggestion | null = sameDay?.connection ?? null;
    let refreshed: RawJourney | null = null;
    let realtime: number | null = null;

    if (chosen) {
      const read = await auskunft.refreshJourney(chosen);
      if (!read.journey) return unanswered(serviceDate, checkedAt);
      refreshed = read.journey;
      realtime = read.realtimeDataUpdatedAt;
      located = toSuggestion(read.journey);
    }

    const position = located ? travelPosition(located, now) : { kind: "before" as const };
    if (position.kind === "done" && sameDay) return keptStand(sameDay);
    if (chosen && refreshed && position.kind === "before") {
      const judgedChosen = judge([refreshed], realtime, route, serviceDate, now, checkedAt);
      if (!leave || judgedChosen.status !== "doesnt-fit") return judgedChosen;
    }

    const moved = position.kind === "next-stop" || position.kind === "transfer";
    const fromId = moved ? position.id : route.startId;
    const fromName = moved ? position.name : null;
    const found = leave
      ? await auskunft.journeys(fromId, route.destinationId, now, "departure")
      : await auskunft.journeys(fromId, route.destinationId, berlinInstant(serviceDate, route.arrival));
    const judged = judge(found.journeys, found.realtimeDataUpdatedAt, route, serviceDate, now, checkedAt);
    const checked = leave
      ? afterLeaveSearch(judged, chosen)
      : await withAlternative(route, now, auskunft, judged, fromId, found.earlierRef);
    const connection = moved && located ? located : checked.connection;
    return { ...checked, connection, searched: true, searchFromName: fromName };
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
    alternative: result.alternative,
    no_alternative: result.noAlternative,
    search_from_name: result.searchFromName,
    failed_at: result.failedAt ?? null,
  };
}

export function todayFromCheck(result: CheckResult) {
  const refreshToken = result.alternative?.refreshToken;
  if (!refreshToken) return null;
  return { refreshToken, serviceDate: result.serviceDate };
}
