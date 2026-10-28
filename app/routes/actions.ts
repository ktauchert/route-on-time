"use server";

import { redirect } from "next/navigation";
import { createVbbHafas } from "vbb-hafas";
import { findPlaces, routeProblems, storedRouteName, type StoredRoute, type Weekday } from "@/lib/route";
import { createClient, currentUser } from "@/lib/supabase/server";

const userAgent =
  process.env.HAFAS_USER_AGENT ??
  "route-on-time (https://github.com/ktauchert/route-on-time)";

function hafas() {
  return createVbbHafas(userAgent);
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
      "id, name, start_id, start_name, destination_id, destination_name, arrival, weekdays, transfer_minutes, max_transfers, line_id, line_name",
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
    })),
  };
}
