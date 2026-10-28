import Link from "next/link";
import { DeleteRoute } from "@/components/delete-route";
import { QuickStart } from "@/components/quick-start";
import { routeLabel } from "@/lib/route";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";

export function RouteIndex({
  language,
  routes,
  today,
  missingTable,
}: {
  language: Language;
  routes: StoredRoute[];
  today: StoredRoute[];
  missingTable: boolean;
}) {
  const isGerman = language === "de";
  const empty = isGerman ? "Noch keine Route." : "No route yet.";
  const table = isGerman
    ? "Die Routentabelle fehlt noch. Lege sie im Supabase-SQL-Editor aus supabase/migrations an."
    : "The route table is missing. Create it in the Supabase SQL editor from supabase/migrations.";

  return (
    <div className="flex flex-col gap-4">
      {missingTable ? <p role="alert">{table}</p> : null}
      <Link href="/routes/new" className="hidden text-sm underline-offset-4 hover:underline md:inline">
        {isGerman ? "Neue Route" : "New route"}
      </Link>
      {routes.length === 0 ? <p>{empty}</p> : null}
      <ul className="flex flex-col gap-3">
        {routes.map((route) => (
          <li key={route.id} className="flex items-center justify-between gap-3">
            <Link href={`/routes/${route.id}`}>{routeLabel(route)}</Link>
            <DeleteRoute id={route.id} language={language} />
          </li>
        ))}
      </ul>
      <QuickStart language={language} routes={today} />
    </div>
  );
}
