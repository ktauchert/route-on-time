import { describe, expect, it } from "vitest";
import {
  appliesOn,
  defaultWeekdays,
  findPlaces,
  routeLabel,
  routeProblems,
  storedRouteName,
} from "./route";

const monday = new Date("2026-10-26T12:00:00+01:00");
const labourDay = new Date("2026-05-01T12:00:00+02:00");

describe("routeProblems", () => {
  it("rejects the same stop as start and destination", () => {
    expect(
      routeProblems({
        startId: "900000003201",
        zielId: "900000003201",
        arrival: "09:00",
        weekdays: ["mon"],
      }),
    ).toContain("same-stop");
  });

  it("requires an arrival time and at least one weekday", () => {
    expect(
      routeProblems({
        startId: "a",
        zielId: "b",
        arrival: "",
        weekdays: [],
      }),
    ).toEqual(["arrival", "weekdays"]);
  });

  it("accepts two different stops with an arrival and a weekday", () => {
    expect(
      routeProblems({
        startId: "a",
        zielId: "b",
        arrival: "09:00",
        weekdays: ["mon"],
      }),
    ).toEqual([]);
  });
});

describe("routeLabel", () => {
  it("uses the name when one is set", () => {
    expect(routeLabel({ name: "zur Arbeit", startName: "A", zielName: "B" })).toBe(
      "zur Arbeit",
    );
  });

  it("uses start and destination when the name is empty", () => {
    expect(routeLabel({ name: "  ", startName: "Alexanderplatz", zielName: "Zoo" })).toBe(
      "Alexanderplatz → Zoo",
    );
  });
});

describe("storedRouteName", () => {
  const stops = { startId: "a", zielId: "b", startName: "Alex", zielName: "Zoo" };

  it("keeps a name the person typed", () => {
    expect(storedRouteName({ ...stops, name: "zur Arbeit" }, [])).toBe("zur Arbeit");
  });

  it("stores start and destination when the name is empty", () => {
    expect(storedRouteName({ ...stops, name: "  " }, [])).toBe("Alex → Zoo");
  });

  it("adds a suffix when that start and destination already has the plain name", () => {
    expect(
      storedRouteName({ ...stops, name: "" }, [
        { id: "1", name: "Alex → Zoo", startId: "a", zielId: "b" },
      ]),
    ).toBe("Alex → Zoo 2");
  });

  it("does not treat the route being edited as a duplicate of itself", () => {
    expect(
      storedRouteName({ ...stops, name: "" }, [
        { id: "1", name: "Alex → Zoo", startId: "a", zielId: "b" },
      ], "1"),
    ).toBe("Alex → Zoo");
  });
});

describe("appliesOn", () => {
  it("matches the weekday in Europe/Berlin", () => {
    expect(appliesOn(["mon"], monday)).toBe(true);
    expect(appliesOn(["sun"], monday)).toBe(false);
  });

  it("counts a public holiday as its weekday", () => {
    expect(appliesOn(["fri"], labourDay)).toBe(true);
  });
});

describe("defaultWeekdays", () => {
  it("starts with Monday through Friday", () => {
    expect(defaultWeekdays).toEqual(["mon", "tue", "wed", "thu", "fri"]);
  });
});

describe("findPlaces", () => {
  it("keeps stops and lines and drops anything without an id", () => {
    const places = findPlaces([
      { type: "stop", id: "1", name: "Alex" },
      { type: "line", id: "s2", name: "S2" },
      { type: "stop", name: "Ohne Kennung" },
      { type: "address", id: "x", name: "Strasse" },
    ]);

    expect(places).toEqual([
      { kind: "stop", id: "1", name: "Alex" },
      { kind: "line", id: "s2", name: "S2" },
    ]);
  });
});
