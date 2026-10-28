/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("S7")).toBeTruthy();
    expect(screen.getByText(/S\+U Alexanderplatz → S\+U Zoologischer Garten/)).toBeTruthy();
    expect(screen.getByText(/\+2 min/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Als heutige Verbindung" })).toBeTruthy();
  });

  it("uses the English status words", () => {
    render(
      <RouteCheck language="en" routeId="1" check={fitting} chosenToken={null} saveFailed={false} />,
    );

    expect(screen.getByRole("button", { name: "Check now" })).toBeTruthy();
    expect(screen.getByText("Fits")).toBeTruthy();
    expect(screen.getByText("Walk")).toBeTruthy();
    expect(screen.getByText("S7")).toBeTruthy();
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
    expect(screen.getByText("RE1")).toBeTruthy();
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

  it("says when a check could not be saved", () => {
    render(
      <RouteCheck language="de" routeId="1" check={fitting} chosenToken={null} saveFailed />,
    );

    expect(screen.getByRole("alert").textContent).toContain("nicht gespeichert");
  });
});
