import { berlinInstant } from "./check";
import type { CheckReason, CheckStatus } from "./check";
import type { Language } from "./preferences";

const copy = {
  de: {
    status: { fits: "passt", "doesnt-fit": "passt nicht", unclear: "unklar" },
    reason: {
      arrival: "Die Ankunft liegt nach der Uhrzeit.",
      transfer: "Ein Umstieg ist zu kurz.",
      transfers: "Es sind zu viele Umstiege.",
      line: "Die Linie fehlt.",
      cancelled: "Ein Abschnitt fällt aus.",
      empty: "Für diese Ankunft gibt es keine Verbindung.",
      "no-answer": "Die Auskunft ist nicht erreichbar.",
      stale: "Die Echtzeit ist älter als 15 Minuten.",
    },
    check: "Jetzt prüfen",
    choose: "Als heutige Verbindung",
    chosen: "Heutige Verbindung",
    clear: "Wahl aufheben",
    notChecked: "Noch nicht geprüft.",
    saveFailed: "Der Stand konnte nicht gespeichert werden.",
    walking: "Fußweg",
    transfer: "Umstieg",
    cancelledLeg: "Fällt aus",
    alternative: "Alternative",
    noAlternative: "Es gibt keine Alternative.",
    restFrom: "Restweg ab",
  },
  en: {
    status: { fits: "Fits", "doesnt-fit": "Doesn't fit", unclear: "Unclear" },
    reason: {
      arrival: "The arrival is after the set time.",
      transfer: "A transfer is too short.",
      transfers: "There are too many transfers.",
      line: "The line is missing.",
      cancelled: "A leg is cancelled.",
      empty: "There is no connection for this arrival.",
      "no-answer": "The timetable did not answer.",
      stale: "Realtime data is older than 15 minutes.",
    },
    check: "Check now",
    choose: "Use as today's connection",
    chosen: "Today's connection",
    clear: "Clear choice",
    notChecked: "Not checked yet.",
    saveFailed: "The result could not be saved.",
    walking: "Walk",
    transfer: "Transfer",
    cancelledLeg: "Cancelled",
    alternative: "Alternative",
    noAlternative: "There is no alternative.",
    restFrom: "Rest of the trip from",
  },
} as const;

export function checkCopy(language: Language) {
  return copy[language];
}

export function statusWord(language: Language, status: CheckStatus) {
  return copy[language].status[status];
}

export function reasonSentence(language: Language, reason: CheckReason) {
  return copy[language].reason[reason];
}

export function delayLabel(seconds: number | null) {
  if (seconds == null || seconds === 0) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes === 0) return null;
  return minutes > 0 ? `+${minutes} min` : `${minutes} min`;
}

export function checkedAtLabel(language: Language, checkedAt: string) {
  const time = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Berlin",
  }).format(new Date(checkedAt));
  return language === "de" ? `Geprüft um ${time}` : `Checked at ${time}`;
}

export function serviceDayLabel(language: Language, serviceDate: string) {
  const prefix = language === "de" ? "Gesucht für" : "Searched for";
  const locale = language === "de" ? "de-DE" : "en-GB";
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(berlinInstant(serviceDate, "12:00"));
  return `${prefix} ${day}`;
}

export function clockLabel(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function transferGapMinutes(arrival: string, departure: string) {
  if (!arrival || !departure) return null;
  const minutes = Math.round((new Date(departure).getTime() - new Date(arrival).getTime()) / 60000);
  return minutes > 0 ? minutes : null;
}
