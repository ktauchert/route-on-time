import { describe, expect, it } from "vitest";
import {
  appliesOn,
  defaultWeekdays,
  findPlaces,
  routeLabel,
  routeProblems,
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
