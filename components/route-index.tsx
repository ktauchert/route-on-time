import Link from "next/link";
import { DeleteRoute } from "@/components/delete-route";
import { QuickStart } from "@/components/quick-start";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import { nextRouteId, upcomingLabel, type RouteGlance } from "@/lib/moment";
import { modeLabel, type Mode } from "@/lib/mode";
import { routeLabel, timingLabel, weekdayNames } from "@/lib/route";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";

const copy = {
  de: {
    title: "Routen",
    create: "Neue Route",
    empty: "Noch keine Route.",
    emptyText: "Leg eine Route an, dann prüft die App sie für dich.",
    arrival: "Ankunft",
    next: "Nächste Abfahrt",
    table: "Die Routentabelle fehlt noch. Lege sie im Supabase-SQL-Editor aus supabase/migrations an.",
  },
  en: {
    title: "Routes",
    create: "New route",
    empty: "No route yet.",
    emptyText: "Create a route and the app checks it for you.",
    arrival: "Arrival",
    next: "Next departure",
    table: "The route table is missing. Create it in the Supabase SQL editor from supabase/migrations.",
  },
} as const;

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
  const text = copy[language];
  const next = nextRouteId(glances);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{text.title}</h2>
        <Button className="hidden md:inline-flex" asChild>
          <Link href="/routes/new">{text.create}</Link>
        </Button>
      </div>

      {missingTable ? (
        <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-4 text-sm text-miss">
          {text.table}
        </p>
      ) : null}

      {routes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed bg-card/50 p-6">
          <p className="font-semibold">{text.empty}</p>
          <p className="text-sm text-muted-foreground">{text.emptyText}</p>
          <Button asChild>
            <Link href="/routes/new">{text.create}</Link>
          </Button>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {routes.map((route) => {
          const glance = glances[route.id];
          const isNext = route.id === next;
          return (
            <li
              key={route.id}
              data-next={isNext ? "true" : undefined}
              className={`group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-foreground/25 md:p-5 ${
                isNext ? "border-signal/50 ring-1 ring-signal/20 hover:border-signal" : ""
              }`}
            >
              {isNext ? (
                <p className="text-xs font-semibold tracking-widest text-signal uppercase">{text.next}</p>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/routes/${route.id}`}
                    className="truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {routeLabel(route)}
                  </Link>
                  <p className="flex flex-wrap gap-x-1.5 text-sm text-muted-foreground tabular-nums">
                    <span>{timingLabel(language, route)}</span>
                    <span aria-hidden>·</span>
                    <span>{weekdayNames(language, route.weekdays)}</span>
                    {route.preferredMode ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{modeLabel(language, route.preferredMode as Mode)}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                {glance ? <StatusPill language={language} status={glance.status} /> : null}
              </div>
              {glance?.progress != null ? <TripProgress language={language} progress={glance.progress} /> : null}
              <div className="flex items-center justify-between gap-3">
                {glance?.upcomingMinutes != null ? (
                  <p className={`text-sm font-medium tabular-nums ${isNext ? "text-signal" : ""}`}>
                    {upcomingLabel(language, glance.upcomingMinutes)}
                  </p>
                ) : (
                  <span />
                )}
                <div className="relative z-10">
                  <DeleteRoute id={route.id} language={language} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <QuickStart
        language={language}
        routes={today.map((route) => ({ ...route, leave: !route.arrival }))}
      />
    </div>
  );
}
