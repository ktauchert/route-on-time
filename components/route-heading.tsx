import Link from "next/link";
import { routeLabel, weekdayNames, type StoredRoute } from "@/lib/route";
import type { Language } from "@/lib/preferences";

export function RouteHeading({ language, route }: { language: Language; route: StoredRoute | null }) {
  const isGerman = language === "de";

  return (
    <div className="flex flex-col gap-2">
      <Link href="/routes" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        {isGerman ? "← Routen" : "← Routes"}
      </Link>
      <h2 className="text-2xl font-semibold tracking-tight text-balance">
        {route ? routeLabel(route) : isGerman ? "Neue Route" : "New route"}
      </h2>
      {route ? (
        <p className="text-sm text-muted-foreground tabular-nums">
          {route.startName} → {route.destinationName} · {isGerman ? "Ankunft" : "Arrival"} {route.arrival} ·{" "}
          {weekdayNames(language, route.weekdays)}
        </p>
      ) : null}
    </div>
  );
}
