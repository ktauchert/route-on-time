/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeleteRoute } from "./delete-route";
import { QuickStart } from "./quick-start";
import { RouteForm } from "./route-form";
import { RouteIndex } from "./route-index";
import type { StoredRoute } from "@/lib/route";

describe("DeleteRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks before deleting", () => {
    render(<DeleteRoute id="1" language="de" />);

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    expect(screen.getByText("Diese Route löschen?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wirklich löschen" })).toBeTruthy();
  });
});

describe("QuickStart", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers a new route and only the routes passed in", () => {
    render(
      <QuickStart
        language="de"
        routes={[{ id: "1", name: null, startName: "Alex", destinationName: "Zoo", weekdays: ["mon"] }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Schnellstart" }));

    expect(screen.getByRole("link", { name: "Neue Route" }).getAttribute("href")).toBe(
      "/routes/new",
    );
    const today = screen.getByRole("button", { name: "Alex → Zoo" });
    expect(today.closest("form")?.querySelector("input[name=id]")?.getAttribute("value")).toBe("1");
    expect(screen.getByRole("button", { name: "Schnellstart" }).parentElement?.className).toContain(
      "md:hidden",
    );
  });
});

const route: StoredRoute = {
  id: "1",
  name: "zur Arbeit",
  startId: "a",
  startName: "Alex",
  destinationId: "b",
  destinationName: "Zoo",
  arrival: "09:00",
  weekdays: ["mon"],
  transferMinutes: null,
  maxTransfers: null,
  lineId: null,
  lineName: null,
  todayRefreshToken: null,
  todayServiceDate: null,
};

describe("RouteIndex", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the minutes until departure that were known when the page loaded", () => {
    render(
      <RouteIndex
        language="de"
        routes={[route]}
        today={[]}
        missingTable={false}
        glances={{ "1": { status: "fits", upcomingMinutes: 25, progress: null } }}
      />,
    );

    expect(screen.getByText("Abfahrt in 25 min")).toBeTruthy();
    expect(screen.getByText("passt")).toBeTruthy();
    expect(screen.getByText("Ankunft 09:00")).toBeTruthy();
  });
});

describe("RouteForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("cancels an edit back to the route index", () => {
    render(<RouteForm language="de" route={route} failed={false} />);

    expect(screen.getByRole("link", { name: "Abbrechen" }).getAttribute("href")).toBe("/routes");
    expect(screen.getByRole("button", { name: "Speichern" }).getAttribute("data-size")).toBe("sm");
    expect(screen.getByRole("button", { name: "Löschen" }).getAttribute("data-size")).toBe("sm");
  });
});
