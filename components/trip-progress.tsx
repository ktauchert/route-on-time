import { checkCopy } from "@/lib/check-copy";
import { underwayLabel } from "@/lib/moment";
import type { CheckStatus } from "@/lib/check";
import type { Language } from "@/lib/preferences";

const tone: Record<CheckStatus, string> = {
  fits: "bg-fits/15 text-fits",
  "doesnt-fit": "bg-miss/15 text-miss",
  unclear: "bg-unclear/20 text-unclear",
};

export function StatusPill({ language, status }: { language: Language; status: CheckStatus }) {
  return (
    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${tone[status]}`}>
      {checkCopy(language).status[status]}
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
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{underwayLabel(language)}</span>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={underwayLabel(language)}
      >
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
