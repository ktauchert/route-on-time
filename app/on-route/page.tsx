import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AutoCheck } from "@/components/auto-check";
import { OnRouteView } from "@/components/on-route-view";
import { checkIfDue, findActiveRoute, latestCheck, listRoutes, userInterval } from "@/app/routes/actions";
import { readAppearance } from "@/lib/appearance";
import { baseMaps } from "@/lib/basemap";
import { shouldShowOnRoute } from "@/lib/on-route";
import { readOnRouteMode } from "@/lib/on-route-server";
import { routeLabel } from "@/lib/route";
import { currentUser } from "@/lib/supabase/server";

async function OnRoute() {
  await connection();
  if (!(await currentUser())) redirect("/sign-in");

  const { language } = await readAppearance();
  const { routes } = await listRoutes();
  const active = await findActiveRoute(routes);
  if (!active || !shouldShowOnRoute(await readOnRouteMode(), active)) redirect("/routes");

  const check = await latestCheck(active.route.id);
  const intervalMinutes = await userInterval();

  return (
    <>
      <AutoCheck language={language} routeIds={[active.route.id]} intervalMinutes={intervalMinutes} run={checkIfDue} />
      <OnRouteView
        language={language}
        name={routeLabel(active.route)}
        status={check?.status ?? "unclear"}
        trip={active.trip}
        maps={baseMaps}
        now={new Date().toISOString()}
        routeId={active.route.id}
      />
    </>
  );
}

export const instant = false;

export default function OnRoutePage() {
  return (
    <Suspense fallback={null}>
      <OnRoute />
    </Suspense>
  );
}
