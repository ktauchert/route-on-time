import { describe, expect, it } from "vitest";
import { baseMaps } from "./index";

describe("the checked-in base maps", () => {
  it("has a city and a region map", () => {
    expect(baseMaps.map((map) => map.id).sort()).toEqual(["city", "region"]);
  });

  for (const map of baseMaps) {
    describe(map.id, () => {
      it("is a grid of the size it announces, made of land, water and border", () => {
        expect(map.grid).toHaveLength(map.rows);
        for (const row of map.grid) {
          expect(row).toHaveLength(map.cols);
          expect(row).toMatch(/^[.,ug~sSr#]+$/);
        }
      });

      it("shows water and the border of Berlin", () => {
        const all = map.grid.join("");
        expect(all).toContain("~");
        expect(all).toContain("#");
        expect(all).toContain(".");
      });

      it("shows the inside of Berlin, green areas and the S-Bahn", () => {
        const all = map.grid.join("");
        expect(all).toContain(",");
        expect(all).toContain("g");
        expect(all).toContain("s");
        expect(all).toContain("S");
      });

      it("names places and landmarks that lie inside the map", () => {
        expect(map.labels?.length).toBeGreaterThan(5);
        for (const label of map.labels ?? []) {
          expect(label.point[0]).toBeGreaterThanOrEqual(map.west);
          expect(label.point[0]).toBeLessThanOrEqual(map.east);
          expect(label.point[1]).toBeGreaterThanOrEqual(map.south);
          expect(label.point[1]).toBeLessThanOrEqual(map.north);
        }
        expect(map.labels?.some((label) => label.name === "Fernsehturm")).toBe(true);
      });

      it("covers Berlin", () => {
        expect(map.west).toBeLessThan(13.1);
        expect(map.east).toBeGreaterThan(13.7);
        expect(map.south).toBeLessThan(52.4);
        expect(map.north).toBeGreaterThan(52.6);
      });
    });
  }
});
