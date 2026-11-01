/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnRouteView } from "./on-route-view";
import type { Suggestion } from "@/lib/check";
import type { BaseMap } from "@/lib/pixel-map";

const region: BaseMap = {
  id: "region",
  west: 13,
  east: 13.6,
  south: 52.3,
  north: 52.7,
  cols: 60,
  rows: 40,
  grid: Array.from({ length: 40 }, () => ".".repeat(60)),
};

const trip: Suggestion = {
  refreshToken: "t",
  legs: [
    {
      walking: false,
      lineId: null,
      lineName: "S7",
      product: "suburban",
      originId: "a",
      originName: "Potsdam Hbf",
      destinationId: "b",
      destinationName: "Bernau",
      departure: "2026-10-26T08:00:00+01:00",
      arrival: "2026-10-26T09:00:00+01:00",
      departureDelaySeconds: null,
      arrivalDelaySeconds: null,
      cancelled: false,
      stopovers: [],
      originPoint: [13.1, 52.5],
      destinationPoint: [13.3, 52.6],
    },
  ],
};

function view(now: string, language: "de" | "en" = "de") {
  return render(
    <OnRouteView
      language={language}
      name="Büro → Zuhause"
      status="fits"
      trip={trip}
      maps={[region]}
      now={now}
      routeId="r1"
    />,
  );
}

describe("OnRouteView", () => {
  afterEach(() => cleanup());

  it("puts the name of the route on top", () => {
    view("2026-10-26T08:30:00+01:00");

    expect(screen.getByRole("heading", { name: "Büro → Zuhause" })).toBeTruthy();
  });

  it("counts the minutes left and fills the bar while underway", () => {
    view("2026-10-26T08:30:00+01:00");

    expect(screen.getByText("Noch 30 min")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
  });

  it("counts down to the departure before the trip starts", () => {
    view("2026-10-26T07:48:00+01:00");

    expect(screen.getByText("Abfahrt in 12 min")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("speaks English", () => {
    view("2026-10-26T08:30:00+01:00", "en");

    expect(screen.getByText("30 min left")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mode off" })).toBeTruthy();
  });

  it("can switch the mode off and go back to the route", () => {
    view("2026-10-26T08:30:00+01:00");

    expect(screen.getByRole("button", { name: "Modus aus" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Zur Route" }).getAttribute("href")).toBe("/routes/r1");
  });
});
