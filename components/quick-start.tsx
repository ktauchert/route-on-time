"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routeLabel } from "@/lib/route";
import type { Language } from "@/lib/preferences";

export function QuickStart({
  language,
  routes,
}: {
  language: Language;
  routes: Array<{ id: string; name: string | null; startName: string; zielName: string; weekdays: string[] }>;
}) {
  const [open, setOpen] = useState(false);
  const label = language === "en" ? "Quick start" : "Schnellstart";
  const create = language === "en" ? "New route" : "Neue Route";

  return (
    <div className="fixed right-4 bottom-4 z-20 md:hidden">
      {open ? (
        <div className="mb-2 flex flex-col gap-2 rounded-lg border bg-background p-3 shadow-lg">
          <Link href="/routen/neu">{create}</Link>
          {routes.map((route) => (
            <Link key={route.id} href={`/routen/${route.id}`}>
              {routeLabel(route)}
            </Link>
          ))}
        </div>
      ) : null}
      <Button type="button" onClick={() => setOpen((value) => !value)}>
        {label}
      </Button>
    </div>
  );
}
