import { modeLabel, modeOf, timelineOf } from "@/lib/mode";
import type { Language } from "@/lib/preferences";

type BarLeg = {
  walking?: boolean;
  lineName?: string | null;
  product?: string | null;
  departure: string;
  arrival: string;
};

export function ModeChip({ leg }: { leg: Omit<BarLeg, "departure" | "arrival"> }) {
  return (
    <span
      data-mode={modeOf(leg) ?? "other"}
      className="mode-fill rounded-md px-1.5 py-0.5 text-xs font-semibold"
    >
      {leg.lineName || ""}
    </span>
  );
}

export function ConnectionBar({ language, legs }: { language: Language; legs: BarLeg[] }) {
  const parts = timelineOf(legs);
  if (parts.length === 0) return null;

  const waiting = language === "de" ? "Warten" : "Wait";
  const walking = language === "de" ? "Fußweg" : "Walk";
  const description = parts
    .map((part) => {
      if (part.kind === "wait") return `${waiting} ${part.minutes} min`;
      if (part.kind === "walk") return `${walking} ${part.minutes} min`;
      const mode = part.mode ? modeLabel(language, part.mode) : "";
      return `${mode} ${part.label} ${part.minutes} min`.replace(/\s+/g, " ").trim();
    })
    .join(", ");

  return (
    <div role="img" aria-label={description} className="flex h-7 w-full gap-0.5 overflow-hidden rounded-lg">
      {parts.map((part, index) => (
        <span
          key={index}
          data-part={part.kind}
          data-mode={part.kind === "leg" ? (part.mode ?? "other") : undefined}
          style={{ flexGrow: part.share * 100, flexBasis: 0 }}
          className={
            part.kind === "leg"
              ? "mode-fill flex min-w-3 items-center justify-center overflow-hidden px-1 text-xs font-semibold"
              : part.kind === "walk"
                ? "min-w-1 bg-muted-foreground/30"
                : "min-w-1 bg-muted"
          }
        >
          {part.kind === "leg" && part.share >= 0.1 ? part.label : null}
        </span>
      ))}
    </div>
  );
}
