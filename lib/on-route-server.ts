import { cookies } from "next/headers";
import { onRouteCookie, resolveOnRouteMode } from "@/lib/on-route";

export async function readOnRouteMode() {
  const jar = await cookies();
  return resolveOnRouteMode(jar.get(onRouteCookie)?.value);
}
