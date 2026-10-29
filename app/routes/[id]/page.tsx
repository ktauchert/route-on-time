import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RouteForm } from "@/components/route-form";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { RouteCheck } from "@/components/route-check";
import { RouteHeading } from "@/components/route-heading";
import { checkIfDue, latestCheck, listRoutes, userInterval } from "@/app/routes/actions";
import { AutoCheck } from "@/components/auto-check";
import { berlinDateString } from "@/lib/check";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function FormFallback() {
  return <StartScreen language="de" theme="paper" />;
}

async function EditRoute({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  if (!(await currentUser())) redirect("/sign-in");

  const params = await searchParams;
  const { language, theme } = await readAppearance();
  const { routes } = await listRoutes();
  const route = routes.find((item) => item.id === id);

  if (!route) redirect("/routes");

  const check = await latestCheck(route.id);
  const intervalMinutes = await userInterval();
  const chosenToken =
    route.todayRefreshToken && route.todayServiceDate === check?.serviceDate
      ? route.todayRefreshToken
      : null;

  return (
    <StartScreen
      language={language}
      theme={theme}
      nav={<SignedIn language={language} current="routes" />}
    >
      <RouteHeading language={language} route={route} />
      <AutoCheck language={language} routeIds={[route.id]} intervalMinutes={intervalMinutes} run={checkIfDue} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <RouteCheck
          language={language}
          routeId={route.id}
          check={check}
          chosenToken={chosenToken}
          saveFailed={params.error === "check"}
          now={new Date().toISOString()}
          leave={!route.arrival}
          leftAt={
            route.leftAt && berlinDateString(new Date(route.leftAt)) === berlinDateString(new Date())
              ? route.leftAt
              : null
          }
        />
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <h3 className="text-base font-semibold tracking-tight">
            {language === "de" ? "Route bearbeiten" : "Edit route"}
          </h3>
          <RouteForm language={language} route={route} failed={params.error === "1"} />
        </div>
      </div>
    </StartScreen>
  );
}

export const instant = false;

export default function EditRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<FormFallback />}>
      <EditGate params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditGate({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  return <EditRoute id={id} searchParams={searchParams} />;
}
