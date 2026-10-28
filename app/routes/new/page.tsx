import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RouteForm } from "@/components/route-form";
import { SignedIn } from "@/components/signed-in";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function FormFallback() {
  return <StartScreen language="de" theme="paper" board />;
}

async function NewRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  if (!(await currentUser())) redirect("/sign-in");

  const params = await searchParams;
  const { language, theme } = await readAppearance();

  return (
    <StartScreen language={language} theme={theme} board>
      <SignedIn language={language} />
      <RouteForm language={language} route={null} failed={params.error === "1"} />
    </StartScreen>
  );
}

export const instant = false;

export default function NewRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<FormFallback />}>
      <NewRoute searchParams={searchParams} />
    </Suspense>
  );
}
