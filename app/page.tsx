import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RouteBoard } from "@/components/route-board";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { listRoutes } from "@/app/routen/actions";
import { routesForToday, type StoredRoute } from "@/lib/route";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function HomeFallback() {
  return <StartScreen language="de" theme="paper" centered />;
}

async function HomeSession({
  searchParams,
}: {
  searchParams: Promise<{ neu?: string; route?: string; fehler?: string }>;
}) {
  await connection();
  const user = await currentUser();

  if (!user) {
    redirect("/anmelden");
  }

  const params = await searchParams;
  const { language, theme } = await readAppearance();
  const { routes, missingTable } = await listRoutes();
  const selected = routes.find((route) => route.id === params.route) ?? null;
  const creating = params.neu === "1";

  return (
    <StartScreen language={language} theme={theme} board>
      <SignedIn language={language} />
      <RouteBoard
        language={language}
        routes={routes}
        today={routesForToday(routes)}
        selected={selected}
        creating={creating}
        failed={params.fehler === "1"}
        missingTable={missingTable}
      />
    </StartScreen>
  );
}

export const instant = false;

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ neu?: string; route?: string; fehler?: string }>;
}) {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeSession searchParams={searchParams} />
    </Suspense>
  );
}

export type { StoredRoute };
