"use server";

import { redirect } from "next/navigation";
import { registerFailureReason } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    redirect("/register?error=mismatch");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/register?error=1");
  }

  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password,
  });

  if (error) {
    const reason = registerFailureReason(error);
    redirect(reason === "exists" ? "/register?error=exists" : "/register?error=1");
  }

  if (!data.session) {
    redirect("/sign-in?notice=account");
  }

  redirect("/");
}
