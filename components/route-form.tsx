"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveRoute, searchLines } from "@/app/routes/actions";
import { DeleteRoute } from "@/components/delete-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultWeekdays, weekdayLabels, weekdays, type Weekday } from "@/lib/route";
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
  const [lines, setLines] = useState<Place[]>([]);
  const [line, setLine] = useState<Place | null>(
    route?.lineId && route.lineName ? { id: route.lineId, name: route.lineName } : null,
  );
  const [days, setDays] = useState<Weekday[]>(route?.weekdays ?? [...defaultWeekdays]);
  const [timing, setTiming] = useState<"arrival" | "leave">(route && !route.arrival ? "leave" : "arrival");

  async function loadLines() {
    if (!start) return;
    const places = await searchLines(start.id);
    setLines(places.map((place) => ({ id: place.id, name: place.name })));
  }

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
      <input type="hidden" name="lineId" value={line?.id ?? ""} />
      <input type="hidden" name="lineName" value={line?.name ?? ""} />
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
          onSelect={(place) => {
            setStart(place);
            setLine(null);
            setLines([]);
          }}
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

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{isGerman ? "Linie" : "Line"}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={loadLines} disabled={!start}>
              {isGerman ? "Linien am Start" : "Lines at the start"}
            </Button>
            {line ? <p className="font-medium text-signal">✓ {line.name}</p> : null}
          </div>
          {lines.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {lines.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={line?.id === item.id ? "default" : "outline"}
                  aria-pressed={line?.id === item.id}
                  onClick={() => setLine(item)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
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
      <Button type="submit" form={formId} disabled={sameStop}>
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
