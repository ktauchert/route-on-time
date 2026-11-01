export const onRouteCookie = "on-route";

export type OnRouteMode = "on" | "off";

// The mode is on until a device turns it off.
export function resolveOnRouteMode(value: string | undefined): OnRouteMode {
  return value === "off" ? "off" : "on";
}

export function shouldShowOnRoute(mode: OnRouteMode, active: unknown) {
  return mode === "on" && Boolean(active);
}
