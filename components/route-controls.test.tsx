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

  it("keeps the route when the question is declined", () => {
    render(<DeleteRoute id="1" language="de" />);

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Behalten" }));

    expect(screen.queryByText("Diese Route löschen?")).toBeNull();
    expect(screen.getByRole("button", { name: "Löschen" })).toBeTruthy();
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
  preferredMode: null,
  relaxed: false,
  avoidLines: [],
  todayRefreshToken: null,
  todayServiceDate: null,
  leftAt: null,
};

describe("RouteIndex for a leave route", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the leave button where the arrival would be", () => {
    render(
      <RouteIndex
        language="de"
        routes={[{ ...route, arrival: "" }]}
        today={[]}
        missingTable={false}
        glances={{}}
      />,
    );

    expect(screen.getByText("Aufbruch per Knopf")).toBeTruthy();
    expect(screen.queryByText(/Ankunft/)).toBeNull();
  });
});

describe("RouteIndex preferences", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the preferred mode on the card", () => {
    render(
      <RouteIndex
        language="de"
        routes={[{ ...route, preferredMode: "regional" }]}
        today={[]}
        missingTable={false}
        glances={{}}
      />,
    );

    expect(screen.getByText("Regionalbahn")).toBeTruthy();
  });
});

describe("QuickStart for a leave route", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers leaving instead of a plain check", () => {
    render(
      <QuickStart
        language="de"
        routes={[
          { id: "1", name: null, startName: "Büro", destinationName: "Zuhause", weekdays: ["mon"], leave: true },
          { id: "2", name: null, startName: "Alex", destinationName: "Zoo", weekdays: ["mon"] },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Schnellstart" }));

    expect(screen.getByRole("button", { name: "Ich verlasse das Büro · Büro → Zuhause" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Alex → Zoo" })).toBeTruthy();
  });
});

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

    expect(screen.getByRole("heading", { level: 2, name: "Routen" })).toBeTruthy();
    expect(screen.getByText("Abfahrt in 25 min")).toBeTruthy();
    expect(screen.getByText("passt")).toBeTruthy();
    expect(screen.getByText("Ankunft 09:00")).toBeTruthy();
    expect(screen.getByText("Mo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "zur Arbeit" }).getAttribute("href")).toBe("/routes/1");
  });

  it("marks the route whose departure comes next", () => {
    render(
      <RouteIndex
        language="de"
        routes={[route, { ...route, id: "2", name: "Heimweg" }]}
        today={[]}
        missingTable={false}
        glances={{
          "1": { status: "fits", upcomingMinutes: 40, progress: null },
          "2": { status: "fits", upcomingMinutes: 12, progress: null },
        }}
      />,
    );

    const marked = screen.getByText("Nächste Abfahrt").closest("li")!;
    expect(marked.textContent).toContain("Heimweg");
    expect(marked.getAttribute("data-next")).toBe("true");
    expect(screen.getAllByText("Nächste Abfahrt")).toHaveLength(1);
  });

  it("leads from an empty list to a new route on every screen", () => {
    render(<RouteIndex language="de" routes={[]} today={[]} missingTable={false} glances={{}} />);

    expect(screen.getByText("Noch keine Route.")).toBeTruthy();
    const links = screen.getAllByRole("link", { name: "Neue Route" });
    const always = links.find((link) => !link.className.includes("hidden"));
    expect(always?.getAttribute("href")).toBe("/routes/new");
  });

  it("keeps deleting quiet in the list", () => {
    render(<RouteIndex language="de" routes={[route]} today={[]} missingTable={false} glances={{}} />);

    const remove = screen.getByRole("button", { name: "Löschen" });
    expect(remove.getAttribute("data-variant")).toBe("ghost");
  });
});

describe("RouteForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("cancels an edit back to the route index", () => {
    render(<RouteForm language="de" route={route} failed={false} />);

    expect(screen.getByRole("link", { name: "Abbrechen" }).getAttribute("href")).toBe("/routes");
    const save = screen.getByRole("button", { name: "Speichern" });
    expect(screen.getByRole("button", { name: "Löschen" }).getAttribute("data-size")).toBe(
      save.getAttribute("data-size"),
    );
    expect(screen.getByRole("button", { name: "Löschen" }).getAttribute("data-variant")).toBe("ghost");
    expect(screen.getByRole("button", { name: "Speichern" }).getAttribute("data-variant")).toBe("outline");
  });

  it("saves, or saves and checks right away", () => {
    render(<RouteForm language="de" route={route} failed={false} />);

    const both = screen.getByRole("button", { name: "Speichern und prüfen" });
    expect(both.getAttribute("type")).toBe("submit");
    expect(both.getAttribute("name")).toBe("then");
    expect(both.getAttribute("value")).toBe("check");
    expect(both.getAttribute("data-variant")).toBe("default");
    expect(screen.getByRole("button", { name: "Speichern" }).getAttribute("name")).toBeNull();
  });

  it("does not offer a check for a route that starts with the leave button", () => {
    render(<RouteForm language="de" route={{ ...route, arrival: "" }} failed={false} />);

    expect(screen.queryByRole("button", { name: "Speichern und prüfen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Speichern" }).getAttribute("data-variant")).toBe("default");
  });

  it("asks for a preferred mode of transport instead of a line", () => {
    render(<RouteForm language="de" route={{ ...route, preferredMode: "regional" }} failed={false} />);

    const select = screen.getByRole("combobox", { name: "Bevorzugtes Verkehrsmittel" }) as HTMLSelectElement;
    expect(select.value).toBe("regional");
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual([
      "Keine Vorliebe",
      "S-Bahn",
      "Regionalbahn",
      "U-Bahn",
      "Tram",
      "Bus",
    ]);
    expect(screen.queryByRole("button", { name: "Linien am Start" })).toBeNull();
  });

  it("starts without a preferred mode", () => {
    render(<RouteForm language="de" route={null} failed={false} />);

    expect((screen.getByRole("combobox", { name: "Bevorzugtes Verkehrsmittel" }) as HTMLSelectElement).value).toBe("");
  });

  it("offers to avoid lines, with the chosen ones shown and sent with the form", () => {
    render(<RouteForm language="de" route={{ ...route, avoidLines: ["S7"] }} failed={false} />);

    expect(screen.getByText("Linien meiden")).toBeTruthy();
    expect(screen.getByText("S7").getAttribute("data-mode")).toBe("suburban");
    expect(document.querySelector("input[name=avoidLines]")?.getAttribute("value")).toBe("S7");
    expect(screen.getByRole("button", { name: "Linien ändern" })).toHaveProperty("disabled", false);
  });

  it("does not open the line choice before a start is chosen", () => {
    render(<RouteForm language="de" route={null} failed={false} />);

    expect(screen.getByRole("button", { name: "Linien wählen" })).toHaveProperty("disabled", true);
  });

  it("offers relaxed travel and says what it does", () => {
    render(<RouteForm language="de" route={{ ...route, relaxed: true }} failed={false} />);

    const box = screen.getByRole("checkbox", { name: /Entspannt/ });
    expect(box).toHaveProperty("checked", true);
    expect(box.getAttribute("name")).toBe("relaxed");
    expect(screen.getByText(/weniger Umstiege/)).toBeTruthy();
  });

  it("asks for an arrival time by default", () => {
    render(<RouteForm language="de" route={null} failed={false} />);

    expect(screen.getByRole("radio", { name: "Ankunft bis" })).toHaveProperty("checked", true);
    expect(document.querySelector("input[name=arrival]")).toBeTruthy();
  });

  it("drops the arrival time when the route starts with the leave button", () => {
    render(<RouteForm language="de" route={null} failed={false} />);

    fireEvent.click(screen.getByRole("radio", { name: "Aufbruch per Knopf" }));

    expect(screen.getByRole("radio", { name: "Aufbruch per Knopf" })).toHaveProperty("checked", true);
    expect(document.querySelector("input[name=arrival]")).toBeNull();
    expect(document.querySelector("input[name=timing]:checked")?.getAttribute("value")).toBe("leave");
  });

  it("opens a leave route with the leave choice set", () => {
    render(<RouteForm language="de" route={{ ...route, arrival: "" }} failed={false} />);

    expect(screen.getByRole("radio", { name: "Aufbruch per Knopf" })).toHaveProperty("checked", true);
    expect(document.querySelector("input[name=arrival]")).toBeNull();
  });

  it("groups the form into route, requirement and weekdays", () => {
    render(<RouteForm language="de" route={route} failed={false} />);

    expect(screen.getByRole("group", { name: "Strecke" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Vorgabe" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Wochentage" })).toBeTruthy();
  });
});
