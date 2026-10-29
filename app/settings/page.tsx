import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import { defaultIntervalMinutes } from "@/lib/clock";
import { defaultWindowMinutes } from "@/lib/window";
import { createClient, currentUser } from "@/lib/supabase/server";

function SettingsFallback() {
  return <StartScreen language="de" theme="paper" />;
}

async function Settings({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const { language, theme } = await readAppearance();
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("user_settings").select("check_interval_minutes, arrival_window_minutes").eq("user_id", user.id).maybeSingle()
    : { data: null };

  return (
    <StartScreen
      language={language}
      theme={theme}
      nav={<SignedIn language={language} current="settings" />}
    >
      <SettingsForm
        language={language}
        minutes={data?.check_interval_minutes ?? defaultIntervalMinutes}
        windowMinutes={data?.arrival_window_minutes ?? defaultWindowMinutes}
        failed={params.error === "1"}
      />
    </StartScreen>
  );
}

export const instant = false;

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}
