import { checkRoute, chooseConnection, clearConnection, leaveRoute } from "@/app/routes/actions";
import { ConnectionBar, ModeChip } from "@/components/connection-bar";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import type { CheckResult, LegView, Suggestion } from "@/lib/check";
import { usesMode } from "@/lib/mode";
import { countedTrip, tripMoment, upcomingLabel } from "@/lib/moment";
import {
  checkCopy,
  checkedAtLabel,
  clockLabel,
  connectionSummary,
  delayLabel,
  failedLabel,
  ageLabel,
  leftAtLabel,
  noPreferredLabel,
  serviceDayLabel,
  transferGapMinutes,
} from "@/lib/check-copy";
import type { Language } from "@/lib/preferences";

function LegLine({
  leg,
  walking,
  cancelled,
}: {
  leg: LegView;
  walking: string;
  cancelled: string;
}) {
  const departureDelay = delayLabel(leg.departureDelaySeconds);
  const arrivalDelay = delayLabel(leg.arrivalDelaySeconds);

  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {leg.walking ? (
          <span className="text-muted-foreground">{walking}</span>
        ) : (
          <ModeChip leg={leg} />
        )}
        <span className="tabular-nums">
          {clockLabel(leg.departure)}
          {departureDelay ? <span className="font-medium text-miss"> {departureDelay}</span> : null}
          {" → "}
          {clockLabel(leg.arrival)}
          {arrivalDelay ? <span className="font-medium text-miss"> {arrivalDelay}</span> : null}
        </span>
        {leg.cancelled ? (
          <span className="rounded-full bg-miss/15 px-2 py-0.5 text-xs font-medium text-miss">{cancelled}</span>
        ) : null}
      </p>
      <p className="text-muted-foreground">
        {leg.originName} → {leg.destinationName}
      </p>
    </div>
  );
}

function SuggestionLegs({
  suggestion,
  summary,
  walking,
  transfer,
  cancelled,
}: {
  suggestion: Suggestion;
  summary: string;
  walking: string;
  transfer: string;
  cancelled: string;
}) {
  return (
    <details className="group">
      <summary className="w-fit cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
        {summary}
      </summary>
      <ol className="mt-3 flex flex-col gap-2 border-l-2 border-border pl-3">
      {suggestion.legs.map((leg, index) => {
        const previous = suggestion.legs[index - 1];
        const gap = previous ? transferGapMinutes(previous.arrival, leg.departure) : null;
        return (
          <li key={`${leg.departure}-${leg.lineName}-${index}`} className="flex flex-col gap-2">
            {gap ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {transfer} {gap} min
              </p>
            ) : null}
            <LegLine leg={leg} walking={walking} cancelled={cancelled} />
          </li>
        );
      })}
      </ol>
    </details>
  );
}

function SuggestionHead({ language, suggestion }: { language: Language; suggestion: Suggestion }) {
  const summary = connectionSummary(language, suggestion.legs);
  if (!summary) return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <p className="text-lg font-semibold tabular-nums">
        {summary.departure} → {summary.arrival}
      </p>
      <p className="text-sm text-muted-foreground tabular-nums">
        {summary.duration} · {summary.transfers}
      </p>
    </div>
  );
}

