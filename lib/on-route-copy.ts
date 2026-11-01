import { durationLabel } from "./check-copy";
import type { Language } from "./preferences";

const copy = {
  de: {
    title: "On-Route-Modus",
    off: "Modus aus",
    toRoute: "Zur Route",
    noMap: "Noch keine Kartendaten. Die nächste Prüfung bringt sie.",
    attribution: "Karte © OpenStreetMap-Mitwirkende",
    map: "Karte der Route",
    arrival: "Ankunft",
    departure: "Abfahrt",
    transfer: "Umstieg",
    walk: "Fußweg",
    closeStation: "Schließen",
    settingsHeading: "On-Route-Modus",
    settingsText:
      "Zeigt eine Pixelkarte der Route, solange sie läuft und 20 Minuten davor. Gilt nur auf diesem Gerät.",
    isOn: "Der Modus ist an.",
    isOff: "Der Modus ist aus.",
    turnOn: "Einschalten",
    turnOff: "Ausschalten",
  },
  en: {
    title: "On-route mode",
    off: "Mode off",
    toRoute: "To the route",
    noMap: "No map data yet. The next check brings it.",
    attribution: "Map © OpenStreetMap contributors",
    map: "Map of the route",
    arrival: "Arrival",
    departure: "Departure",
    transfer: "Transfer",
    walk: "Walk",
    closeStation: "Close",
    settingsHeading: "On-route mode",
    settingsText:
      "Shows a pixel map of the route while it runs and 20 minutes before. Applies to this device only.",
    isOn: "The mode is on.",
    isOff: "The mode is off.",
    turnOn: "Turn on",
    turnOff: "Turn off",
  },
} as const;

export function onRouteCopy(language: Language) {
  return copy[language];
}

export function remainingLabel(language: Language, minutes: number) {
  const time = durationLabel(minutes);
  return language === "de" ? `Noch ${time}` : `${time} left`;
}

export function transferLabel(language: Language, minutes: number) {
  return `${copy[language].transfer} ${minutes} min`;
}

export function walkLabel(language: Language, minutes: number, to: string | null) {
  const base = `${copy[language].walk} ${minutes} min`;
  if (!to) return base;
  return language === "de" ? `${base} bis ${to}` : `${base} to ${to}`;
}
