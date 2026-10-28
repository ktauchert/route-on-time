import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirect, confirmedSessionPath } from "@/lib/auth";
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

    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const url = request.nextUrl.clone();
      const target = new URL(confirmedSessionPath(!error), request.url);
      url.pathname = target.pathname;
      url.search = target.search;
      return redirectWithSession(url, response);
    }

    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  const destination = authRedirect(request.nextUrl.pathname, signedIn);

  if (!destination) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;
  return redirectWithSession(url, response);
}

function redirectWithSession(url: URL, session: NextResponse) {
  const redirect = NextResponse.redirect(url);
  session.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}