export function RouteCheck({
  language,
  routeId,
  check,
  chosenToken,
  saveFailed,
  now,
  leave = false,
  leftAt = null,
  preferredMode = null,
  avoidLines = [],
}: {
  language: Language;
  routeId: string;
  check: CheckResult | null;
  chosenToken: string | null;
  saveFailed: boolean;
  now?: string;
  leave?: boolean;
  leftAt?: string | null;
  preferredMode?: string | null;
  avoidLines?: string[];
}) {
  const text = checkCopy(language);
  const trip = check
    ? countedTrip(
        { todayRefreshToken: chosenToken, todayServiceDate: check.serviceDate },
        check,
      )
    : null;
  const moment = trip && now ? tripMoment(trip.legs, new Date(now)) : null;
  const legs = { walking: text.walking, transfer: text.transfer, cancelled: text.cancelledLeg };
  const chosenBadge = (
    <p className="text-xs font-semibold tracking-widest text-signal uppercase">{text.chosen}</p>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs md:p-5">
        <div className="flex items-center justify-between gap-3">
          {check ? (
            <StatusPill language={language} status={check.status} large />
          ) : (
            <p className="text-sm text-muted-foreground">{leave ? text.notLeft : text.notChecked}</p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {leave ? (
              <form action={leaveRoute}>
                <input type="hidden" name="id" value={routeId} />
                <Button type="submit" variant={leftAt ? "outline" : "default"}>
                  {text.leave}
                </Button>
              </form>
            ) : null}
            {!leave || leftAt ? (
              <form action={checkRoute}>
                <input type="hidden" name="id" value={routeId} />
                <Button type="submit">{text.check}</Button>
              </form>
            ) : null}
          </div>
        </div>

        {avoidLines.length > 0 ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{text.avoiding}</span>
            {avoidLines.map((name) => (
              <ModeChip key={name} leg={{ lineName: name }} />
            ))}
          </p>
        ) : null}

        {leave && leftAt ? <p className="text-sm font-medium tabular-nums">{leftAtLabel(language, leftAt)}</p> : null}

        {saveFailed ? (
          <p role="alert" className="rounded-xl border border-miss/30 bg-miss/10 p-3 text-sm text-miss">
            {text.saveFailed}
          </p>
        ) : null}

        {check ? (
          <>
            {check.reason ? <p className="font-medium">{text.reason[check.reason]}</p> : null}
            {preferredMode && trip && check.status === "fits" && !usesMode(trip.legs, preferredMode) ? (
              <p className="text-sm text-muted-foreground">{noPreferredLabel(language, preferredMode)}</p>
            ) : null}
            {moment?.progress != null ? <TripProgress language={language} progress={moment.progress} /> : null}
            {moment?.upcomingMinutes != null ? (
              <p className="text-sm font-medium text-signal tabular-nums">
                {upcomingLabel(language, moment.upcomingMinutes)}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              <p>{serviceDayLabel(language, check.serviceDate)}</p>
              {check.searchFromName ? (
                <p>
                  {text.restFrom} {check.searchFromName}
                </p>
              ) : null}
              <p className="tabular-nums">{checkedAtLabel(language, check.checkedAt)}</p>
              {now ? <p className="tabular-nums">{ageLabel(language, check.checkedAt, new Date(now))}</p> : null}
            </div>
            {check.failedAt ? (
              <p role="status" className="rounded-xl border border-unclear/30 bg-unclear/10 p-3 text-sm text-unclear">
                {failedLabel(language, check.failedAt)}
              </p>
            ) : null}
            {chosenToken ? (
              <form action={clearConnection}>
                <input type="hidden" name="id" value={routeId} />
                <Button type="submit" size="sm" variant="outline">
                  {text.clear}
                </Button>
              </form>
            ) : null}
          </>
        ) : null}
      </div>

      {check ? (
        <>
          {check.noAlternative ? <p className="text-sm text-muted-foreground">{text.noAlternative}</p> : null}
          {check.alternative ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-unclear/50 bg-card p-4 text-sm shadow-xs ring-1 ring-unclear/20 md:p-5">
              <h3 className="text-xs font-semibold tracking-widest text-unclear uppercase">{text.alternative}</h3>
              {check.alternative.refreshToken === chosenToken ? chosenBadge : null}
              <SuggestionHead language={language} suggestion={check.alternative} />
              <ConnectionBar language={language} legs={check.alternative.legs} />
              <SuggestionLegs suggestion={check.alternative} summary={text.legsSummary} {...legs} />
            </div>
          ) : null}
          {check.suggestions.length > 0 ? (
            <h3 className="pt-2 text-base font-semibold tracking-tight">{text.suggestions}</h3>
          ) : null}
          <ol className="flex flex-col gap-3">
            {check.suggestions.map((suggestion) => {
              const chosen = suggestion.refreshToken === chosenToken;
              return (
                <li
                  key={suggestion.refreshToken || suggestion.legs[0]?.departure}
                  className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 text-sm shadow-xs md:p-5 ${
                    chosen ? "border-signal/50 ring-1 ring-signal/20" : ""
                  }`}
                >
                  {chosen ? chosenBadge : null}
                  <SuggestionHead language={language} suggestion={suggestion} />
                  <ConnectionBar language={language} legs={suggestion.legs} />
                  <SuggestionLegs suggestion={suggestion} summary={text.legsSummary} {...legs} />
                  {!chosen && suggestion.refreshToken ? (
                    <form action={chooseConnection}>
                      <input type="hidden" name="id" value={routeId} />
                      <input type="hidden" name="refreshToken" value={suggestion.refreshToken} />
                      <input type="hidden" name="serviceDate" value={check.serviceDate} />
                      <Button type="submit" size="sm" variant="outline">
                        {text.choose}
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
    </section>
  );
}
