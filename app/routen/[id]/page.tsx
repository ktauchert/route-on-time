import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { DeleteRoute } from "@/components/delete-route";
import { RouteForm } from "@/components/route-form";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { listRoutes } from "@/app/routen/actions";
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
  searchParams: Promise<{ fehler?: string }>;
}) {
  await connection();
  if (!(await currentUser())) redirect("/anmelden");

  const params = await searchParams;
  const { language, theme } = await readAppearance();
  const { routes } = await listRoutes();
  const route = routes.find((item) => item.id === id);

  if (!route) redirect("/routen");

  return (
    <StartScreen language={language} theme={theme} board>
      <SignedIn language={language} />
      <RouteForm language={language} route={route} failed={params.fehler === "1"} />
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
  searchParams: Promise<{ fehler?: string }>;
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
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { id } = await params;
  return <EditRoute id={id} searchParams={searchParams} />;
}
