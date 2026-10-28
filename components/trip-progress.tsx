import { checkCopy } from "@/lib/check-copy";
import { underwayLabel } from "@/lib/moment";
import type { CheckStatus } from "@/lib/check";
import type { Language } from "@/lib/preferences";

const tone: Record<CheckStatus, string> = {
  fits: "bg-fits/15 text-fits",
  "doesnt-fit": "bg-miss/15 text-miss",
  unclear: "bg-unclear/20 text-unclear",
};

const dot: Record<CheckStatus, string> = {
  fits: "bg-fits",
  "doesnt-fit": "bg-miss",
  unclear: "bg-unclear",
};

export function StatusPill({
  language,
  status,
  large = false,
}: {
  language: Language;
  status: CheckStatus;
  large?: boolean;
}) {
  const size = large ? "gap-2 px-3 py-1 text-sm" : "gap-1.5 px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex w-fit shrink-0 items-center rounded-full font-medium ${size} ${tone[status]}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot[status]}`} />
      <span>{checkCopy(language).status[status]}</span>
    </span>
  );
}

export function TripProgress({
  language,
  progress,
}: {
  language: Language;
  progress: number;
}) {
  const value = Math.round(progress * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-signal">{underwayLabel(language)}</span>
        <span aria-hidden className="text-muted-foreground tabular-nums">
          {value} %
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={underwayLabel(language)}
      >
        <div className="h-full rounded-full bg-signal" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
