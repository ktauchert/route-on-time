import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "@/lib/supabase/env";

export async function createClient() {
  const env = supabasePublicEnv();

  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // A Server Component cannot always write cookies. The proxy refreshes them.
        }
      },
    },
  });
}

export async function currentUser() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user;
}
