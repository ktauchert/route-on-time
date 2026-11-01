import { describe, expect, it } from "vitest";
import {
  chooseBaseMap,
  positionAt,
  rasterLine,
  routeSegments,
  stationsOf,
  toCell,
  viewBoxFor,
  type BaseMap,
} from "./pixel-map";
import type { LegView, Suggestion } from "./check";

const region: BaseMap = { id: "region", west: 12, east: 14, south: 52, north: 53, cols: 200, rows: 100, grid: [] };
const city: BaseMap = { id: "city", west: 13, east: 13.5, south: 52.4, north: 52.6, cols: 100, rows: 80, grid: [] };

function leg(overrides: Partial<LegView> = {}): LegView {
  return {
    walking: false,
    lineId: null,
    lineName: "S7",
    product: "suburban",
    originId: "a",
    originName: "A",
    destinationId: "b",
    destinationName: "B",
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

const twoRides: Suggestion = {
  refreshToken: "t",
  legs: [
    leg({
      stopovers: [
        { id: "a", name: "A", departure: "2026-10-26T08:00:00+01:00", arrival: "", point: [13.1, 52.5] },
        { id: "m", name: "Mitte", departure: "2026-10-26T08:10:00+01:00", arrival: "2026-10-26T08:09:00+01:00", point: [13.15, 52.5] },
        { id: "b", name: "B", departure: "", arrival: "2026-10-26T08:20:00+01:00", point: [13.2, 52.5] },
      ],
    }),
    leg({
      lineName: "S2",
      originId: "b",
      originName: "B",
      destinationId: "c",
      destinationName: "C",
      departure: "2026-10-26T08:30:00+01:00",
      arrival: "2026-10-26T08:50:00+01:00",
      arrivalDelaySeconds: 120,
      originPoint: [13.2, 52.5],
      destinationPoint: [13.2, 52.6],
    }),
  ],
};

describe("toCell", () => {
  it("puts a point on the grid, north at the top", () => {
    expect(toCell([13, 52.5], region)).toEqual({ x: 100, y: 50 });
    expect(toCell([12, 53], region)).toEqual({ x: 0, y: 0 });
  });
});

describe("chooseBaseMap", () => {
  it("takes the city map when every point lies inside it, else the region", () => {
    expect(chooseBaseMap([[13.1, 52.5], [13.4, 52.45]], [region, city]).id).toBe("city");
    expect(chooseBaseMap([[13.1, 52.5], [13.9, 52.45]], [region, city]).id).toBe("region");
  });
});

describe("rasterLine", () => {
  it("includes both ends and leaves no gap", () => {
    const cells = rasterLine({ x: 0, y: 0 }, { x: 4, y: 2 });

    expect(cells[0]).toEqual({ x: 0, y: 0 });
    expect(cells[cells.length - 1]).toEqual({ x: 4, y: 2 });
    for (let index = 1; index < cells.length; index += 1) {
      const a = cells[index - 1]!;
      const b = cells[index]!;
      expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBe(1);
    }
  });

  it("is a single cell for one point", () => {
    expect(rasterLine({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual([{ x: 3, y: 3 }]);
  });
});

describe("viewBoxFor", () => {
  it("pads the cells, keeps a minimum size and stays inside the map", () => {
    const box = viewBoxFor([{ x: 100, y: 50 }, { x: 102, y: 51 }], region);

    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(36);
    expect(box.x).toBeLessThanOrEqual(100);
    expect(box.x + box.width).toBeGreaterThanOrEqual(102);

    const corner = viewBoxFor([{ x: 0, y: 0 }], region);
    expect(corner.x).toBe(0);
    expect(corner.y).toBe(0);
  });
});

describe("stationsOf", () => {
  it("lists start, stop, transfer and end with what the person needs at each", () => {
    const stations = stationsOf(twoRides, region);

    expect(stations.map((item) => [item.name, item.kind])).toEqual([
      ["A", "start"],
      ["Mitte", "stop"],
      ["B", "transfer"],
      ["C", "end"],
    ]);
    const transfer = stations[2]!;
    expect(transfer.transferMinutes).toBe(10);
    expect(transfer.from).toBe("S7");
    expect(transfer.to).toBe("S2");
    expect(stations[3]!.delaySeconds).toBe(120);
    expect(stations[0]!.cell).toEqual(toCell([13.1, 52.5], region));
  });

  it("names a walk between two stops", () => {
    const walked: Suggestion = {
      refreshToken: "w",
      legs: [
        leg(),
        leg({
          walking: true,
          lineName: null,
          product: null,
          originId: "b",
          originName: "B",
          destinationId: "b2",
          destinationName: "B Nord",
          departure: "2026-10-26T08:22:00+01:00",
          arrival: "2026-10-26T08:27:00+01:00",
          originPoint: [13.2, 52.5],
          destinationPoint: [13.21, 52.5],
        }),
        leg({
          lineName: "S2",
          originId: "b2",
          originName: "B Nord",
          destinationId: "c",
          destinationName: "C",
          departure: "2026-10-26T08:30:00+01:00",
          arrival: "2026-10-26T08:50:00+01:00",
          originPoint: [13.21, 52.5],
          destinationPoint: [13.3, 52.5],
        }),
      ],
    };

    const stations = stationsOf(walked, region);
    const first = stations.find((item) => item.name === "B")!;
    const second = stations.find((item) => item.name === "B Nord")!;

    expect(first.walkMinutes).toBe(5);
    expect(first.walkTo).toBe("B Nord");
    expect(second.to).toBe("S2");
    expect(second.transferMinutes).toBe(3);
  });

  it("is empty without coordinates", () => {
    const bare: Suggestion = {
      refreshToken: "b",
      legs: [leg({ originPoint: undefined, destinationPoint: undefined })],
    };

    expect(stationsOf(bare, region)).toEqual([]);
  });
});

describe("routeSegments", () => {
  it("draws each leg in its own mode, from the shape when there is one", () => {
    const shaped: Suggestion = {
      refreshToken: "s",
      legs: [leg({ path: [[13.1, 52.5], [13.15, 52.55], [13.2, 52.5]] }), twoRides.legs[1]!],
    };

    const segments = routeSegments(shaped, region);

    expect(segments.map((item) => item.mode)).toEqual(["suburban", "suburban"]);
    expect(segments[0]!.cells.some((cell) => cell.y < 50)).toBe(true);
  });

  it("falls back to straight lines between the stops", () => {
    const segments = routeSegments(twoRides, region);

    expect(segments[0]!.cells.every((cell) => cell.y === 50)).toBe(true);
    expect(segments[0]!.cells.length).toBeGreaterThan(5);
  });

  it("marks a walk with no mode", () => {
    const walking: Suggestion = {
      refreshToken: "w",
      legs: [leg({ walking: true, lineName: null, product: null })],
    };

    expect(routeSegments(walking, region)[0]!.mode).toBeNull();
  });
});

describe("positionAt", () => {
  it("waits at the start, moves along the leg, rests at the end", () => {
    const start = toCell([13.1, 52.5], region);
    const end = toCell([13.2, 52.6], region);

    expect(positionAt(twoRides, new Date("2026-10-26T07:50:00+01:00"), region)).toEqual(start);
    expect(positionAt(twoRides, new Date("2026-10-26T09:30:00+01:00"), region)).toEqual(end);

    const middle = positionAt(twoRides, new Date("2026-10-26T08:10:00+01:00"), region)!;
    expect(middle.x).toBeGreaterThan(start.x);
    expect(middle.x).toBeLessThan(toCell([13.2, 52.5], region).x);
  });

  it("is null without coordinates", () => {
    expect(positionAt({ refreshToken: "b", legs: [leg({ originPoint: undefined, destinationPoint: undefined })] }, new Date(), region)).toBeNull();
  });
});
