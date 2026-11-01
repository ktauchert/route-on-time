"use client";

import { useMemo, useState } from "react";
import type { Suggestion } from "@/lib/check";
import { clockLabel, delayLabel } from "@/lib/check-copy";
import { onRouteCopy, transferLabel, walkLabel } from "@/lib/on-route-copy";
import {
  chooseBaseMap,
  positionAt,
  routeSegments,
  stationsOf,
  viewBoxFor,
  type BaseMap,
  type Station,
} from "@/lib/pixel-map";
import type { Language } from "@/lib/preferences";

const glyphs: Record<string, string> = {
  "~": "fill-signal/30",
  "#": "fill-foreground/25",
};

// Runs of the same glyph in a row become one rectangle, which keeps the SVG small.
function baseRects(map: BaseMap, box: { x: number; y: number; width: number; height: number }) {
  const rects: Array<{ key: string; x: number; y: number; width: number; glyph: string }> = [];
  for (let y = box.y; y < box.y + box.height; y += 1) {
    const line = map.grid[y] ?? "";
    let x = box.x;
    while (x < box.x + box.width) {
      const glyph = line[x] ?? ".";
      let end = x + 1;
      while (end < box.x + box.width && (line[end] ?? ".") === glyph) end += 1;
      if (glyph in glyphs) rects.push({ key: `${x}-${y}`, x, y, width: end - x, glyph });
      x = end;
    }
  }
  return rects;
}

function StationPopup({
  language,
  station,
  onClose,
}: {
  language: Language;
  station: Station;
  onClose: () => void;
}) {
  const text = onRouteCopy(language);
  const delay = delayLabel(station.delaySeconds);

  return (
    <div
      role="dialog"
      aria-label={station.name}
      className="absolute inset-x-2 bottom-2 flex flex-col gap-1.5 rounded-xl border bg-card p-3 text-sm shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{station.name}</h3>
        <button
          type="button"
          onClick={onClose}
          className="-m-2 min-h-11 min-w-11 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {text.closeStation}
        </button>
      </div>
      {station.arrival ? (
        <p className="tabular-nums">
          {text.arrival} {clockLabel(station.arrival)}
          {delay ? <span className="font-medium text-miss"> {delay}</span> : null}
        </p>
      ) : null}
      {station.departure ? (
        <p className="tabular-nums">
          {text.departure} {clockLabel(station.departure)}
        </p>
      ) : null}
      {station.transferMinutes != null ? (
        <p className="font-medium text-signal">{transferLabel(language, station.transferMinutes)}</p>
      ) : null}
      {station.from && station.to ? (
        <p className="text-muted-foreground">
          {station.from} → {station.to}
        </p>
      ) : station.to ? (
        <p className="text-muted-foreground">→ {station.to}</p>
      ) : null}
      {station.walkMinutes != null ? (
        <p className="text-muted-foreground">{walkLabel(language, station.walkMinutes, station.walkTo)}</p>
      ) : null}
    </div>
  );
}

const dotSize: Record<Station["kind"], string> = {
  start: "size-4",
  end: "size-4",
  transfer: "size-3.5",
  stop: "size-2",
};

export function OnRouteMap({
  language,
  trip,
  maps,
  now,
}: {
  language: Language;
  trip: Suggestion;
  maps: BaseMap[];
  now: Date;
}) {
  const text = onRouteCopy(language);
  const [selected, setSelected] = useState<string | null>(null);

  const drawn = useMemo(() => {
    const points = trip.legs.flatMap((leg) => [
      ...(leg.originPoint ? [leg.originPoint] : []),
      ...(leg.destinationPoint ? [leg.destinationPoint] : []),
    ]);
    if (points.length === 0) return null;

    const map = chooseBaseMap(points, maps);
    const segments = routeSegments(trip, map);
    const stations = stationsOf(trip, map);
    const cells = [...segments.flatMap((segment) => segment.cells), ...stations.map((station) => station.cell)];
    const box = viewBoxFor(cells, map);
    return { map, segments, stations, box, rects: baseRects(map, box) };
  }, [trip, maps]);

  if (!drawn) {
    return <p className="p-4 text-center text-sm text-muted-foreground">{text.noMap}</p>;
  }

  const { map, segments, stations, box, rects } = drawn;
  const here = positionAt(trip, now, map);
  const percentX = (x: number) => `${((x + 0.5 - box.x) / box.width) * 100}%`;
  const percentY = (y: number) => `${((y + 0.5 - box.y) / box.height) * 100}%`;
  const open = stations.find((station) => station.key === selected) ?? null;

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-h-full max-w-3xl overflow-hidden rounded-xl border bg-muted/40">
      <svg
        role="img"
        aria-label={text.map}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
        className="absolute inset-0 size-full"
        onClick={() => setSelected(null)}
      >
        {rects.map((rect) => (
          <rect key={rect.key} x={rect.x} y={rect.y} width={rect.width} height={1} className={glyphs[rect.glyph]} />
        ))}
        {segments.map((segment, index) =>
          segment.cells.map((cell, position) => (
            <rect
              key={`${index}-${position}`}
              x={cell.x}
              y={cell.y}
              width={1}
              height={1}
              data-mode={segment.mode ?? undefined}
              className={segment.mode ? "mode-fill" : "fill-muted-foreground/60"}
              style={segment.mode ? { fill: "var(--mode-color, var(--mode-other))" } : undefined}
            />
          )),
        )}
      </svg>

      {stations.map((station) => (
        <button
          key={station.key}
          type="button"
          aria-label={station.name}
          aria-pressed={selected === station.key}
          onClick={() => setSelected(station.key === selected ? null : station.key)}
          style={{ left: percentX(station.cell.x), top: percentY(station.cell.y) }}
          className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        >
          <span
            aria-hidden
            className={`block border-2 border-foreground bg-card ${dotSize[station.kind]} ${
              selected === station.key ? "bg-signal" : ""
            }`}
          />
        </button>
      ))}

      {here ? (
        <span
          aria-hidden
          style={{ left: percentX(here.x), top: percentY(here.y) }}
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-signal ring-2 ring-card"
        />
      ) : null}

      {open ? <StationPopup language={language} station={open} onClose={() => setSelected(null)} /> : null}

      <p className="pointer-events-none absolute top-1 right-2 text-[10px] text-muted-foreground">{text.attribution}</p>
    </div>
  );
}
