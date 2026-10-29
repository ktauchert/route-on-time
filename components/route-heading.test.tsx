/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RouteHeading } from "./route-heading";
import type { StoredRoute } from "@/lib/route";

const route: StoredRoute = {
  id: "1",
  name: "zur Arbeit",
  startId: "a",
  startName: "Alex",
  destinationId: "b",
  destinationName: "Zoo",
  arrival: "09:00",
  weekdays: ["mon", "tue", "wed", "thu", "fri"],
  transferMinutes: null,
  maxTransfers: null,
  lineId: null,
  lineName: null,
  todayRefreshToken: null,
  todayServiceDate: null,
  leftAt: null,
};

describe("RouteHeading", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the route with its way, arrival and weekdays, and leads back to the list", () => {
    render(<RouteHeading language="de" route={route} />);

    expect(screen.getByRole("link", { name: "← Routen" }).getAttribute("href")).toBe("/routes");
    expect(screen.getByRole("heading", { level: 2, name: "zur Arbeit" })).toBeTruthy();
    expect(screen.getByText("Alex → Zoo · Ankunft 09:00 · Mo–Fr")).toBeTruthy();
  });

  it("names the leave button instead of an arrival", () => {
    render(<RouteHeading language="de" route={{ ...route, arrival: "" }} />);

    expect(screen.getByText("Alex → Zoo · Aufbruch per Knopf · Mo–Fr")).toBeTruthy();
  });

  it("calls an unsaved route new", () => {
    render(<RouteHeading language="en" route={null} />);

    expect(screen.getByRole("link", { name: "← Routes" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "New route" })).toBeTruthy();
  });
});
