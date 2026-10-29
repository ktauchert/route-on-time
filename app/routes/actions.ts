"use server";

import { redirect } from "next/navigation";
import {
  checkRow,
  runCheck,
  todayFromCheck,
  type CheckResult,
  type CheckStatus,
  type Suggestion,
} from "@/lib/check";
import { hafasClient, liveAuskunft } from "@/lib/auskunft";
import { defaultIntervalMinutes, isDue } from "@/lib/clock";
import { glanceFor, type RouteGlance } from "@/lib/moment";
import { findPlaces, routeProblems, storedRouteName, type StoredRoute, type Weekday } from "@/lib/route";
import { createClient, currentUser } from "@/lib/supabase/server";

function hafas() {
  return hafasClient();
}

export async function searchStops(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results = await hafas().locations(trimmed, {
    results: 8,
    stops: true,
    addresses: false,
    poi: false,
  });

  return findPlaces(results).filter((place) => place.kind === "stop");
}

export async function searchLines(stopId: string) {
  if (!stopId) return [];

  const stop = await hafas().stop(stopId, { linesOfStops: true });
  const lines = Array.isArray(stop.lines) ? stop.lines : [];

  return findPlaces(
    lines.map((line: { id?: string; name?: string }) => ({
      type: "line",
      id: line.id,
      name: line.name,
    })),
  );
}

function weekdaysFrom(formData: FormData) {
  return formData.getAll("weekdays").map(String) as Weekday[];
}

export async function saveRoute(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const leave = String(formData.get("timing") ?? "") === "leave";
  const draft = {
    startId: String(formData.get("startId") ?? ""),
    destinationId: String(formData.get("destinationId") ?? ""),
    arrival: leave ? "" : String(formData.get("arrival") ?? ""),
    weekdays: weekdaysFrom(formData),
    leave,
  };
  const id = String(formData.get("id") ?? "");
  const back = id ? `/routes/${id}?error=1` : "/routes/new?error=1";

  if (routeProblems(draft).length > 0 || !draft.startId || !draft.destinationId) {
    redirect(back);
  }

  const supabase = await createClient();
  if (!supabase) redirect(back);

  const transfer = String(formData.get("transferMinutes") ?? "");
  const transfers = String(formData.get("maxTransfers") ?? "");
  const { data: existing } = await supabase.from("routes").select("id, name, start_id, destination_id");
  const name = storedRouteName(
    {
      name: String(formData.get("name") ?? ""),
      startId: draft.startId,
      destinationId: draft.destinationId,
      startName: String(formData.get("startName") ?? ""),
      destinationName: String(formData.get("destinationName") ?? ""),
    },
    (existing ?? []).map((route) => ({
      id: route.id,
      name: route.name,
      startId: route.start_id,
      destinationId: route.destination_id,
    })),
    id || undefined,
  );
  const row = {
    user_id: user.id,
    name,
    start_id: draft.startId,
    start_name: String(formData.get("startName") ?? ""),
    destination_id: draft.destinationId,
    destination_name: String(formData.get("destinationName") ?? ""),
    arrival: leave ? null : draft.arrival,
    weekdays: draft.weekdays,
    transfer_minutes: transfer ? Number(transfer) : null,
    max_transfers: transfers ? Number(transfers) : null,
    line_id: String(formData.get("lineId") ?? "") || null,
    line_name: String(formData.get("lineName") ?? "") || null,
  };

  const result = id
    ? await supabase.from("routes").update(row).eq("id", id).select("id").single()
    : await supabase.from("routes").insert(row).select("id").single();

  if (result.error || !result.data) redirect(back);
  redirect(`/routes/${result.data.id}`);
}

export async function deleteRoute(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  if (!supabase) redirect("/routes");

  await supabase.from("routes").delete().eq("id", String(formData.get("id") ?? ""));
  redirect("/routes");
}

export async function listRoutes(): Promise<{ routes: StoredRoute[]; missingTable: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { routes: [], missingTable: true };

  const { data, error } = await supabase
    .from("routes")
    .select(
      "id, name, start_id, start_name, destination_id, destination_name, arrival, weekdays, transfer_minutes, max_transfers, line_id, line_name, today_refresh_token, today_service_date, left_at",
    )
    .order("created_at", { ascending: false });

  if (error) return { routes: [], missingTable: true };

  return {
    missingTable: false,
    routes: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      startId: row.start_id,
      startName: row.start_name,
      destinationId: row.destination_id,
      destinationName: row.destination_name,
      arrival: row.arrival ? String(row.arrival).slice(0, 5) : "",
      weekdays: row.weekdays,
      transferMinutes: row.transfer_minutes,
      maxTransfers: row.max_transfers,
      lineId: row.line_id,
      lineName: row.line_name,
      todayRefreshToken: row.today_refresh_token,
      todayServiceDate: row.today_service_date,
      leftAt: row.left_at,
    })),
  };
}

export async function listGlances(routes: StoredRoute[], now = new Date()): Promise<Record<string, RouteGlance>> {
  const supabase = await createClient();
  if (!supabase || routes.length === 0) return {};

  const { data, error } = await supabase
    .from("route_checks")
    .select("route_id, service_date, status, connection, suggestions, alternative")
    .order("checked_at", { ascending: false });

  if (error || !data) return {};

  const latest = new Map<string, (typeof data)[number]>();
  for (const row of data) {
    if (!latest.has(row.route_id)) latest.set(row.route_id, row);
  }

  const glances: Record<string, RouteGlance> = {};
  for (const route of routes) {
    const row = latest.get(route.id);
    if (!row || !statuses.includes(row.status)) continue;
    const glance = glanceFor(
      route,
      {
        serviceDate: row.service_date,
        status: row.status,
        connection: (row.connection ?? null) as Suggestion | null,
        suggestions: (row.suggestions ?? []) as Suggestion[],
        alternative: (row.alternative ?? null) as Suggestion | null,
      },
      now,
    );
    if (glance) glances[route.id] = glance;
  }

  return glances;
}

