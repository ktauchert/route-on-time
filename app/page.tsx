import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";

function HomeFallback() {
  return null;
}

async function HomeSession() {
  await connection();
  if (!(await currentUser())) redirect("/sign-in");
  redirect("/routes");
  return null;
}

export const instant = false;

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeSession />
    </Suspense>
  );
}
