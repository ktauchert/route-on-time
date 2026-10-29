"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { modeLabel, modeOf, type Mode } from "@/lib/mode";
import type { Language } from "@/lib/preferences";

export type LineOption = { name: string; product: string | null };

type Step = 1 | 2 | 3;
type Choice = Mode | "manual";

const copy = {
  de: {
    field: "Linien meiden",
    choose: "Linien wählen",
    change: "Linien ändern",
    needStops: "Wähle zuerst Start und Ziel.",
    title: "Linien meiden",
    step: (step: number) => `Schritt ${step} von 3`,
    kind: "Welche Art von Verkehrsmittel?",
    line: "Welche Linie?",
    summary: "Diese Linien werden gemieden:",
    none: "Keine Linie wird gemieden.",
    loading: "Lade Linien …",
    failed: "Die Linien konnten nicht geladen werden.",
    empty: "An Start und Ziel wurden keine Linien gefunden.",
    manual: "Von Hand eintragen",
    manualLabel: "Linie von Hand",
    add: "Hinzufügen",
    next: "Weiter",
    back: "Zurück",
    more: "Weitere Linie",
    apply: "Übernehmen",
    cancel: "Abbrechen",
    remove: (name: string) => `${name} entfernen`,
    description: "Die Suche lässt diese Linien aus. Andere Linien derselben Art bleiben erlaubt.",
  },
  en: {
    field: "Avoid lines",
    choose: "Choose lines",
    change: "Change lines",
    needStops: "Choose a start and a destination first.",
    title: "Avoid lines",
    step: (step: number) => `Step ${step} of 3`,
    kind: "Which kind of transport?",
    line: "Which line?",
    summary: "These lines are avoided:",
    none: "No line is avoided.",
    loading: "Loading lines …",
    failed: "The lines could not be loaded.",
    empty: "No lines were found at the start and destination.",
    manual: "Type it in",
    manualLabel: "Line by hand",
    add: "Add",
    next: "Next",
    back: "Back",
    more: "Another line",
    apply: "Apply",
    cancel: "Cancel",
    remove: (name: string) => `Remove ${name}`,
    description: "The search leaves these lines out. Other lines of the same kind stay allowed.",
  },
} as const;

export function normalizeLine(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function byName(a: string, b: string) {
  return a.localeCompare(b, "de", { numeric: true });
}

function Chip({ name, product }: { name: string; product?: string | null }) {
  return (
    <span
      data-mode={modeOf({ lineName: name, product }) ?? "other"}
      className="mode-fill rounded-md px-2 py-0.5 text-sm font-semibold"
    >
      {name}
    </span>
  );
}

export function AvoidLines({
  language,
  value,
  onChange,
  stopIds,
  loadLines,
}: {
  language: Language;
  value: string[];
  onChange: (lines: string[]) => void;
  stopIds: string[];
  loadLines: (stopIds: string[]) => Promise<LineOption[]>;
}) {
  const text = copy[language];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [draft, setDraft] = useState<string[]>(value);
  const [typed, setTyped] = useState("");
  const [loaded, setLoaded] = useState<{ status: "loading" | "ready" | "failed"; lines: LineOption[] }>({
    status: "loading",
    lines: [],
  });

  const unique = new Map<string, LineOption>();
  for (const line of loaded.lines) {
    const key = normalizeLine(line.name);
    if (key && !unique.has(key)) unique.set(key, { name: key, product: line.product });
  }
  const options = Array.from(unique.values());
  const modes = Array.from(new Set(options.map((line) => modeOf({ lineName: line.name, product: line.product }) ?? "other")));
  const modeOrder: Mode[] = ["suburban", "regional", "subway", "tram", "bus", "ferry", "express", "other"];
  modes.sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b));

  const inChoice = options
    .filter((line) => choice !== "manual" && (modeOf({ lineName: line.name, product: line.product }) ?? "other") === choice)
    .map((line) => line.name)
    .sort(byName);
  const byHand = draft.filter((name) => !unique.has(name)).sort(byName);
  const listed = choice === "manual" ? byHand : [...inChoice, ...byHand.filter((name) => !inChoice.includes(name))];

  function start(next: boolean) {
    setOpen(next);
    if (!next) return;
    setDraft(value);
    setStep(1);
    setChoice(null);
    setTyped("");
    setLoaded({ status: "loading", lines: [] });
    loadLines(stopIds).then(
      (lines) => setLoaded({ status: "ready", lines }),
      () => setLoaded({ status: "failed", lines: [] }),
    );
  }

  function toggle(name: string) {
    setDraft((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  function addTyped() {
    const name = normalizeLine(typed);
    if (!name) return;
    setDraft((current) => (current.includes(name) ? current : [...current, name]));
    setTyped("");
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  const noStops = stopIds.length === 0;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {value.map((name) => (
        <input key={name} type="hidden" name="avoidLines" value={name} />
      ))}
      <span className="font-medium">{text.field}</span>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((name) => (
          <span key={name} className="flex items-center gap-1">
            <Chip name={name} />
            <button
              type="button"
              aria-label={text.remove(name)}
              className="rounded px-1 text-muted-foreground hover:text-foreground"
              onClick={() => onChange(value.filter((item) => item !== name))}
            >
              ×
            </button>
          </span>
        ))}
        <Button type="button" size="sm" variant="outline" disabled={noStops} onClick={() => start(true)}>
          {value.length > 0 ? text.change : text.choose}
        </Button>
      </div>
      {noStops ? <p className="text-muted-foreground">{text.needStops}</p> : null}

      <Dialog open={open} onOpenChange={(next) => (next ? start(true) : setOpen(false))}>
        <DialogContent>
          <DialogHeader>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{text.step(step)}</p>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium">{text.kind}</p>
              {loaded.status === "loading" ? <p className="text-muted-foreground">{text.loading}</p> : null}
              {loaded.status === "failed" ? <p role="alert" className="text-miss">{text.failed}</p> : null}
              {loaded.status === "ready" && modes.length === 0 ? (
                <p className="text-muted-foreground">{text.empty}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {modes.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setChoice(mode);
                      setStep(2);
                    }}
                  >
                    {modeLabel(language, mode)}
                  </Button>
                ))}
                {loaded.status !== "loading" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setChoice("manual");
                      setStep(2);
                    }}
                  >
                    {text.manual}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium">{text.line}</p>
              <div className="flex flex-wrap gap-2">
                {listed.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={draft.includes(name)}
                    data-mode={modeOf({ lineName: name, product: unique.get(name)?.product }) ?? "other"}
                    onClick={() => toggle(name)}
                    className="mode-fill rounded-md px-3 py-1.5 text-sm font-semibold opacity-50 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:opacity-100 aria-pressed:ring-2 aria-pressed:ring-foreground"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                  {text.manualLabel}
                  <Input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTyped();
                      }
                    }}
                  />
                </label>
                <Button type="button" variant="outline" onClick={addTyped}>
                  {text.add}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-3">
              {draft.length > 0 ? (
                <>
                  <p className="font-medium">{text.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {draft.map((name) => (
                      <Chip key={name} name={name} product={unique.get(name)?.product} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">{text.none}</p>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {text.cancel}
            </Button>
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as Step)}>
                {text.back}
              </Button>
            ) : null}
            {step === 2 ? (
              <Button type="button" onClick={() => setStep(3)}>
                {text.next}
              </Button>
            ) : null}
            {step === 3 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setChoice(null);
                    setStep(1);
                  }}
                >
                  {text.more}
                </Button>
                <Button type="button" onClick={apply}>
                  {text.apply}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
