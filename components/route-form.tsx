"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveRoute, searchLines } from "@/app/routen/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultWeekdays, weekdays, type Weekday } from "@/lib/route";
import { createStopSearch, type StopMatch } from "@/lib/stop-search";
import type { Language } from "@/lib/preferences";
import type { StoredRoute } from "@/lib/route";

const weekdayLabels = {
  de: { mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa", sun: "So" },
  en: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
} as const;

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
  const de = language === "de";
  const [start, setStart] = useState<Place | null>(
    route ? { id: route.startId, name: route.startName } : null,
  );
  const [ziel, setZiel] = useState<Place | null>(
    route ? { id: route.zielId, name: route.zielName } : null,
  );
  const [lines, setLines] = useState<Place[]>([]);
  const [line, setLine] = useState<Place | null>(
    route?.lineId && route.lineName ? { id: route.lineId, name: route.lineName } : null,
  );
  const [days, setDays] = useState<Weekday[]>(route?.weekdays ?? [...defaultWeekdays]);

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

  const sameStop = Boolean(start && ziel && start.id === ziel.id);

  return (
    <form action={saveRoute} className="flex flex-col gap-4">
      {route ? <input type="hidden" name="id" value={route.id} /> : null}
      <input type="hidden" name="startId" value={start?.id ?? ""} />
      <input type="hidden" name="startName" value={start?.name ?? ""} />
      <input type="hidden" name="zielId" value={ziel?.id ?? ""} />
      <input type="hidden" name="zielName" value={ziel?.name ?? ""} />
      <input type="hidden" name="lineId" value={line?.id ?? ""} />
      <input type="hidden" name="lineName" value={line?.name ?? ""} />
      {days.map((day) => (
        <input key={day} type="hidden" name="weekdays" value={day} />
      ))}

      {failed ? (
        <p role="alert">
          {de
            ? "Start und Ziel müssen zwei verschiedene Haltestellen sein, mit Ankunft und mindestens einem Wochentag."
            : "Start and destination must be two different stops, with an arrival and at least one weekday."}
        </p>
      ) : null}
      {sameStop ? (
        <p role="alert">
          {de
            ? "Start und Ziel müssen verschieden sein."
            : "Start and destination must be different."}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        {de ? "Name" : "Name"}
        <Input
          name="name"
          defaultValue={route?.name ?? ""}
          placeholder={de ? "Start → Ziel, wenn leer" : "Start → destination if empty"}
        />
      </label>

      <PlaceField
        label={de ? "Start" : "Start"}
        selected={start}
        onSelect={(place) => {
          setStart(place);
          setLine(null);
          setLines([]);
        }}
      />
      <PlaceField
        label={de ? "Ziel" : "Destination"}
        selected={ziel}
        onSelect={setZiel}
      />

      <label className="flex flex-col gap-1 text-sm">
        {de ? "Ankunft" : "Arrival"}
        <Input name="arrival" type="time" required defaultValue={route?.arrival ?? "09:00"} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {de ? "Minuten zum Umsteigen" : "Minutes to transfer"}
        <Input
          name="transferMinutes"
          type="number"
          min={0}
          defaultValue={route?.transferMinutes ?? ""}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {de ? "Höchstens Umstiege" : "Maximum transfers"}
        <Input name="maxTransfers" type="number" min={0} defaultValue={route?.maxTransfers ?? ""} />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span>{de ? "Linie" : "Line"}</span>
        <Button type="button" variant="outline" onClick={loadLines} disabled={!start}>
          {de ? "Linien am Start" : "Lines at the start"}
        </Button>
        {line ? <p>{line.name}</p> : null}
        <div className="flex flex-wrap gap-2">
          {lines.map((item) => (
            <Button key={item.id} type="button" variant="outline" onClick={() => setLine(item)}>
              {item.name}
            </Button>
          ))}
        </div>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="text-sm">{de ? "Wochentage" : "Weekdays"}</legend>
        {weekdays.map((day) => (
          <Button
            key={day}
            type="button"
            variant={days.includes(day) ? "default" : "outline"}
            aria-pressed={days.includes(day)}
            onClick={() => toggleDay(day)}
          >
            {weekdayLabels[language][day]}
          </Button>
        ))}
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={sameStop}>
          {de ? "Speichern" : "Save"}
        </Button>
        {route ? (
          <Button variant="outline" asChild>
            <Link href="/routen">{de ? "Abbrechen" : "Cancel"}</Link>
          </Button>
        ) : null}
      </div>
    </form>
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
      const response = await fetch(`/api/halte?q=${encodeURIComponent(value)}`, { signal });
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
      <label className="flex flex-col gap-1">
        {label}
        <Input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {selected ? <p>{selected.name}</p> : null}
      <div className="flex flex-col items-start gap-1">
        {results.map((place) => (
          <Button
            key={place.id}
            type="button"
            variant="ghost"
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
    </div>
  );
}
