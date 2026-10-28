import { timingSafeEqual } from "node:crypto";
import {
  berlinDateString,
  berlinInstant,
  runCheck,
  travelPosition,
  type Auskunft,
  type CheckResult,
  type RouteToCheck,
} from "./check";
import { appliesOn } from "./route";

export const defaultIntervalMinutes = 5;
export const minimumIntervalMinutes = 1;
export const maximumIntervalMinutes = 180;

const threeHoursMs = 3 * 60 * 60 * 1000;
const halfHourMs = 30 * 60 * 1000;

export type ClockRoute = {
  id: string;
  userId: string;
  intervalMinutes: number;
  previous: CheckResult | null;
  route: RouteToCheck;
};

export function normalizeInterval(value: unknown) {
  const minutes = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(minutes)) return null;
  if (minutes < minimumIntervalMinutes || minutes > maximumIntervalMinutes) return null;
  return minutes;
}

export function secretsMatch(given: string | null, expected: string | null) {
  if (!given || !expected) return false;
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sameDay(previous: CheckResult | null, now: Date) {
  return previous?.serviceDate === berlinDateString(now) ? previous : null;
}

export function isDue(route: ClockRoute, now: Date) {
  if (!appliesOn(route.route.weekdays, now)) return false;

  const today = sameDay(route.previous, now);
  if (today) {
    const elapsed = now.getTime() - new Date(today.checkedAt).getTime();
    if (elapsed < route.intervalMinutes * 60 * 1000) return false;
  }

  const connection = today?.connection ?? null;
  const position = connection ? travelPosition(connection, now) : null;
  if (position?.kind === "done") return false;

  const arrival = route.route.arrival.trim();
  if (arrival) {
    const deadline = berlinInstant(berlinDateString(now), arrival);
    if (now.getTime() < deadline.getTime() - threeHoursMs) return false;
    const moving = position?.kind === "next-stop" || position?.kind === "transfer";
    if (now.getTime() > deadline.getTime() && !moving) return false;
    return true;
  }

  const departure = connection?.legs[0]?.departure;
  const end = connection?.legs[connection.legs.length - 1]?.arrival;
  if (!connection || !departure || !end) return false;
  return now.getTime() >= new Date(departure).getTime() - halfHourMs && now.getTime() <= new Date(end).getTime();
}

export async function planTick(input: {
  secret: string | null;
  expectedSecret: string | null;
  routes: ClockRoute[];
  now: Date;
  auskunft: Auskunft;
}) {
  if (!secretsMatch(input.secret, input.expectedSecret)) {
    return { refused: true, checks: [] as Array<{ id: string; userId: string; result: CheckResult }> };
  }

  const checks: Array<{ id: string; userId: string; result: CheckResult }> = [];
  for (const route of input.routes) {
    if (!isDue(route, input.now)) continue;
    const result = await runCheck(route.route, input.now, input.auskunft, route.previous);
    if (!result.searched) continue;
    checks.push({ id: route.id, userId: route.userId, result });
  }

  return { refused: false, checks };
}
