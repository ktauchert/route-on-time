import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { StartScreen } from "@/components/start-screen";
import { readAppearance } from "@/lib/appearance";
import type { RegisterFailure } from "@/lib/auth";
import { currentUser } from "@/lib/supabase/server";

function RegisterFallback() {
  return (
    <StartScreen language="de" theme="paper" centered>
      <RegisterForm language="de" failure={null} />
    </StartScreen>
  );
}

function failureFromQuery(value: string | undefined): RegisterFailure | null {
  if (value === "mismatch") return "mismatch";
  if (value === "exists") return "exists";
  if (value === "1") return "failed";
  return null;
}

async function Register({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();

  if (await currentUser()) {
    redirect("/");
  }

  const params = await searchParams;
  const { language, theme } = await readAppearance();

  return (
    <StartScreen language={language} theme={theme} centered>
      <RegisterForm language={language} failure={failureFromQuery(params.error)} />
    </StartScreen>
  );
}

export const instant = false;

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <Register searchParams={searchParams} />
    </Suspense>
  );
}
