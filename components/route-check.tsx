import { checkRoute, chooseConnection, clearConnection } from "@/app/routes/actions";
import { Button } from "@/components/ui/button";
import type { CheckResult, LegView } from "@/lib/check";
import {
  checkCopy,
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

export function RouteCheck({
  language,
  routeId,
  check,
  chosenToken,
  saveFailed,
}: {
  language: Language;
  routeId: string;
  check: CheckResult | null;
  chosenToken: string | null;
  saveFailed: boolean;
}) {
  const text = checkCopy(language);

  return (
    <section className="flex flex-col gap-4">
      <form action={checkRoute}>
        <input type="hidden" name="id" value={routeId} />
        <Button type="submit">{text.check}</Button>
      </form>

      {saveFailed ? <p role="alert">{text.saveFailed}</p> : null}

      {check ? (
        <div className="flex flex-col gap-3">
          <p>
            {serviceDayLabel(language, check.serviceDate)}
          </p>
          <p role="status">
            <span>{text.status[check.status]}</span>
            {check.reason ? <span> {text.reason[check.reason]}</span> : null}
          </p>
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
                <li key={suggestion.refreshToken || suggestion.legs[0]?.departure} className="flex flex-col gap-1 text-sm">
                  {chosen ? <p>{text.chosen}</p> : null}
                  {suggestion.legs.map((leg, index) => {
                    const previous = suggestion.legs[index - 1];
                    const gap = previous ? transferGapMinutes(previous.arrival, leg.departure) : null;
                    return (
                      <div key={`${leg.departure}-${leg.lineName}-${index}`}>
                        {gap ? (
                          <p>
                            {text.transfer} {gap} min
                          </p>
                        ) : null}
                        <LegLine leg={leg} walking={text.walking} cancelled={text.cancelledLeg} />
                      </div>
                    );
                  })}
                  {!chosen && suggestion.refreshToken ? (
                    <form action={chooseConnection}>
                      <input type="hidden" name="id" value={routeId} />
                      <input type="hidden" name="refreshToken" value={suggestion.refreshToken} />
                      <input type="hidden" name="serviceDate" value={check.serviceDate} />
                      <Button type="submit" variant="outline">
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
