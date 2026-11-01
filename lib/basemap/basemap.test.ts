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
          expect(row).toMatch(/^[.~#]+$/);
        }
      });

      it("shows water and the border of Berlin", () => {
        const all = map.grid.join("");
        expect(all).toContain("~");
        expect(all).toContain("#");
        expect(all).toContain(".");
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
