/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RouteCheck } from "./route-check";
import type { CheckResult } from "@/lib/check";

const fitting: CheckResult = {
  serviceDate: "2026-10-26",
  status: "fits",
  reason: null,
  checkedAt: "2026-10-26T06:00:00.000Z",
  connection: { refreshToken: "on-time", legs: [] },
  alternative: null,
  noAlternative: false,
  searched: true,
  searchFromName: null,
  suggestions: [
    {
      refreshToken: "on-time",
      legs: [
        {
          walking: true,
          lineId: null,
          lineName: null,
          originId: null,
          originName: "S+U Alexanderplatz",
          destinationId: null,
          destinationName: "S+U Alexanderplatz",
          stopovers: [],
          departure: "2026-10-26T08:02:00+01:00",
          arrival: "2026-10-26T08:08:00+01:00",
          departureDelaySeconds: null,
          arrivalDelaySeconds: null,
          cancelled: false,
        },
        {
          walking: false,
          lineId: "line-s7",
          lineName: "S7",
          originId: null,
          originName: "S+U Alexanderplatz",
          destinationId: null,
          destinationName: "S+U Zoologischer Garten",
          stopovers: [],
          departure: "2026-10-26T08:10:00+01:00",
          arrival: "2026-10-26T08:50:00+01:00",
          departureDelaySeconds: 120,
          arrivalDelaySeconds: null,
          cancelled: false,
        },
      ],
    },
  ],
};

