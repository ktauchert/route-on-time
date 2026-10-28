"use server";

import { redirect } from "next/navigation";
import { createVbbHafas } from "vbb-hafas";
import { findPlaces, routeProblems, type StoredRoute, type Weekday } from "@/lib/route";
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
  if (!user) redirect("/anmelden");

  const draft = {
    startId: String(formData.get("startId") ?? ""),
    zielId: String(formData.get("zielId") ?? ""),
    arrival: String(formData.get("arrival") ?? ""),
    weekdays: weekdaysFrom(formData),
  };

  if (routeProblems(draft).length > 0 || !draft.startId || !draft.zielId) {
    redirect("/?neu=1&fehler=1");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/?neu=1&fehler=tabelle");

  const transfer = String(formData.get("transferMinutes") ?? "");
  const transfers = String(formData.get("maxTransfers") ?? "");
  const row = {
    user_id: user.id,
    name: String(formData.get("name") ?? "").trim() || null,
    start_id: draft.startId,
    start_name: String(formData.get("startName") ?? ""),
    ziel_id: draft.zielId,
    ziel_name: String(formData.get("zielName") ?? ""),
    arrival: draft.arrival,
    weekdays: draft.weekdays,
    transfer_minutes: transfer ? Number(transfer) : null,
    max_transfers: transfers ? Number(transfers) : null,
    line_id: String(formData.get("lineId") ?? "") || null,
    line_name: String(formData.get("lineName") ?? "") || null,
  };

  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("routes").update(row).eq("id", id)
    : await supabase.from("routes").insert(row);

  if (result.error) redirect("/?neu=1&fehler=tabelle");
  redirect(id ? `/?route=${id}` : "/");
}

export async function deleteRoute(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/anmelden");

  const supabase = await createClient();
  if (!supabase) redirect("/");

  await supabase.from("routes").delete().eq("id", String(formData.get("id") ?? ""));
  redirect("/");
}

export async function listRoutes(): Promise<{ routes: StoredRoute[]; missingTable: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { routes: [], missingTable: true };

  const { data, error } = await supabase
    .from("routes")
    .select(
      "id, name, start_id, start_name, ziel_id, ziel_name, arrival, weekdays, transfer_minutes, max_transfers, line_id, line_name",
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
      zielId: row.ziel_id,
      zielName: row.ziel_name,
      arrival: String(row.arrival).slice(0, 5),
      weekdays: row.weekdays,
      transferMinutes: row.transfer_minutes,
      maxTransfers: row.max_transfers,
      lineId: row.line_id,
      lineName: row.line_name,
    })),
  };
}
