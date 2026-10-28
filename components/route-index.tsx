import Link from "next/link";
import { DeleteRoute } from "@/components/delete-route";
import { QuickStart } from "@/components/quick-start";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import { upcomingLabel, type RouteGlance } from "@/lib/moment";
import { routeLabel } from "@/lib/route";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";

export function RouteIndex({
  language,
  routes,
  today,
  missingTable,
  glances,
}: {
  language: Language;
  routes: StoredRoute[];
  today: StoredRoute[];
  missingTable: boolean;
  glances: Record<string, RouteGlance>;
}) {
  const isGerman = language === "de";
  const empty = isGerman ? "Noch keine Route." : "No route yet.";
  const table = isGerman
    ? "Die Routentabelle fehlt noch. Lege sie im Supabase-SQL-Editor aus supabase/migrations an."
    : "The route table is missing. Create it in the Supabase SQL editor from supabase/migrations.";

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {missingTable ? <p role="alert">{table}</p> : null}
      <Button size="sm" variant="outline" className="hidden w-fit md:inline-flex" asChild>
        <Link href="/routes/new">{isGerman ? "Neue Route" : "New route"}</Link>
      </Button>
      {routes.length === 0 ? <p>{empty}</p> : null}
      <ul className="flex flex-col gap-3">
        {routes.map((route) => {
          const glance = glances[route.id];
          return (
            <li key={route.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Link href={`/routes/${route.id}`} className="font-medium">
                  {routeLabel(route)}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {isGerman ? "Ankunft" : "Arrival"} {route.arrival}
                </p>
                {glance ? <StatusPill language={language} status={glance.status} /> : null}
                {glance?.upcomingMinutes != null ? (
                  <p className="text-sm">{upcomingLabel(language, glance.upcomingMinutes)}</p>
                ) : null}
                {glance?.progress != null ? <TripProgress language={language} progress={glance.progress} /> : null}
              </div>
              <DeleteRoute id={route.id} language={language} />
            </li>
          );
        })}
      </ul>
      <QuickStart language={language} routes={today} />
    </div>
  );
}
