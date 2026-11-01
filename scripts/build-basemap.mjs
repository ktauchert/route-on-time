// One-time script. Fetches Berlin's border, water, green areas, built-up areas, the S-Bahn network and
// the motorways from OpenStreetMap (Overpass) and rasterizes them into the two character grids in
// lib/basemap/. The grids are checked in; this script is not part of the test run or the CI.
// Answers are cached in .cache/basemap/, so a second run does not ask Overpass again.
// Data: © OpenStreetMap contributors (ODbL).
//
//   node scripts/build-basemap.mjs
//
// Glyphs: "." land outside Berlin, "," land inside Berlin, "u" built-up, "g" green, "~" water,
// "s" S-Bahn track, "S" S-Bahn ring, "r" motorway, "#" border of Berlin.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const userAgent = "route-on-time basemap script (https://github.com/ktauchert/route-on-time)";

const maps = [
  { id: "region", west: 12.6, east: 14.0, south: 52.15, north: 52.85, cols: 280, rows: 230 },
  { id: "city", west: 13.05, east: 13.8, south: 52.32, north: 52.7, cols: 300, rows: 250 },
];

const labels = [
  { name: "Mitte", point: [13.4, 52.522], kind: "place" },
  { name: "Charlottenburg", point: [13.29, 52.515], kind: "place" },
  { name: "Spandau", point: [13.2, 52.538], kind: "place" },
  { name: "Reinickendorf", point: [13.33, 52.595], kind: "place" },
  { name: "Pankow", point: [13.41, 52.575], kind: "place" },
  { name: "Lichtenberg", point: [13.5, 52.515], kind: "place" },
  { name: "Neukölln", point: [13.44, 52.478], kind: "place" },
  { name: "Tempelhof", point: [13.385, 52.465], kind: "place" },
  { name: "Steglitz", point: [13.325, 52.455], kind: "place" },
  { name: "Köpenick", point: [13.58, 52.445], kind: "place" },
  { name: "Wannsee", point: [13.17, 52.42], kind: "place" },
  { name: "Potsdam", point: [13.06, 52.395], kind: "place" },
  { name: "Falkensee", point: [13.095, 52.56], kind: "place" },
  { name: "Oranienburg", point: [13.24, 52.755], kind: "place" },
  { name: "Bernau", point: [13.59, 52.678], kind: "place" },
  { name: "Königs Wusterhausen", point: [13.63, 52.298], kind: "place" },
  { name: "Fernsehturm", point: [13.4094, 52.5208], kind: "landmark" },
  { name: "Hauptbahnhof", point: [13.3694, 52.5251], kind: "landmark" },
  { name: "BER", point: [13.5033, 52.3667], kind: "landmark" },
];

mkdirSync(".cache/basemap", { recursive: true });

async function overpass(name, query) {
  const file = `.cache/basemap/${name}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));

  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": userAgent, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(300000),
        });
        if (response.ok) {
          const text = await response.text();
          writeFileSync(file, text);
          console.log(`fetched ${name}: ${(text.length / 1e6).toFixed(1)} MB`);
          return JSON.parse(text);
        }
        lastError = new Error(`${endpoint}: ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 8000 * (attempt + 1)));
  }
  throw lastError;
}

const box = "(52.1,12.5,52.9,14.1)";
const head = "[out:json][timeout:240][maxsize:1073741824];";
const berlin = `area["name"="Berlin"]["boundary"="administrative"]["admin_level"="4"]->.b;`;

const border = await overpass("border", `${head}relation["boundary"="administrative"]["admin_level"="4"]["name"="Berlin"];out geom;`);
const water = await overpass(
  "water",
  `${head}(way["natural"="water"]${box};relation["natural"="water"]${box};way["waterway"="river"]${box};way["waterway"="canal"]["name"]${box};);out geom;`,
);
const green = await overpass(
  "green",
  `${head}(way["landuse"="forest"]${box};relation["landuse"="forest"]${box};way["natural"="wood"]${box};relation["natural"="wood"]${box};way["leisure"="park"]${box};relation["leisure"="park"]${box};);out geom;`,
);
const urban = await overpass(
  "urban",
  `${head}${berlin}(way["landuse"~"^(residential|commercial|retail|industrial)$"](area.b);relation["landuse"~"^(residential|commercial|retail|industrial)$"](area.b););out geom;`,
);
const rail = await overpass("rail", `${head}way["railway"="light_rail"]${box};out geom;`);
const ring = await overpass("ring", `${head}relation["route"="light_rail"]["ref"~"^S4[12]$"];out geom;`);
const motorway = await overpass("motorway", `${head}way["highway"="motorway"]${box};out geom;`);

