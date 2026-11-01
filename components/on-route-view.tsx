"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { setOnRouteMode } from "@/app/settings/actions";
import { OnRouteMap } from "@/components/on-route-map";
import { PixelProgress } from "@/components/pixel-progress";
import { StatusPill } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import type { CheckStatus, Suggestion } from "@/lib/check";
import { onRouteCopy, remainingLabel } from "@/lib/on-route-copy";
import { tripMoment, upcomingLabel } from "@/lib/moment";
import type { BaseMap } from "@/lib/pixel-map";
import type { Language } from "@/lib/preferences";

const tickMs = 30 * 1000;

export function OnRouteView({
  language,
  name,
  status,
  trip,
  maps,
  now: initial,
  routeId,
}: {
  language: Language;
  name: string;
  status: CheckStatus;
  trip: Suggestion;
  maps: BaseMap[];
  now: string;
  routeId: string;
}) {
  const text = onRouteCopy(language);
  const [now, setNow] = useState(() => new Date(initial));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, []);

  const moment = tripMoment(trip.legs, now);
  const end = trip.legs[trip.legs.length - 1]?.arrival;
  const remaining = end ? Math.max(0, Math.ceil((new Date(end).getTime() - now.getTime()) / 60000)) : 0;
  const label =
    moment.upcomingMinutes != null
      ? upcomingLabel(language, moment.upcomingMinutes)
      : remainingLabel(language, remaining);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h1 className="font-pixel text-base leading-tight text-balance">{name}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill language={language} status={status} />
          <form action={setOnRouteMode}>
            <input type="hidden" name="mode" value="off" />
            <input type="hidden" name="next" value="/routes" />
            <Button type="submit" size="sm" variant="outline">
              {text.off}
            </Button>
          </form>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center p-3">
        <OnRouteMap language={language} trip={trip} maps={maps} now={now} />
      </main>

      <footer className="flex flex-col gap-3 border-t px-4 py-3">
        <PixelProgress value={moment.progress ?? 0} label={label} />
        <Link href={`/routes/${routeId}`} className="w-fit text-sm text-muted-foreground hover:text-foreground">
          {text.toRoute}
        </Link>
      </footer>
    </div>
  );
}
