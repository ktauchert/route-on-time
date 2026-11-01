"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeInterval } from "@/lib/clock";
import { onRouteCookie, resolveOnRouteMode } from "@/lib/on-route";
import { normalizeWindow } from "@/lib/window";
import { createClient, currentUser } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const minutes = normalizeInterval(formData.get("interval"));
  const windowMinutes = normalizeWindow(formData.get("window"));
  if (minutes == null || windowMinutes == null) redirect("/settings?error=1");

  const supabase = await createClient();
  if (!supabase) redirect("/settings?error=1");

  const { error } = await supabase.from("user_settings").upsert(
    { user_id: user.id, check_interval_minutes: minutes, arrival_window_minutes: windowMinutes },
    { onConflict: "user_id" },
  );

  if (error) redirect("/settings?error=1");
  redirect("/settings");
}

const yearSeconds = 60 * 60 * 24 * 365;
const destinations = ["/settings", "/routes"];

// The mode belongs to the device, like the language and the theme, so it lives in a cookie.
export async function setOnRouteMode(formData: FormData) {
  const mode = resolveOnRouteMode(String(formData.get("mode") ?? ""));
  const next = String(formData.get("next") ?? "");

  const jar = await cookies();
  jar.set(onRouteCookie, mode, { path: "/", maxAge: yearSeconds, sameSite: "lax" });
  redirect(destinations.includes(next) ? next : "/settings");
}
