import type { LegView, MapPoint, Suggestion } from "./check";
import { transferGapMinutes } from "./check-copy";
import { modeOf, type Mode } from "./mode";

// A base map is a character grid: "." land, "~" water, "#" border or ring.
export type BaseMap = {
  id: "city" | "region";
  west: number;
  east: number;
  south: number;
  north: number;
  cols: number;
  rows: number;
  grid: string[];
};

export type Cell = { x: number; y: number };

export type ViewBox = { x: number; y: number; width: number; height: number };

export type Segment = { mode: Mode | null; cells: Cell[] };

export type StationKind = "start" | "stop" | "transfer" | "end";

export type Station = {
  key: string;
  name: string;
  kind: StationKind;
  cell: Cell;
  arrival: string | null;
  departure: string | null;
  delaySeconds: number | null;
  transferMinutes: number | null;
  from: string | null;
  to: string | null;
  walkMinutes: number | null;
  walkTo: string | null;
};

export function toCell(point: MapPoint, map: BaseMap): Cell {
  const [longitude, latitude] = point;
  return {
    x: Math.floor(((longitude - map.west) / (map.east - map.west)) * map.cols),
    y: Math.floor(((map.north - latitude) / (map.north - map.south)) * map.rows),
  };
}

function inside(point: MapPoint, map: BaseMap) {
  const [longitude, latitude] = point;
  return longitude >= map.west && longitude <= map.east && latitude >= map.south && latitude <= map.north;
}

function area(map: BaseMap) {
  return (map.east - map.west) * (map.north - map.south);
}

// The smallest map that holds the whole route shows it in the most detail.
export function chooseBaseMap(points: MapPoint[], maps: BaseMap[]): BaseMap {
  const ordered = [...maps].sort((a, b) => area(a) - area(b));
  const largest = ordered[ordered.length - 1] as BaseMap;
  if (points.length === 0) return largest;
  return ordered.find((map) => points.every((point) => inside(point, map))) ?? largest;
}

export function rasterLine(from: Cell, to: Cell): Cell[] {
  const cells: Cell[] = [];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = dx - dy;
  let x = from.x;
  let y = from.y;

  for (;;) {
    cells.push({ x, y });
    if (x === to.x && y === to.y) return cells;
    const doubled = 2 * error;
    if (doubled > -dy) {
      error -= dy;
      x += stepX;
    }
    if (doubled < dx) {
      error += dx;
      y += stepY;
    }
  }
}

const padding = 6;
const minimumWidth = 48;
const aspect = 4 / 3;

// The visible part of the base map: the route with some air around it, at a fixed 4:3 shape.
export function viewBoxFor(cells: Cell[], map: BaseMap): ViewBox {
  if (cells.length === 0) return { x: 0, y: 0, width: map.cols, height: map.rows };

  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const wanted = Math.max(maxX - minX + 1 + 2 * padding, (maxY - minY + 1 + 2 * padding) * aspect, minimumWidth);
  const width = Math.min(Math.ceil(wanted), map.cols, Math.floor(map.rows * aspect));
  const height = Math.round(width / aspect);
  const x = Math.round((minX + maxX) / 2 - width / 2);
  const y = Math.round((minY + maxY) / 2 - height / 2);

  return {
    x: Math.min(Math.max(0, x), map.cols - width),
    y: Math.min(Math.max(0, y), map.rows - height),
    width,
    height,
  };
}

function samePlace(a: { id: string | null; name: string }, b: { id: string | null; name: string }) {
  if (a.id && b.id) return a.id === b.id;
  return a.name === b.name;
}

type Entry = {
  id: string | null;
  name: string;
  point: MapPoint;
  arrival: string | null;
  departure: string | null;
  delaySeconds: number | null;
  before: LegView | null;
  after: LegView | null;
};

function legMinutes(leg: LegView) {
  return Math.max(0, Math.round((new Date(leg.arrival).getTime() - new Date(leg.departure).getTime()) / 60000));
}

