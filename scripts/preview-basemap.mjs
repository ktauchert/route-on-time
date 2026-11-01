// Draws a base map as a PNG so it can be looked at without the app.
//   node scripts/preview-basemap.mjs city /path/to/city.png [scale]
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const [id = "city", out = "preview.png", scaleArgument = "3"] = process.argv.slice(2);
const scale = Number(scaleArgument);
const map = JSON.parse(readFileSync(`lib/basemap/${id}.json`, "utf8"));

const colors = {
  ".": [236, 232, 222],
  ",": [250, 248, 240],
  u: [232, 226, 214],
  g: [170, 205, 150],
  "~": [120, 170, 225],
  s: [150, 150, 150],
  S: [60, 140, 80],
  r: [200, 150, 90],
  "#": [120, 100, 100],
};

const width = map.cols * scale;
const height = map.rows * scale;
const raw = Buffer.alloc((width * 3 + 1) * height);
for (let y = 0; y < height; y += 1) {
  raw[y * (width * 3 + 1)] = 0;
  for (let x = 0; x < width; x += 1) {
    const glyph = map.grid[Math.floor(y / scale)][Math.floor(x / scale)];
    const [r, g, b] = colors[glyph] ?? [255, 0, 255];
    const at = y * (width * 3 + 1) + 1 + x * 3;
    raw[at] = r; raw[at + 1] = g; raw[at + 2] = b;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const check = Buffer.alloc(4); check.writeUInt32BE(crc(body));
  return Buffer.concat([length, body, check]);
};
const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
