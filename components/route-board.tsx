import { DeleteRoute } from "@/components/delete-route";
import { QuickStart } from "@/components/quick-start";
import { RouteForm } from "@/components/route-form";
import { routeLabel } from "@/lib/route";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";
import Link from "next/link";

export function RouteBoard({
  language,
  routes,
  today,
  selected,
  creating,
  failed,
  missingTable,
}: {
  language: Language;
  routes: StoredRoute[];
  today: StoredRoute[];
  selected: StoredRoute | null;
  creating: boolean;
  failed: boolean;
  missingTable: boolean;
}) {
  const de = language === "de";
  const showForm = creating || Boolean(selected);
  const empty = de ? "Noch keine Route." : "No route yet.";
  const pick = de ? "Wähle eine Route oder lege eine neue an." : "Choose a route or create one.";
  const table = de
    ? "Die Routentabelle fehlt noch. Lege sie im Supabase-SQL-Editor aus supabase/migrations an."
    : "The route table is missing. Create it in the Supabase SQL editor from supabase/migrations.";

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[18rem_1fr] md:items-start">
      <aside className={showForm ? "hidden flex-col gap-3 md:flex" : "flex flex-col gap-3"}>
        <Link href="/?neu=1" className="text-sm underline-offset-4 hover:underline">
          {de ? "Neue Route" : "New route"}
        </Link>
        {routes.length === 0 ? <p>{empty}</p> : null}
        <ul className="flex flex-col gap-2">
          {routes.map((route) => (
            <li key={route.id}>
              <Link href={`/?route=${route.id}`}>{routeLabel(route)}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className={showForm ? "block" : "hidden md:block"}>
        {missingTable ? <p role="alert">{table}</p> : null}
        {showForm ? (
          <RouteForm language={language} route={creating ? null : selected} failed={failed} />
        ) : (
          <p>{pick}</p>
        )}
        {selected && !creating ? <DeleteRoute id={selected.id} language={language} /> : null}
      </section>
      <QuickStart language={language} routes={today} />
    </div>
  );
}
