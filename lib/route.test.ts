import { describe, expect, it } from "vitest";
import {
  appliesOn,
  defaultWeekdays,
  findPlaces,
  routeLabel,
  routeProblems,
  timingLabel,
  storedRouteName,
  weekdayNames,
} from "./route";

const monday = new Date("2026-10-26T12:00:00+01:00");
const labourDay = new Date("2026-05-01T12:00:00+02:00");

describe("routeProblems", () => {
  it("rejects the same stop as start and destination", () => {
    expect(
      routeProblems({
        startId: "900000003201",
        destinationId: "900000003201",
        arrival: "09:00",
        weekdays: ["mon"],
      }),
    ).toContain("same-stop");
  });

  it("requires an arrival time and at least one weekday", () => {
    expect(
      routeProblems({
        startId: "a",
        destinationId: "b",
        arrival: "",
        weekdays: [],
      }),
    ).toEqual(["arrival", "weekdays"]);
  });

  it("accepts two different stops with an arrival and a weekday", () => {
    expect(
      routeProblems({
        startId: "a",
        destinationId: "b",
        arrival: "09:00",
        weekdays: ["mon"],
      }),
    ).toEqual([]);
  });
});

describe("routeProblems for a route that starts with the leave button", () => {
  it("needs no arrival time", () => {
    expect(
      routeProblems({ startId: "a", destinationId: "b", arrival: "", weekdays: ["mon"], leave: true }),
    ).toEqual([]);
  });

  it("still needs two different stops and a weekday", () => {
    expect(
      routeProblems({ startId: "a", destinationId: "a", arrival: "", weekdays: [], leave: true }),
    ).toEqual(["same-stop", "weekdays"]);
  });
});

describe("routeLabel", () => {
  it("uses the name when one is set", () => {
    expect(routeLabel({ name: "zur Arbeit", startName: "A", destinationName: "B" })).toBe(
      "zur Arbeit",
    );
  });

  it("uses start and destination when the name is empty", () => {
    expect(routeLabel({ name: "  ", startName: "Alexanderplatz", destinationName: "Zoo" })).toBe(
      "Alexanderplatz → Zoo",
    );
  });
});

describe("storedRouteName", () => {
  const stops = { startId: "a", destinationId: "b", startName: "Alex", destinationName: "Zoo" };

  it("keeps a name the person typed", () => {
    expect(storedRouteName({ ...stops, name: "zur Arbeit" }, [])).toBe("zur Arbeit");
  });

  it("stores start and destination when the name is empty", () => {
    expect(storedRouteName({ ...stops, name: "  " }, [])).toBe("Alex → Zoo");
  });

  it("adds a suffix when that start and destination already has the plain name", () => {
    expect(
      storedRouteName({ ...stops, name: "" }, [
        { id: "1", name: "Alex → Zoo", startId: "a", destinationId: "b" },
      ]),
    ).toBe("Alex → Zoo 2");
  });

  it("does not treat the route being edited as a duplicate of itself", () => {
    expect(
      storedRouteName({ ...stops, name: "" }, [
        { id: "1", name: "Alex → Zoo", startId: "a", destinationId: "b" },
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

describe("weekdayNames", () => {
  it("lists the weekdays of a route in week order", () => {
    expect(weekdayNames("de", ["fri", "mon", "wed"])).toBe("Mo Mi Fr");
    expect(weekdayNames("en", ["sun", "sat"])).toBe("Sat Sun");
  });

  it("shortens a full working week and every day", () => {
    expect(weekdayNames("de", ["mon", "tue", "wed", "thu", "fri"])).toBe("Mo–Fr");
    expect(weekdayNames("en", ["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).toBe("Every day");
    expect(weekdayNames("de", ["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).toBe("Täglich");
  });
});

describe("timingLabel", () => {
  it("names the arrival of an arrival route", () => {
    expect(timingLabel("de", { arrival: "09:00" })).toBe("Ankunft 09:00");
    expect(timingLabel("en", { arrival: "09:00" })).toBe("Arrival 09:00");
  });

  it("names the button for a route without an arrival", () => {
    expect(timingLabel("de", { arrival: "" })).toBe("Aufbruch per Knopf");
    expect(timingLabel("en", { arrival: "" })).toBe("Leaves by button");
  });
});
