import type { Language } from "./preferences";

export type Mode = "suburban" | "subway" | "tram" | "bus" | "ferry" | "express" | "regional" | "other";

export const preferableModes = ["suburban", "regional", "subway", "tram", "bus"] as const;

export type PreferableMode = (typeof preferableModes)[number];

type ModeLeg = {
  walking?: boolean;
  lineName?: string | null;
  product?: string | null;
};

type TimedLeg = ModeLeg & { departure: string; arrival: string };

const known: readonly Mode[] = ["suburban", "subway", "tram", "bus", "ferry", "express", "regional"];

function fromName(name: string | null | undefined): Mode {
  const line = (name ?? "").trim().toUpperCase();
  if (/^S\s?\d/.test(line)) return "suburban";
  if (/^U\s?\d/.test(line)) return "subway";
  if (/^(RB|RE|RX|FEX)\s?\d*/.test(line)) return "regional";
  if (/^(ICE|IC|EC)\b/.test(line)) return "express";
  return "other";
}

export function modeOf(leg: ModeLeg): Mode | null {
  if (leg.walking) return null;
  const product = leg.product as Mode | null | undefined;
  if (product && known.includes(product)) return product;
  if (product) return "other";
  return fromName(leg.lineName);
}

export function usesMode(legs: ModeLeg[], mode: string) {
  return legs.some((leg) => modeOf(leg) === mode);
}

const labels = {
  de: {
    suburban: "S-Bahn",
    subway: "U-Bahn",
    tram: "Tram",
    bus: "Bus",
    ferry: "Fähre",
    express: "Fernzug",
    regional: "Regionalbahn",
    other: "Sonstige",
  },
  en: {
    suburban: "S-Bahn",
    subway: "U-Bahn",
    tram: "Tram",
    bus: "Bus",
    ferry: "Ferry",
    express: "Long-distance",
    regional: "Regional train",
    other: "Other",
  },
} as const;

export function modeLabel(language: Language, mode: Mode) {
  return labels[language][mode];
}

export type TimelinePart = {
  kind: "leg" | "walk" | "wait";
  mode: Mode | null;
  minutes: number;
  share: number;
  label: string;
};

export function timelineOf(legs: TimedLeg[]): TimelinePart[] {
  const raw: Array<Omit<TimelinePart, "share">> = [];
  let previousEnd: number | null = null;

  for (const leg of legs) {
    if (!leg.departure || !leg.arrival) continue;
    const start = new Date(leg.departure).getTime();
    const end = new Date(leg.arrival).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    if (previousEnd != null && start > previousEnd) {
      raw.push({ kind: "wait", mode: null, minutes: Math.round((start - previousEnd) / 60000), label: "" });
    }
    const mode = modeOf(leg);
    raw.push({
      kind: leg.walking ? "walk" : "leg",
      mode,
      minutes: Math.round((end - start) / 60000),
      label: leg.walking ? "" : (leg.lineName ?? ""),
    });
    previousEnd = end;
  }

  const total = raw.reduce((sum, part) => sum + part.minutes, 0);
  if (total === 0) return [];
  return raw.map((part) => ({ ...part, share: part.minutes / total }));
}