function routeToCheck(route: StoredRoute) {
  return {
    startId: route.startId,
    destinationId: route.destinationId,
    arrival: route.arrival,
    weekdays: route.weekdays,
    transferMinutes: route.transferMinutes,
    maxTransfers: route.maxTransfers,
    lineId: route.lineId,
    lineName: route.lineName,
    todayRefreshToken: route.todayRefreshToken,
    todayServiceDate: route.todayServiceDate,
    leftAt: route.leftAt,
  };
}

async function saveCheck(userId: string, routeId: string, result: CheckResult) {
  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("route_checks")
    .upsert(checkRow(userId, routeId, result), { onConflict: "route_id,service_date" });

  return !error;
}

export async function checkRoute(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  const { routes } = await listRoutes();
  const route = routes.find((item) => item.id === id);
  if (!route) redirect("/routes");

  const previous = await latestCheck(id);
  const result = await runCheck(routeToCheck(route), new Date(), liveAuskunft(), previous);
  if (!result.searched) redirect(`/routes/${id}`);

  const saved = await saveCheck(user.id, id, result);
  const today = todayFromCheck(result);
  const remembered = today ? await rememberToday(id, today.refreshToken, today.serviceDate) : true;
  redirect(saved && remembered ? `/routes/${id}` : `/routes/${id}?error=check`);
}

export async function leaveRoute(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  const { routes } = await listRoutes();
  const route = routes.find((item) => item.id === id);
  if (!route) redirect("/routes");

  const supabase = await createClient();
  if (!supabase) redirect(`/routes/${id}`);

  const now = new Date();
  const leftAt = now.toISOString();
  const left = await supabase
    .from("routes")
    .update({ left_at: leftAt, today_refresh_token: null, today_service_date: null })
    .eq("id", id);
  if (left.error) redirect(`/routes/${id}?error=check`);

  const previous = await latestCheck(id);
  const result = await runCheck(
    { ...routeToCheck(route), leftAt, todayRefreshToken: null, todayServiceDate: null },
    now,
    liveAuskunft(),
    previous,
  );
  if (!result.searched) redirect(`/routes/${id}`);

  const saved = await saveCheck(user.id, id, result);
  const first = result.status === "fits" ? result.connection?.refreshToken : null;
  const remembered = first ? await rememberToday(id, first, result.serviceDate) : true;
  redirect(saved && remembered ? `/routes/${id}` : `/routes/${id}?error=check`);
}

async function rememberToday(id: string, refreshToken: string, serviceDate: string) {
  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("routes")
    .update({ today_refresh_token: refreshToken, today_service_date: serviceDate })
    .eq("id", id);

  return !error;
}

export async function chooseConnection(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  const refreshToken = String(formData.get("refreshToken") ?? "");
  const serviceDate = String(formData.get("serviceDate") ?? "");
  const supabase = await createClient();
  if (!supabase || !refreshToken || !serviceDate) redirect(`/routes/${id}`);

  await supabase
    .from("routes")
    .update({ today_refresh_token: refreshToken, today_service_date: serviceDate })
    .eq("id", id);
  redirect(`/routes/${id}`);
}

export async function clearConnection(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  if (!supabase) redirect(`/routes/${id}`);

  await supabase
    .from("routes")
    .update({ today_refresh_token: null, today_service_date: null })
    .eq("id", id);
  redirect(`/routes/${id}`);
}

const statuses: CheckStatus[] = ["fits", "doesnt-fit", "unclear"];

export async function latestCheck(routeId: string): Promise<CheckResult | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("route_checks")
    .select(
      "service_date, status, reason, checked_at, connection, suggestions, alternative, no_alternative, search_from_name, failed_at",
    )
    .eq("route_id", routeId)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !statuses.includes(data.status)) return null;

  return {
    serviceDate: data.service_date,
    status: data.status,
    reason: data.reason,
    checkedAt: data.checked_at,
    connection: (data.connection ?? null) as Suggestion | null,
    suggestions: (data.suggestions ?? []) as Suggestion[],
    alternative: (data.alternative ?? null) as Suggestion | null,
    noAlternative: Boolean(data.no_alternative),
    searched: true,
    searchFromName: data.search_from_name,
    failedAt: data.failed_at,
  };
}

export async function userInterval(): Promise<number> {
  const user = await currentUser();
  const supabase = await createClient();
  if (!user || !supabase) return defaultIntervalMinutes;

  const { data } = await supabase
    .from("user_settings")
    .select("check_interval_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.check_interval_minutes ?? defaultIntervalMinutes;
}

export async function checkIfDue(routeIds: string[]): Promise<number> {
  const user = await currentUser();
  if (!user) return 0;

  const intervalMinutes = await userInterval();
  const { routes } = await listRoutes();
  const now = new Date();
  let written = 0;

  for (const route of routes.filter((item) => routeIds.includes(item.id))) {
    const previous = await latestCheck(route.id);
    const due = isDue({ id: route.id, userId: user.id, intervalMinutes, previous, route: routeToCheck(route) }, now);
    if (!due) continue;

    const result = await runCheck(routeToCheck(route), now, liveAuskunft(), previous);
    if (!result.searched) continue;
    if (!(await saveCheck(user.id, route.id, result))) continue;

    const today = todayFromCheck(result);
    if (today) await rememberToday(route.id, today.refreshToken, today.serviceDate);
    written += 1;
  }

  return written;
}
