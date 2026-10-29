export const defaultWindowMinutes = 60;
export const minimumWindowMinutes = 10;
export const maximumWindowMinutes = 240;

export function normalizeWindow(value: unknown) {
  const minutes = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(minutes)) return null;
  if (minutes < minimumWindowMinutes || minutes > maximumWindowMinutes) return null;
  return minutes;
}