function entriesOf(connection: Suggestion): Entry[] {
  const entries: Entry[] = [];

  const add = (entry: Entry) => {
    const last = entries[entries.length - 1];
    if (last && samePlace(last, entry)) {
      last.departure = entry.departure ?? last.departure;
      last.after = entry.after;
      return;
    }
    entries.push(entry);
  };

  for (const leg of connection.legs) {
    if (!leg.originPoint || !leg.destinationPoint) continue;

    add({
      id: leg.originId,
      name: leg.originName,
      point: leg.originPoint,
      arrival: null,
      departure: leg.departure || null,
      delaySeconds: null,
      before: null,
      after: leg,
    });

    for (const stop of leg.stopovers) {
      if (!stop.point) continue;
      if (samePlace(stop, { id: leg.originId, name: leg.originName })) continue;
      if (samePlace(stop, { id: leg.destinationId, name: leg.destinationName })) continue;
      add({
        id: stop.id,
        name: stop.name,
        point: stop.point,
        arrival: stop.arrival || null,
        departure: stop.departure || null,
        delaySeconds: null,
        before: leg,
        after: leg,
      });
    }

    add({
      id: leg.destinationId,
      name: leg.destinationName,
      point: leg.destinationPoint,
      arrival: leg.arrival || null,
      departure: null,
      delaySeconds: leg.arrivalDelaySeconds,
      before: leg,
      after: null,
    });
  }

  return entries;
}

// What the person needs at each point of the trip: times, delay, how long to change, where to walk.
export function stationsOf(connection: Suggestion, map: BaseMap): Station[] {
  const entries = entriesOf(connection);

  return entries.map((entry, index) => {
    const first = index === 0;
    const last = index === entries.length - 1;
    const changes = Boolean(entry.before && entry.after && entry.before !== entry.after);
    const kind: StationKind = first ? "start" : last ? "end" : changes ? "transfer" : "stop";
    const walking = entry.after?.walking ? entry.after : null;

    return {
      key: `${index}-${entry.id ?? entry.name}`,
      name: entry.name,
      kind,
      cell: toCell(entry.point, map),
      arrival: entry.arrival,
      departure: entry.departure,
      delaySeconds: entry.delaySeconds,
      transferMinutes:
        changes && entry.arrival && entry.departure ? transferGapMinutes(entry.arrival, entry.departure) : null,
      from: changes && entry.before && !entry.before.walking ? entry.before.lineName : null,
      to: changes && entry.after && !entry.after.walking ? entry.after.lineName : null,
      walkMinutes: walking ? legMinutes(walking) : null,
      walkTo: walking ? walking.destinationName : null,
    };
  });
}

function pointsOfLeg(leg: LegView): MapPoint[] {
  if (leg.path && leg.path.length > 0) return leg.path;
  const points: MapPoint[] = [];
  if (leg.originPoint) points.push(leg.originPoint);
  for (const stop of leg.stopovers) {
    if (stop.point && !samePlace(stop, { id: leg.originId, name: leg.originName }) && !samePlace(stop, { id: leg.destinationId, name: leg.destinationName })) {
      points.push(stop.point);
    }
  }
  if (leg.destinationPoint) points.push(leg.destinationPoint);
  return points;
}

function chain(points: MapPoint[], map: BaseMap): Cell[] {
  const cells = points.map((point) => toCell(point, map));
  const first = cells[0];
  if (!first) return [];
  const out: Cell[] = [first];
  for (let index = 1; index < cells.length; index += 1) {
    const line = rasterLine(cells[index - 1] as Cell, cells[index] as Cell);
    out.push(...line.slice(1));
  }
  return out;
}

export function routeSegments(connection: Suggestion, map: BaseMap): Segment[] {
  return connection.legs.map((leg) => ({
    mode: leg.walking ? null : modeOf(leg),
    cells: chain(pointsOfLeg(leg), map),
  }));
}

// Where the trip should be by the timetable. There is no GPS, so this is an estimate along the drawn line.
export function positionAt(connection: Suggestion, now: Date, map: BaseMap): Cell | null {
  const segments = routeSegments(connection, map);
  const legs = connection.legs;
  const firstCell = segments.find((segment) => segment.cells.length > 0)?.cells[0];
  if (!firstCell) return null;

  const nowMs = now.getTime();
  let resting: Cell = firstCell;

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index] as LegView;
    const cells = (segments[index] as Segment).cells;
    if (cells.length === 0) continue;

    const departure = new Date(leg.departure).getTime();
    const arrival = new Date(leg.arrival).getTime();
    if (nowMs < departure) return resting;
    if (nowMs < arrival && arrival > departure) {
      const fraction = (nowMs - departure) / (arrival - departure);
      return cells[Math.round(fraction * (cells.length - 1))] as Cell;
    }
    resting = cells[cells.length - 1] as Cell;
  }

  return resting;
}
