import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function HomeFallback() {
  return <StartScreen language="de" theme="paper" centered />;
}

async function HomeSession() {
  await connection();
  const user = await currentUser();

  if (!user) {
    redirect("/anmelden");
  }

  const { language, theme } = await readAppearance();

  return (
    <StartScreen language={language} theme={theme} centered>
      <SignedIn language={language} />
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
