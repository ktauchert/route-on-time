import { checkRoute, chooseConnection, clearConnection, leaveRoute, loadMoreSuggestions } from "@/app/routes/actions";
import { ConnectionBar, ModeChip } from "@/components/connection-bar";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import { maximumSuggestions, problemDetail, type CheckResult, type LegView, type Suggestion } from "@/lib/check";
import { usesMode } from "@/lib/mode";
import { countedTrip, tripMoment, upcomingLabel } from "@/lib/moment";
import {
  checkCopy,
  checkedAtLabel,
  clockLabel,
  connectionSummary,
  delayLabel,
  differenceLabels,
  failedLabel,
  ageLabel,
  leftAtLabel,
  noPreferredLabel,
  problemSentence,
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

export type RouteLimits = {
  arrival: string;
  transferMinutes: number | null;
  maxTransfers: number | null;
  avoidLines: string[];
};

const noLimits: RouteLimits = { arrival: "", transferMinutes: null, maxTransfers: null, avoidLines: [] };

function ProblemText({
  language,
  suggestion,
  reason,
  limits,
  serviceDate,
}: {
  language: Language;
  suggestion: Suggestion | null;
  reason: CheckResult["reason"];
  limits: RouteLimits;
  serviceDate: string;
}) {
  const detail = suggestion ? problemDetail(suggestion, limits, serviceDate) : null;
  const usable = detail && (!reason || detail.reason === reason) ? detail : null;
  const sentence = usable ? problemSentence(language, usable) : reason ? checkCopy(language).reason[reason] : null;
  if (!sentence) return null;
  return (
    <>
      <p className="font-medium">{sentence}</p>
      {usable?.remarks.map((remark) => (
        <p key={remark} className="text-sm text-muted-foreground">
          {remark}
        </p>
      ))}
    </>
  );
}

function NearestReason({
  language,
  suggestion,
  limits,
  serviceDate,
}: {
  language: Language;
  suggestion: Suggestion;
  limits: RouteLimits;
  serviceDate: string;
}) {
  const detail = problemDetail(suggestion, limits, serviceDate);
  return <>{detail ? problemSentence(language, detail) : null}</>;
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
  limits = noLimits,
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
  limits?: RouteLimits;
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
            <ProblemText
              language={language}
              suggestion={check.connection}
              reason={check.reason}
              limits={limits}
              serviceDate={check.serviceDate}
            />
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
          {check.alternatives.length > 0 ? (
            <h3 className="pt-2 text-base font-semibold tracking-tight">{text.alternatives}</h3>
          ) : null}
          {check.alternatives.map((alternative) => {
            const chosen = alternative.refreshToken === chosenToken;
            const differences = differenceLabels(language, check.connection, alternative);
            return (
              <div
                key={alternative.refreshToken}
                className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 text-sm shadow-xs md:p-5 ${
                  chosen ? "border-signal/50 ring-1 ring-signal/20" : "border-unclear/50 ring-1 ring-unclear/20"
                }`}
              >
                {chosen ? chosenBadge : null}
                <SuggestionHead language={language} suggestion={alternative} />
                {differences.length > 0 ? (
                  <p className="flex flex-wrap gap-2 text-xs font-medium text-unclear">
                    {differences.map((difference) => (
                      <span key={difference} className="rounded-full bg-unclear/10 px-2 py-0.5">
                        {difference}
                      </span>
                    ))}
                  </p>
                ) : null}
                <ConnectionBar language={language} legs={alternative.legs} />
                <SuggestionLegs suggestion={alternative} summary={text.legsSummary} {...legs} />
                {!chosen && alternative.refreshToken ? (
                  <form action={chooseConnection}>
                    <input type="hidden" name="id" value={routeId} />
                    <input type="hidden" name="refreshToken" value={alternative.refreshToken} />
                    <input type="hidden" name="serviceDate" value={check.serviceDate} />
                    <Button type="submit" size="sm" variant="outline">
                      {text.choose}
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}
          {check.nearest ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-miss/40 bg-card p-4 text-sm shadow-xs md:p-5">
              <h3 className="text-xs font-semibold tracking-widest text-miss uppercase">{text.nearest}</h3>
              <SuggestionHead language={language} suggestion={check.nearest} />
              <p className="font-medium text-miss">
                {text.nearestNote}{" "}
                <NearestReason
                  language={language}
                  suggestion={check.nearest}
                  limits={limits}
                  serviceDate={check.serviceDate}
                />
              </p>
              <ConnectionBar language={language} legs={check.nearest.legs} />
              <SuggestionLegs suggestion={check.nearest} summary={text.legsSummary} {...legs} />
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
          {check.suggestions.length > 0 && check.suggestions.length < maximumSuggestions ? (
            <form action={loadMoreSuggestions}>
              <input type="hidden" name="id" value={routeId} />
              <Button type="submit" variant="outline">
                {text.more}
              </Button>
            </form>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
