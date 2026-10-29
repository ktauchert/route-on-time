"use client";

import { useState } from "react";
import Link from "next/link";
import { checkRoute, leaveRoute } from "@/app/routes/actions";
import { Button } from "@/components/ui/button";
import { routeLabel } from "@/lib/route";
import type { Language } from "@/lib/preferences";

export function QuickStart({
  language,
  routes,
}: {
  language: Language;
  routes: Array<{ id: string; name: string | null; startName: string; destinationName: string; weekdays: string[]; leave?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const label = language === "en" ? "Quick start" : "Schnellstart";
  const create = language === "en" ? "New route" : "Neue Route";
  const leaveLabel = language === "en" ? "I'm leaving the office" : "Ich verlasse das Büro";

  return (
    <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-end md:hidden">
      {open ? (
        <div className="mb-3 flex min-w-56 flex-col gap-1 rounded-2xl border bg-popover p-2 shadow-lg">
          <Link href="/routes/new" className="rounded-lg px-3 py-2 text-sm font-medium text-signal hover:bg-muted">
            <span aria-hidden>+ </span>
            {create}
          </Link>
          {routes.map((route) => (
            <form key={route.id} action={route.leave ? leaveRoute : checkRoute}>
              <input type="hidden" name="id" value={route.id} />
              <Button type="submit" variant="ghost" className="w-full justify-start">
                {route.leave ? `${leaveLabel} · ` : ""}
                {routeLabel(route)}
              </Button>
            </form>
          ))}
        </div>
      ) : null}
      <Button
        type="button"
        aria-expanded={open}
        className="h-12 rounded-full px-5 text-base shadow-lg"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </Button>
    </div>
  );
}