const pointsOf = (way) => (way.geometry ?? []).map((node) => [node.lon, node.lat]);
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

function lineCells(points, map) {
  const cells = [];
  const toCell = ([lon, lat]) => ({
    x: Math.floor(((lon - map.west) / (map.east - map.west)) * map.cols),
    y: Math.floor(((map.north - lat) / (map.north - map.south)) * map.rows),
  });
  for (let i = 1; i < points.length; i += 1) {
    const a = toCell(points[i - 1]);
    const b = toCell(points[i]);
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const sx = a.x < b.x ? 1 : -1;
    const sy = a.y < b.y ? 1 : -1;
    let error = dx - dy;
    for (;;) {
      cells.push({ x: a.x, y: a.y });
      if (a.x === b.x && a.y === b.y) break;
      const doubled = 2 * error;
      if (doubled > -dy) { error -= dy; a.x += sx; }
      if (doubled < dx) { error += dx; a.y += sy; }
    }
  }
  return cells;
}

// Joins the member ways of a multipolygon into closed rings.
function ringsOf(element) {
  if (element.type === "way") return [pointsOf(element)];
  const pieces = (element.members ?? []).filter((m) => m.type === "way" && m.geometry).map((m) => pointsOf(m));
  const rings = [];
  while (pieces.length > 0) {
    let current = pieces.pop();
    let grew = true;
    while (grew && !same(current[0], current[current.length - 1])) {
      grew = false;
      for (let i = 0; i < pieces.length; i += 1) {
        const piece = pieces[i];
        if (same(current[current.length - 1], piece[0])) current = current.concat(piece.slice(1));
        else if (same(current[current.length - 1], piece[piece.length - 1])) current = current.concat(piece.slice(0, -1).reverse());
        else if (same(current[0], piece[piece.length - 1])) current = piece.slice(0, -1).concat(current);
        else if (same(current[0], piece[0])) current = piece.slice(1).reverse().concat(current);
        else continue;
        pieces.splice(i, 1);
        grew = true;
        break;
      }
    }
    rings.push(current);
  }
  return rings;
}

// Even-odd fill, so the holes of a multipolygon stay open. `only` limits it to cells holding one of those glyphs.
function fill(rings, map, grid, glyph, only) {
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
      for (let x = Math.max(0, from); x <= Math.min(map.cols - 1, to); x += 1) {
        if (!only || only.includes(grid[y][x])) grid[y][x] = glyph;
      }
    }
  }
}

function stroke(cells, grid, glyph, only) {
  for (const cell of cells) {
    const current = grid[cell.y]?.[cell.x];
    if (current !== undefined && (!only || only.includes(current))) grid[cell.y][cell.x] = glyph;
  }
}

const borderRings = border.elements.flatMap(ringsOf);

for (const map of maps) {
  const grid = Array.from({ length: map.rows }, () => Array(map.cols).fill("."));

  fill(borderRings, map, grid, ",");
  for (const element of urban.elements) fill(ringsOf(element), map, grid, "u", [","]);
  for (const element of green.elements) fill(ringsOf(element), map, grid, "g", [".", ",", "u"]);
  for (const element of water.elements) {
    if (element.tags?.waterway) stroke(lineCells(pointsOf(element), map), grid, "~");
    else fill(ringsOf(element), map, grid, "~");
  }
  for (const element of rail.elements) stroke(lineCells(pointsOf(element), map), grid, "s", [".", ",", "u", "g"]);
  for (const element of motorway.elements) stroke(lineCells(pointsOf(element), map), grid, "r", [".", ",", "u", "g"]);
  for (const element of ring.elements) {
    for (const member of element.members ?? []) {
      if (member.type === "way" && member.geometry) stroke(lineCells(pointsOf(member), map), grid, "S", [".", ",", "u", "g", "s", "r"]);
    }
  }
  for (const element of border.elements) {
    for (const member of element.members ?? []) {
      if (member.type === "way" && member.geometry) stroke(lineCells(pointsOf(member), map), grid, "#", [".", ",", "u", "g"]);
    }
  }

  const { id, west, east, south, north, cols, rows } = map;
  const inMap = labels.filter(({ point: [lon, lat] }) => lon >= west && lon <= east && lat >= south && lat <= north);
  writeFileSync(
    `lib/basemap/${id}.json`,
    JSON.stringify({ id, west, east, south, north, cols, rows, grid: grid.map((row) => row.join("")), labels: inMap }) + "\n",
  );
  console.log(`${id}: ${cols}x${rows}`);
}
