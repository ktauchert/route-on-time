import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RouteIndex } from "@/components/route-index";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { checkIfDue, listGlances, listRoutes, userInterval } from "@/app/routes/actions";
import { InstallHint } from "@/components/install-hint";
import { AutoCheck } from "@/components/auto-check";
import { readAppearance } from "@/lib/appearance";
import { routesForToday } from "@/lib/route";
import { currentUser } from "@/lib/supabase/server";

function IndexFallback() {
  return <StartScreen language="de" theme="paper" />;
}

async function Index() {
  await connection();
  if (!(await currentUser())) redirect("/sign-in");

  const { language, theme } = await readAppearance();
  const { routes, missingTable } = await listRoutes();
  const glances = await listGlances(routes);
  const intervalMinutes = await userInterval();

  return (
    <StartScreen
      language={language}
      theme={theme}
      nav={<SignedIn language={language} current="routes" />}
    >
      <InstallHint language={language} />
      <AutoCheck
        language={language}
        routeIds={routesForToday(routes).map((route) => route.id)}
        intervalMinutes={intervalMinutes}
        run={checkIfDue}
      />
      <RouteIndex
        language={language}
        routes={routes}
        today={routesForToday(routes)}
        missingTable={missingTable}
        glances={glances}
      />
    </StartScreen>
  );
}

export const instant = false;

export default function RoutesPage() {
  return (
    <Suspense fallback={<IndexFallback />}>
      <Index />
    </Suspense>
  );
}
