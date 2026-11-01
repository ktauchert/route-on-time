/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnRouteMap } from "./on-route-map";
import type { LegView, Suggestion } from "@/lib/check";
import type { BaseMap } from "@/lib/pixel-map";

const row = (text: string) => text.padEnd(60, ".");
const region: BaseMap = {
  id: "region",
  west: 13,
  east: 13.6,
  south: 52.3,
  north: 52.7,
  cols: 60,
  rows: 40,
  grid: Array.from({ length: 40 }, (_, index) => (index === 20 ? row("~~~~~~~~~~") : row("."))),
};

function leg(overrides: Partial<LegView> = {}): LegView {
  return {
    walking: false,
    lineId: null,
    lineName: "S7",
    product: "suburban",
    originId: "a",
    originName: "Potsdam Hbf",
    destinationId: "b",
    destinationName: "Griebnitzsee",
    departure: "2026-10-26T08:00:00+01:00",
    arrival: "2026-10-26T08:20:00+01:00",
    departureDelaySeconds: null,
    arrivalDelaySeconds: null,
    cancelled: false,
    stopovers: [],
    originPoint: [13.1, 52.5],
    destinationPoint: [13.2, 52.5],
    ...overrides,
  };
}

const trip: Suggestion = {
  refreshToken: "t",
  legs: [
    leg(),
    leg({
      lineName: "S2",
      originId: "b",
      originName: "Griebnitzsee",
      destinationId: "c",
      destinationName: "Bernau",
      departure: "2026-10-26T08:30:00+01:00",
      arrival: "2026-10-26T08:50:00+01:00",
      originPoint: [13.2, 52.5],
      destinationPoint: [13.3, 52.6],
    }),
  ],
};

const during = new Date("2026-10-26T08:10:00+01:00");

describe("OnRouteMap", () => {
  afterEach(() => cleanup());

  it("shows a dot for each station and nothing but this route", () => {
    render(<OnRouteMap language="de" trip={trip} maps={[region]} now={during} />);

    expect(screen.getByRole("button", { name: "Potsdam Hbf" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Griebnitzsee" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bernau" })).toBeTruthy();
    expect(screen.getByText(/OpenStreetMap/)).toBeTruthy();
  });

  it("opens a popup with the transfer time on touch, and closes it again", () => {
    render(<OnRouteMap language="de" trip={trip} maps={[region]} now={during} />);

    fireEvent.click(screen.getByRole("button", { name: "Griebnitzsee" }));

    const popup = screen.getByRole("dialog");
    expect(popup.textContent).toContain("Umstieg 10 min");
    expect(popup.textContent).toContain("S7 → S2");
    expect(popup.textContent).toContain("08:20");
    expect(popup.textContent).toContain("08:30");

    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("speaks English too", () => {
    render(<OnRouteMap language="en" trip={trip} maps={[region]} now={during} />);

    fireEvent.click(screen.getByRole("button", { name: "Griebnitzsee" }));

    expect(screen.getByRole("dialog").textContent).toContain("Transfer 10 min");
  });

  it("shows the delay at the end of the trip", () => {
    const late: Suggestion = {
      ...trip,
      legs: [trip.legs[0]!, { ...trip.legs[1]!, arrivalDelaySeconds: 180 }],
    };
    render(<OnRouteMap language="de" trip={late} maps={[region]} now={during} />);

    fireEvent.click(screen.getByRole("button", { name: "Bernau" }));

    expect(screen.getByRole("dialog").textContent).toContain("+3 min");
  });

  it("says so when the trip has no coordinates yet", () => {
    const bare: Suggestion = { refreshToken: "b", legs: [leg({ originPoint: undefined, destinationPoint: undefined })] };
    render(<OnRouteMap language="de" trip={bare} maps={[region]} now={during} />);

    expect(screen.getByText("Noch keine Kartendaten. Die nächste Prüfung bringt sie.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Potsdam Hbf" })).toBeNull();
  });
});
