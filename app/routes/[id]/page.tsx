import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { DeleteRoute } from "@/components/delete-route";
import { RouteForm } from "@/components/route-form";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { RouteCheck } from "@/components/route-check";
import { latestCheck, listRoutes } from "@/app/routes/actions";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function FormFallback() {
  return <StartScreen language="de" theme="paper" board />;
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
  const chosenToken =
    route.todayRefreshToken && route.todayServiceDate === check?.serviceDate
      ? route.todayRefreshToken
      : null;

  return (
    <StartScreen language={language} theme={theme} board>
      <SignedIn language={language} />
      <RouteCheck
        language={language}
        routeId={route.id}
        check={check}
        chosenToken={chosenToken}
        saveFailed={params.error === "check"}
      />
      <RouteForm language={language} route={route} failed={params.error === "1"} />
      <DeleteRoute id={route.id} language={language} />
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
