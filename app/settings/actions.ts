"use server";

import { redirect } from "next/navigation";
import { normalizeInterval } from "@/lib/clock";
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