describe("RouteCheck", () => {
  afterEach(() => {
    cleanup();
  });

  it("checks from a button and shows the suggestions with the stand", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.getByRole("button", { name: "Jetzt prüfen" })).toBeTruthy();
    expect(screen.getByText("passt")).toBeTruthy();
    expect(screen.getByText("Geprüft um 07:00")).toBeTruthy();
    expect(screen.getByText(/Montag/)).toBeTruthy();
    expect(screen.getByText("Fußweg")).toBeTruthy();
    expect(screen.getAllByText("S7")).toHaveLength(2);
    expect(screen.getByText(/S\+U Alexanderplatz → S\+U Zoologischer Garten/)).toBeTruthy();
    expect(screen.getByText(/\+2 min/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Als heutige Verbindung" })).toBeTruthy();
    expect(screen.getByText("08:02 → 08:50")).toBeTruthy();
    expect(screen.getByText("48 min · direkt")).toBeTruthy();
  });

  it("uses the English status words", () => {
    render(
      <RouteCheck language="en" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.getByRole("button", { name: "Check now" })).toBeTruthy();
    expect(screen.getByText("Fits")).toBeTruthy();
    expect(screen.getByText("Walk")).toBeTruthy();
    expect(screen.getAllByText("S7")).toHaveLength(2);
  });

  it("shows the bar first and folds the legs away", () => {
    const { container } = render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(1);
    const details = container.querySelector("details");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toBe("Abschnitte");
    expect(details?.textContent).toContain("S+U Alexanderplatz → S+U Zoologischer Garten");
  });

  it("colors the line chip by its mode", () => {
    const { container } = render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    const chips = Array.from(container.querySelectorAll("details [data-mode]"));
    expect(chips.map((chip) => chip.getAttribute("data-mode"))).toEqual(["suburban"]);
  });

  it("says when no fitting connection has the preferred mode", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        preferredMode="regional"
      />,
    );

    expect(screen.getByText("Keine passende Verbindung mit Regionalbahn.")).toBeTruthy();
  });

  it("stays quiet when the connection has the preferred mode", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        preferredMode="suburban"
      />,
    );

    expect(screen.queryByText(/Keine passende Verbindung mit/)).toBeNull();
  });

  it("names the lines it leaves out", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        avoidLines={["S7", "RE1"]}
      />,
    );

    const avoided = within(screen.getByText("Gemieden:").closest("p")!);
    expect(avoided.getByText("S7").getAttribute("data-mode")).toBe("suburban");
    expect(avoided.getByText("RE1").getAttribute("data-mode")).toBe("regional");
  });

  it("says nothing about avoided lines when there are none", () => {
    render(<RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />);

    expect(screen.queryByText("Gemieden:")).toBeNull();
  });

  it("explains an avoided line as the reason", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, status: "doesnt-fit", reason: "avoided" }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("Die Verbindung nutzt eine Linie, die du meiden willst.")).toBeTruthy();
  });

  it("leads with the leave button for a route that was not left yet", () => {
    render(
      <RouteCheck language="de" routeId="1" check={null} chosenToken={null} saveFailed={false} leave leftAt={null} />,
    );

    expect(screen.getByRole("button", { name: "Ich verlasse das Büro" }).getAttribute("data-variant")).toBe("default");
    expect(screen.queryByRole("button", { name: "Jetzt prüfen" })).toBeNull();
    expect(screen.getByText("Noch nicht aufgebrochen.")).toBeTruthy();
  });

  it("shows when the person left and keeps the check button once they did", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        leave
        leftAt="2026-10-26T16:12:00.000Z"
      />,
    );

    expect(screen.getByText("Aufbruch um 17:12")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jetzt prüfen" }).getAttribute("data-variant")).toBe("default");
    expect(screen.getByRole("button", { name: "Ich verlasse das Büro" }).getAttribute("data-variant")).toBe("outline");
  });

  it("has no leave button on an arrival route", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.queryByRole("button", { name: "Ich verlasse das Büro" })).toBeNull();
  });

  it("shows how old the stand is when the time is known", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        now="2026-10-26T06:03:00.000Z"
      />,
    );

    expect(screen.getByText("Geprüft um 07:00")).toBeTruthy();
    expect(screen.getByText("vor 3 min")).toBeTruthy();
  });

  it("keeps the last stand and says that a newer check failed", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, failedAt: "2026-10-26T06:30:00.000Z" }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("passt")).toBeTruthy();
    expect(screen.getByText("Die Prüfung um 07:30 hat nicht geklappt. Der Stand ist älter.")).toBeTruthy();
    expect(screen.getByText("08:02 → 08:50")).toBeTruthy();
  });

  it("shows no failure note for a clean stand", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.queryByText(/hat nicht geklappt/)).toBeNull();
  });

  it("shows the empty sentence and not the failure sentence", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, status: "doesnt-fit", reason: "empty", connection: null, suggestions: [] }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("passt nicht")).toBeTruthy();
    expect(screen.getByText("Für diese Ankunft gibt es keine Verbindung.")).toBeTruthy();
    expect(screen.queryByText("Die Auskunft ist nicht erreichbar.")).toBeNull();
  });

  it("shows an unreachable auskunft as unclear", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, status: "unclear", reason: "no-answer", connection: null, suggestions: [] }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("unklar")).toBeTruthy();
    expect(screen.getByText("Die Auskunft ist nicht erreichbar.")).toBeTruthy();
  });

  it("marks the chosen connection and can clear it", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken="on-time" saveFailed={false} />,
    );

    expect(screen.getByText("Heutige Verbindung")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wahl aufheben" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Als heutige Verbindung" })).toBeNull();
  });

  it("shows an alternative from the further search", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{
          ...fitting,
          alternative: {
            refreshToken: "alt",
            legs: [
              {
                walking: false,
                lineId: "line-re1",
                lineName: "RE1",
                originId: null,
                originName: "S+U Alexanderplatz",
                destinationId: null,
                destinationName: "S Bernau Bhf",
                stopovers: [],
                departure: "2026-10-26T07:40:00+01:00",
                arrival: "2026-10-26T08:40:00+01:00",
                departureDelaySeconds: null,
                arrivalDelaySeconds: null,
                cancelled: false,
              },
            ],
          },
        }}
        chosenToken="alt"
        saveFailed={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alternative" })).toBeTruthy();
    expect(screen.getAllByText("RE1").length).toBeGreaterThan(0);
    expect(screen.getByText(/S Bernau Bhf/)).toBeTruthy();
  });

  it("says when the further search has no alternative", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, status: "doesnt-fit", reason: "arrival", noAlternative: true }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("Es gibt keine Alternative.")).toBeTruthy();
  });

  it("does not use the no-alternative sentence for an empty list", () => {
    render(
      <RouteCheck
        language="en"
        routeId="1"
        check={{ ...fitting, status: "doesnt-fit", reason: "empty", connection: null, suggestions: [] }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("There is no connection for this arrival.")).toBeTruthy();
    expect(screen.queryByText("There is no alternative.")).toBeNull();
  });

  it("names the stop where the rest of the trip starts", () => {
    const { rerender } = render(
      <RouteCheck
        language="de"
        routeId="1"
        check={{ ...fitting, searchFromName: "S Griebnitzsee" }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("Restweg ab S Griebnitzsee")).toBeTruthy();

    rerender(
      <RouteCheck
        language="en"
        routeId="1"
        check={{ ...fitting, searchFromName: "S Griebnitzsee" }}
        chosenToken={null}
        saveFailed={false}
      />,
    );

    expect(screen.getByText("Rest of the trip from S Griebnitzsee")).toBeTruthy();
  });

  it("shows how far an underway connection has got", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        now="2026-10-26T07:26:00.000Z"
      />,
    );

    expect(screen.getByRole("progressbar", { name: "Unterwegs" }).getAttribute("aria-valuenow")).toBe(
      "50",
    );
  });

  it("names the minutes until the connection departs when it has not started", () => {
    render(
      <RouteCheck
        language="de"
        routeId="1"
        check={fitting}
        chosenToken={null}
        saveFailed={false}
        now="2026-10-26T06:50:00.000Z"
      />,
    );

    expect(screen.getByText("Abfahrt in 12 min")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("says when a check could not be saved", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed />,
    );

    expect(screen.getByRole("alert").textContent).toContain("nicht gespeichert");
  });
});
