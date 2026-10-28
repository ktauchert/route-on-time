"use server";

import { redirect } from "next/navigation";
import { createVbbHafas } from "vbb-hafas";
import { checkRow, runCheck, type Auskunft, type CheckResult, type CheckStatus, type Suggestion } from "@/lib/check";
import { findPlaces, routeProblems, storedRouteName, type StoredRoute, type Weekday } from "@/lib/route";
import { createClient, currentUser } from "@/lib/supabase/server";

const userAgent =
  process.env.HAFAS_USER_AGENT ??
  "route-on-time (https://github.com/ktauchert/route-on-time)";

function hafas() {
  return createVbbHafas(userAgent);
}

function liveAuskunft(): Auskunft {
  const client = hafas();
  return {
    async journeys(from, to, arrival) {
      const result = await client.journeys(from, to, { arrival, results: 5, language: "de" });
      return {
        journeys: result.journeys ?? [],
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
      };
    },
    async refreshJourney(refreshToken) {
      const result = await client.refreshJourney(refreshToken, { language: "de" });
      return {
        journey: result.journey ?? null,
        realtimeDataUpdatedAt: result.realtimeDataUpdatedAt ?? null,
      };
    },
  };
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

  const draft = {
    startId: String(formData.get("startId") ?? ""),
    destinationId: String(formData.get("destinationId") ?? ""),
    arrival: String(formData.get("arrival") ?? ""),
    weekdays: weekdaysFrom(formData),
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
    arrival: draft.arrival,
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
      "id, name, start_id, start_name, destination_id, destination_name, arrival, weekdays, transfer_minutes, max_transfers, line_id, line_name, today_refresh_token, today_service_date",
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
      arrival: String(row.arrival).slice(0, 5),
      weekdays: row.weekdays,
      transferMinutes: row.transfer_minutes,
      maxTransfers: row.max_transfers,
      lineId: row.line_id,
      lineName: row.line_name,
      todayRefreshToken: row.today_refresh_token,
      todayServiceDate: row.today_service_date,
    })),
  };
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

  const result = await runCheck(routeToCheck(route), new Date(), liveAuskunft());
  const saved = await saveCheck(user.id, id, result);
  redirect(saved ? `/routes/${id}` : `/routes/${id}?error=check`);
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
    .select("service_date, status, reason, checked_at, connection, suggestions")
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
  };
}
