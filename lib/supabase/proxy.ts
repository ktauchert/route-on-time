import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirect } from "@/lib/auth";
import { supabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const env = supabasePublicEnv();
  let response = NextResponse.next({ request });
  let signedIn = false;

  if (env) {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  const destination = authRedirect(request.nextUrl.pathname, signedIn);

  if (!destination) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;
  return NextResponse.redirect(url);
}
