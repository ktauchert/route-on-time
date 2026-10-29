"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveRoute, searchLines } from "@/app/routes/actions";
import { AvoidLines } from "@/components/avoid-lines";
import { DeleteRoute } from "@/components/delete-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultWeekdays, weekdayLabels, weekdays, type Weekday } from "@/lib/route";
import { modeLabel, preferableModes } from "@/lib/mode";
import { createStopSearch, type StopMatch } from "@/lib/stop-search";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";

type Place = { id: string; name: string };

export function RouteForm({
  language,
  route,
  failed,
}: {
  language: Language;
  route: StoredRoute | null;
  failed: boolean;
}) {
  const isGerman = language === "de";
  const [start, setStart] = useState<Place | null>(
    route ? { id: route.startId, name: route.startName } : null,
  );
  const [destination, setDestination] = useState<Place | null>(
    route ? { id: route.destinationId, name: route.destinationName } : null,
  );
  const [avoid, setAvoid] = useState<string[]>(route?.avoidLines ?? []);
  const [days, setDays] = useState<Weekday[]>(route?.weekdays ?? [...defaultWeekdays]);
  const [timing, setTiming] = useState<"arrival" | "leave">(route && !route.arrival ? "leave" : "arrival");

  function toggleDay(day: Weekday) {
    setDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((item) => item !== day);
      }
      return [...current, day];
    });
  }

  const sameStop = Boolean(start && destination && start.id === destination.id);
  const formId = route ? `route-${route.id}` : "route-new";

  const field = "flex flex-col gap-1.5 text-sm font-medium";
  const section = "flex flex-col gap-4";
  const legend = "mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase";

  return (
    <div className="flex flex-col gap-6 rounded-2xl border bg-card p-4 shadow-xs md:p-6">
    <form id={formId} action={saveRoute} className="flex flex-col gap-8">
      {route ? <input type="hidden" name="id" value={route.id} /> : null}
      <input type="hidden" name="startId" value={start?.id ?? ""} />
      <input type="hidden" name="startName" value={start?.name ?? ""} />
      <input type="hidden" name="destinationId" value={destination?.id ?? ""} />
      <input type="hidden" name="destinationName" value={destination?.name ?? ""} />
      {days.map((day) => (
        <input key={day} type="hidden" name="weekdays" value={day} />
      ))}

      {failed ? (
        <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-3 text-sm text-miss">
          {isGerman
            ? "Start und Ziel müssen zwei verschiedene Haltestellen sein, mit Ankunft oder Aufbruch per Knopf und mindestens einem Wochentag."
            : "Start and destination must be two different stops, with an arrival and at least one weekday."}
        </p>
      ) : null}

      <fieldset className={section}>
        <legend className={legend}>{isGerman ? "Strecke" : "Route"}</legend>
        <label className={field}>
          {isGerman ? "Name" : "Name"}
          <Input
            name="name"
            defaultValue={route?.name ?? ""}
            placeholder={isGerman ? "Start → Ziel, wenn leer" : "Start → destination if empty"}
          />
        </label>
        <PlaceField
          label={isGerman ? "Start" : "Start"}
          selected={start}
          onSelect={setStart}
        />
        <PlaceField
          label={isGerman ? "Ziel" : "Destination"}
          selected={destination}
          onSelect={setDestination}
        />
        {sameStop ? (
          <p role="alert" className="text-sm text-miss">
            {isGerman
              ? "Start und Ziel müssen verschieden sein."
              : "Start and destination must be different."}
          </p>
        ) : null}
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>{isGerman ? "Vorgabe" : "Requirement"}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(["arrival", "leave"] as const).map((kind) => (
            <label key={kind} className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="timing"
                value={kind}
                checked={timing === kind}
                onChange={() => setTiming(kind)}
              />
              {kind === "arrival"
                ? isGerman ? "Ankunft bis" : "Arrive by"
                : isGerman ? "Aufbruch per Knopf" : "Leaves by button"}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
          {timing === "arrival" ? (
            <label className={field}>
              {isGerman ? "Ankunft" : "Arrival"}
              <Input name="arrival" type="time" required defaultValue={route?.arrival || "09:00"} />
            </label>
          ) : null}
          <label className={field}>
            {isGerman ? "Minuten zum Umsteigen" : "Minutes to transfer"}
            <Input
              name="transferMinutes"
              type="number"
              min={0}
              defaultValue={route?.transferMinutes ?? ""}
            />
          </label>
          <label className={field}>
            {isGerman ? "Höchstens Umstiege" : "Maximum transfers"}
            <Input name="maxTransfers" type="number" min={0} defaultValue={route?.maxTransfers ?? ""} />
          </label>
        </div>

        <label className={field}>
          {isGerman ? "Bevorzugtes Verkehrsmittel" : "Preferred mode of transport"}
          <select
            name="preferredMode"
            defaultValue={route?.preferredMode ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{isGerman ? "Keine Vorliebe" : "No preference"}</option>
            {preferableModes.map((mode) => (
              <option key={mode} value={mode}>
                {modeLabel(language, mode)}
              </option>
            ))}
          </select>
        </label>

        <AvoidLines
          language={language}
          value={avoid}
          onChange={setAvoid}
          stopIds={[start?.id, destination?.id].filter((id): id is string => Boolean(id))}
          loadLines={searchLines}
        />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="relaxed" defaultChecked={route?.relaxed ?? false} className="mt-1" />
          <span>
            <span className="font-medium">{isGerman ? "Entspannt" : "Relaxed"}</span>
            <span className="block text-muted-foreground">
              {isGerman
                ? "Lieber weniger Umstiege, auch wenn du bis zu 20 Minuten später ankommst."
                : "Fewer transfers, even if you arrive up to 20 minutes later."}
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className={legend}>{isGerman ? "Wochentage" : "Weekdays"}</legend>
        {weekdays.map((day) => (
          <Button
            key={day}
            type="button"
            variant={days.includes(day) ? "default" : "outline"}
            aria-pressed={days.includes(day)}
            className="min-w-11"
            onClick={() => toggleDay(day)}
          >
            {weekdayLabels[language][day]}
          </Button>
        ))}
      </fieldset>

    </form>
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      {timing === "arrival" ? (
        <Button type="submit" form={formId} name="then" value="check" disabled={sameStop}>
          {isGerman ? "Speichern und prüfen" : "Save and check"}
        </Button>
      ) : null}
      <Button
        type="submit"
        form={formId}
        variant={timing === "arrival" ? "outline" : "default"}
        disabled={sameStop}
      >
        {isGerman ? "Speichern" : "Save"}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/routes">{isGerman ? "Abbrechen" : "Cancel"}</Link>
      </Button>
      {route ? (
        <div className="ml-auto">
          <DeleteRoute id={route.id} language={language} />
        </div>
      ) : null}
    </div>
    </div>
  );
}

function PlaceField({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: Place | null;
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [results, setResults] = useState<StopMatch[]>([]);
  const search = useRef(
    createStopSearch(async (value, signal) => {
      const response = await fetch(`/api/stops?q=${encodeURIComponent(value)}`, { signal });
      if (!response.ok) return [];
      return (await response.json()) as StopMatch[];
    }),
  );

  useEffect(() => {
    if (selected && query.trim() === selected.name) return;
    search.current(query, setResults);
  }, [query, selected]);

  return (
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex flex-col gap-1.5 font-medium">
        {label}
        <Input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {selected ? <p className="text-xs font-medium text-signal">✓ {selected.name}</p> : null}
      {results.length > 0 ? (
        <div className="flex flex-col overflow-hidden rounded-lg border bg-popover p-1 shadow-sm">
          {results.map((place) => (
            <Button
              key={place.id}
              type="button"
              variant="ghost"
              className="justify-start"
              onClick={() => {
                onSelect(place);
                setQuery(place.name);
                setResults([]);
              }}
            >
              {place.name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
