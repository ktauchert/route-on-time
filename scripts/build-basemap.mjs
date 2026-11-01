// One-time script. Fetches Berlin's border, water and the S-Bahn ring from OpenStreetMap (Overpass)
// and rasterizes them into the two character grids in lib/basemap/. The grids are checked in;
// this script is not part of the test run or the CI. Data: © OpenStreetMap contributors (ODbL).
//
//   node scripts/build-basemap.mjs
import { writeFileSync } from "node:fs";

const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const userAgent = "route-on-time basemap script (https://github.com/ktauchert/route-on-time)";

const maps = [
  { id: "region", west: 12.6, east: 14.0, south: 52.15, north: 52.85, cols: 140, rows: 115 },
  { id: "city", west: 13.05, east: 13.8, south: 52.32, north: 52.7, cols: 150, rows: 125 },
];

async function overpass(query) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": userAgent, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(180000),
        });
        if (response.ok) return await response.json();
        lastError = new Error(`${endpoint}: ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000 * (attempt + 1)));
  }
  throw lastError;
}

const box = "(52.1,12.5,52.9,14.1)";
const border = await overpass(`[out:json][timeout:120];relation["boundary"="administrative"]["admin_level"="4"]["name"="Berlin"];out geom;`);
const ring = await overpass(`[out:json][timeout:120];relation["route"="light_rail"]["ref"~"^S4[12]$"];out geom;`);
const water = await overpass(
  `[out:json][timeout:180];(way["natural"="water"]${box};relation["natural"="water"]${box};way["waterway"="river"]${box};way["waterway"="canal"]["name"]${box};);out geom;`,
);

function lineCells(points, map) {
  const cells = [];
  const toCell = ([lon, lat]) => ({
    x: Math.floor(((lon - map.west) / (map.east - map.west)) * map.cols),
    y: Math.floor(((map.north - lat) / (map.north - map.south)) * map.rows),
  });
  for (let i = 1; i < points.length; i += 1) {
    let a = toCell(points[i - 1]);
    const b = toCell(points[i]);
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const sx = a.x < b.x ? 1 : -1;
    const sy = a.y < b.y ? 1 : -1;
    let error = dx - dy;
    for (;;) {
      cells.push({ ...a });
      if (a.x === b.x && a.y === b.y) break;
      const doubled = 2 * error;
      if (doubled > -dy) { error -= dy; a.x += sx; }
      if (doubled < dx) { error += dx; a.y += sy; }
    }
  }
  return cells;
}

const pointsOf = (way) => (way.geometry ?? []).map((node) => [node.lon, node.lat]);

// Joins the member ways of a multipolygon into closed rings.
function ringsOf(element) {
  if (element.type === "way") return [pointsOf(element)];
  const pieces = (element.members ?? []).filter((m) => m.type === "way" && m.geometry).map((m) => pointsOf(m));
  const rings = [];
  while (pieces.length > 0) {
    let ring = pieces.pop();
    let grew = true;
    while (grew && !same(ring[0], ring[ring.length - 1])) {
      grew = false;
      for (let i = 0; i < pieces.length; i += 1) {
        const piece = pieces[i];
        if (same(ring[ring.length - 1], piece[0])) ring = ring.concat(piece.slice(1));
        else if (same(ring[ring.length - 1], piece[piece.length - 1])) ring = ring.concat(piece.slice(0, -1).reverse());
        else if (same(ring[0], piece[piece.length - 1])) ring = piece.slice(0, -1).concat(ring);
        else if (same(ring[0], piece[0])) ring = piece.slice(1).reverse().concat(ring);
        else continue;
        pieces.splice(i, 1);
        grew = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

const same = (a, b) => a[0] === b[0] && a[1] === b[1];

function fill(rings, map, grid) {
  for (let y = 0; y < map.rows; y += 1) {
    const lat = map.north - ((y + 0.5) / map.rows) * (map.north - map.south);
    const crossings = [];
    for (const ring of rings) {
      for (let i = 1; i < ring.length; i += 1) {
        const [lon1, lat1] = ring[i - 1];
        const [lon2, lat2] = ring[i];
        if ((lat1 <= lat) !== (lat2 <= lat)) crossings.push(lon1 + ((lat - lat1) / (lat2 - lat1)) * (lon2 - lon1));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const from = Math.ceil(((crossings[i] - map.west) / (map.east - map.west)) * map.cols - 0.5);
      const to = Math.floor(((crossings[i + 1] - map.west) / (map.east - map.west)) * map.cols - 0.5);
      for (let x = Math.max(0, from); x <= Math.min(map.cols - 1, to); x += 1) grid[y][x] = "~";
    }
  }
}

for (const map of maps) {
  const grid = Array.from({ length: map.rows }, () => Array(map.cols).fill("."));

  for (const element of water.elements) {
    if (element.tags?.waterway) {
      for (const cell of lineCells(pointsOf(element), map)) {
        if (grid[cell.y]?.[cell.x] !== undefined) grid[cell.y][cell.x] = "~";
      }
    } else {
      fill(ringsOf(element), map, grid);
    }
  }

  for (const element of [...border.elements, ...ring.elements]) {
    for (const member of element.members ?? []) {
      if (member.type !== "way" || !member.geometry) continue;
      for (const cell of lineCells(pointsOf(member), map)) {
        if (grid[cell.y]?.[cell.x] !== undefined) grid[cell.y][cell.x] = "#";
      }
    }
  }

  const { id, west, east, south, north, cols, rows } = map;
  writeFileSync(`lib/basemap/${id}.json`, JSON.stringify({ id, west, east, south, north, cols, rows, grid: grid.map((row) => row.join("")) }) + "\n");
  console.log(`${id}: ${cols}x${rows}`);
}
