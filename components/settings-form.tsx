import Link from "next/link";
import { saveSettings } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maximumIntervalMinutes, minimumIntervalMinutes } from "@/lib/clock";
import type { Language } from "@/lib/preferences";

export function SettingsForm({
  language,
  minutes,
  failed,
}: {
  language: Language;
  minutes: number;
  failed: boolean;
}) {
  const isGerman = language === "de";

  return (
    <form action={saveSettings} className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">{isGerman ? "Einstellungen" : "Settings"}</h2>
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs md:p-6">
      {failed ? (
        <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-3 text-sm text-miss">
          {isGerman
            ? "Das Intervall muss eine ganze Zahl von 1 bis 180 Minuten sein."
            : "The interval must be a whole number from 1 to 180 minutes."}
        </p>
      ) : null}
      <label className="flex max-w-40 flex-col gap-1.5 text-sm font-medium">
        {isGerman ? "Intervall" : "Interval"}
        <Input
          name="interval"
          type="number"
          min={minimumIntervalMinutes}
          max={maximumIntervalMinutes}
          step={1}
          required
          defaultValue={minutes}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        {isGerman
          ? "Minuten zwischen den Prüfungen. Gewöhnlich mindestens 5. 1 Minute nur zum Ausprobieren."
          : "Minutes between checks. Usually at least 5. 1 minute is only for trying the clock."}
      </p>
      <div className="flex gap-2 border-t pt-4">
        <Button type="submit">{isGerman ? "Speichern" : "Save"}</Button>
        <Button variant="outline" asChild>
          <Link href="/routes">{isGerman ? "Routen" : "Routes"}</Link>
        </Button>
      </div>
      </div>
    </form>
  );
}
