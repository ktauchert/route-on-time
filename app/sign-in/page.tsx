import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import { currentUser } from "@/lib/supabase/server";

function LoginFallback() {
  return (
    <StartScreen language="de" theme="paper" centered>
      <LoginForm language="de" failed={false} />
    </StartScreen>
  );
}

async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  await connection();
  if (await currentUser()) {
    redirect("/");
  }

  const params = await searchParams;
  const { language, theme } = await readAppearance();

  return (
    <StartScreen language={language} theme={theme} centered>
      <LoginForm
        language={language}
        failed={params.error === "1" || params.error === "confirmation"}
        accountCreated={params.notice === "account"}
      />
    </StartScreen>
  );
}

export const instant = false;

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}
