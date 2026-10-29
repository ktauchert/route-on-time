import { checkRow, todayFromCheck, type CheckResult, type CheckStatus, type Suggestion } from "@/lib/check";
import { defaultIntervalMinutes, planTick, secretsMatch, type ClockRoute } from "@/lib/clock";
import { liveAuskunft } from "@/lib/auskunft";
import type { Weekday } from "@/lib/route";
import { createAdminClient } from "@/lib/supabase/admin";

const statuses: CheckStatus[] = ["fits", "doesnt-fit", "unclear"];

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

function checkFromRow(row: {
  service_date: string;
  status: string;
  reason: string | null;
  checked_at: string;
  connection: unknown;
  suggestions: unknown;
  alternative: unknown;
  no_alternative: boolean | null;
  search_from_name: string | null;
  failed_at: string | null;
}): CheckResult | null {
  if (!statuses.includes(row.status as CheckStatus)) return null;
  return {
    serviceDate: row.service_date,
    status: row.status as CheckStatus,
    reason: row.reason as CheckResult["reason"],
    checkedAt: row.checked_at,
    connection: (row.connection ?? null) as Suggestion | null,
    suggestions: (row.suggestions ?? []) as Suggestion[],
    alternative: (row.alternative ?? null) as Suggestion | null,
    noAlternative: Boolean(row.no_alternative),
    searched: true,
    searchFromName: row.search_from_name,
    failedAt: row.failed_at,
  };
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET ?? null;
  if (!secretsMatch(bearer(request), expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unavailable" }, { status: 500 });

  const routes = await admin
    .from("routes")
    .select(
      "id, user_id, start_id, destination_id, arrival, weekdays, transfer_minutes, max_transfers, preferred_mode, relaxed, avoid_lines, today_refresh_token, today_service_date, left_at",
    );
  if (routes.error || !routes.data) return Response.json({ error: "unavailable" }, { status: 500 });

  const settings = await admin.from("user_settings").select("user_id, check_interval_minutes");
  const intervals = new Map<string, number>();
  if (!settings.error) {
    for (const row of settings.data ?? []) {
      intervals.set(row.user_id, row.check_interval_minutes);
    }
  }

  const checks = await admin
    .from("route_checks")
    .select(
      "route_id, service_date, status, reason, checked_at, connection, suggestions, alternative, no_alternative, search_from_name, failed_at",
    )
    .order("checked_at", { ascending: false });
  if (checks.error) return Response.json({ error: "unavailable" }, { status: 500 });

  const latest = new Map<string, CheckResult>();
  for (const row of checks.data ?? []) {
    if (latest.has(row.route_id)) continue;
    const check = checkFromRow(row);
    if (check) latest.set(row.route_id, check);
  }

  const subjects: ClockRoute[] = routes.data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    intervalMinutes: intervals.get(row.user_id) ?? defaultIntervalMinutes,
    previous: latest.get(row.id) ?? null,
    route: {
      startId: row.start_id,
      destinationId: row.destination_id,
      arrival: row.arrival ? String(row.arrival).slice(0, 5) : "",
      weekdays: row.weekdays as Weekday[],
      transferMinutes: row.transfer_minutes,
      maxTransfers: row.max_transfers,
      preferredMode: row.preferred_mode,
      relaxed: Boolean(row.relaxed),
      avoidLines: row.avoid_lines ?? [],
      todayRefreshToken: row.today_refresh_token,
      todayServiceDate: row.today_service_date,
      leftAt: row.left_at,
    },
  }));

  const outcome = await planTick({
    secret: bearer(request),
    expectedSecret: expected,
    routes: subjects,
    now: new Date(),
    auskunft: liveAuskunft(),
  });

  for (const check of outcome.checks) {
    const saved = await admin
      .from("route_checks")
      .upsert(checkRow(check.userId, check.id, check.result), { onConflict: "route_id,service_date" });
    if (saved.error) return Response.json({ error: "unavailable" }, { status: 500 });

    const today = todayFromCheck(check.result);
    if (!today) continue;
    const remembered = await admin
      .from("routes")
      .update({ today_refresh_token: today.refreshToken, today_service_date: today.serviceDate })
      .eq("id", check.id);
    if (remembered.error) return Response.json({ error: "unavailable" }, { status: 500 });
  }

  return Response.json({ checked: outcome.checks.length });
}
