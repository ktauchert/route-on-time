import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function HomeFallback() {
  return <StartScreen language="de" theme="paper" board wordmarkHref="/" />;
}

async function HomeSession() {
  await connection();
  if (await currentUser()) redirect("/routes");

  const { language, theme } = await readAppearance();

  return (
    <StartScreen language={language} theme={theme} board wordmarkHref="/">
      <Landing language={language} />
    </StartScreen>
  );
}

export const instant = false;

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeSession />
    </Suspense>
  );
}
