import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RouteIndex } from "@/components/route-index";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { listRoutes } from "@/app/routen/actions";
import { readAppearance } from "@/lib/appearance";
import { routesForToday } from "@/lib/route";
import { currentUser } from "@/lib/supabase/server";

function IndexFallback() {
  return <StartScreen language="de" theme="paper" board />;
}

async function Index() {
  await connection();
  if (!(await currentUser())) redirect("/anmelden");

  const { language, theme } = await readAppearance();
  const { routes, missingTable } = await listRoutes();

  return (
    <StartScreen language={language} theme={theme} board>
      <SignedIn language={language} />
      <RouteIndex
        language={language}
        routes={routes}
        today={routesForToday(routes)}
        missingTable={missingTable}
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
