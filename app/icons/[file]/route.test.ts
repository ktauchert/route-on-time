import { describe, expect, it } from "vitest";
import { GET } from "./route";

function ask(file: string) {
  return GET(new Request(`http://localhost/icons/${file}`), { params: Promise.resolve({ file }) });
}

function pngSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("icons", () => {
  it.each([
    ["192.png", 192],
    ["512.png", 512],
    ["maskable-512.png", 512],
    ["apple-180.png", 180],
  ])("draws %s as a png of the right size", async (file, size) => {
    const response = await ask(file);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(pngSize(bytes)).toEqual({ width: size, height: size });
  });

  it("lets the browser keep the icon", async () => {
    const response = await ask("192.png");

    expect(response.headers.get("cache-control")).toContain("max-age");
  });

  it("does not draw other names", async () => {
    expect((await ask("1.png")).status).toBe(404);
    expect((await ask("../secret")).status).toBe(404);
  });
});
