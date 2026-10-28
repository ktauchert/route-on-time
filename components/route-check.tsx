import { checkRoute, chooseConnection, clearConnection } from "@/app/routes/actions";
import { StatusPill, TripProgress } from "@/components/trip-progress";
import { Button } from "@/components/ui/button";
import type { CheckResult, LegView, Suggestion } from "@/lib/check";
import { countedTrip, tripMoment } from "@/lib/moment";
import {
  checkCopy,
  checkedAtLabel,
  clockLabel,
  delayLabel,
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
  const name = leg.walking ? walking : leg.lineName || "";
  const departureDelay = delayLabel(leg.departureDelaySeconds);
  const arrivalDelay = delayLabel(leg.arrivalDelaySeconds);

  return (
    <p className="flex flex-wrap gap-x-2">
      <span>{name}</span>
      <span>
        {clockLabel(leg.departure)}
        {departureDelay ? <span> {departureDelay}</span> : null}
        {" → "}
        {clockLabel(leg.arrival)}
        {arrivalDelay ? <span> {arrivalDelay}</span> : null}
      </span>
      <span>
        {leg.originName} → {leg.destinationName}
      </span>
      {leg.cancelled ? <span>{cancelled}</span> : null}
    </p>
  );
}

function SuggestionLegs({
  suggestion,
  walking,
  transfer,
  cancelled,
}: {
  suggestion: Suggestion;
  walking: string;
  transfer: string;
  cancelled: string;
}) {
  return (
    <>
      {suggestion.legs.map((leg, index) => {
        const previous = suggestion.legs[index - 1];
        const gap = previous ? transferGapMinutes(previous.arrival, leg.departure) : null;
        return (
          <div key={`${leg.departure}-${leg.lineName}-${index}`}>
            {gap ? (
              <p>
                {transfer} {gap} min
              </p>
            ) : null}
            <LegLine leg={leg} walking={walking} cancelled={cancelled} />
          </div>
        );
      })}
    </>
  );
}

export function RouteCheck({
  language,
  routeId,
  check,
  chosenToken,
  saveFailed,
  now,
}: {
  language: Language;
  routeId: string;
  check: CheckResult | null;
  chosenToken: string | null;
  saveFailed: boolean;
  now?: string;
}) {
  const text = checkCopy(language);
  const trip = check
    ? countedTrip(
        { todayRefreshToken: chosenToken, todayServiceDate: check.serviceDate },
        check,
      )
    : null;
  const moment = trip && now ? tripMoment(trip.legs, new Date(now)) : null;

  return (
    <section className="flex flex-col gap-4">
      <form action={checkRoute}>
        <input type="hidden" name="id" value={routeId} />
        <Button type="submit">{text.check}</Button>
      </form>

      {saveFailed ? <p role="alert">{text.saveFailed}</p> : null}

      {check ? (
        <div className="flex flex-col gap-3">
          <p>{serviceDayLabel(language, check.serviceDate)}</p>
          {check.searchFromName ? (
            <p>
              {text.restFrom} {check.searchFromName}
            </p>
          ) : null}
          <p>{checkedAtLabel(language, check.checkedAt)}</p>
          <div className="flex flex-col gap-2">
            <StatusPill language={language} status={check.status} />
            {check.reason ? <p>{text.reason[check.reason]}</p> : null}
            {moment?.progress != null ? <TripProgress language={language} progress={moment.progress} /> : null}
          </div>
          {check.noAlternative ? <p>{text.noAlternative}</p> : null}
          {check.alternative ? (
            <div className="flex flex-col gap-2 rounded-xl border border-foreground/20 bg-card p-3 text-sm">
              <h2 className="text-base font-medium">{text.alternative}</h2>
              {check.alternative.refreshToken === chosenToken ? <p>{text.chosen}</p> : null}
              <SuggestionLegs
                suggestion={check.alternative}
                walking={text.walking}
                transfer={text.transfer}
                cancelled={text.cancelledLeg}
              />
            </div>
          ) : null}
          {chosenToken ? (
            <form action={clearConnection}>
              <input type="hidden" name="id" value={routeId} />
              <Button type="submit" variant="outline">
                {text.clear}
              </Button>
            </form>
          ) : null}
          <ol className="flex flex-col gap-4">
            {check.suggestions.map((suggestion) => {
              const chosen = suggestion.refreshToken === chosenToken;
              return (
                <li key={suggestion.refreshToken || suggestion.legs[0]?.departure} className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-sm">
                  {chosen ? <p>{text.chosen}</p> : null}
                  <SuggestionLegs
                    suggestion={suggestion}
                    walking={text.walking}
                    transfer={text.transfer}
                    cancelled={text.cancelledLeg}
                  />
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
        </div>
      ) : (
        <p>{text.notChecked}</p>
      )}
    </section>
  );
}
