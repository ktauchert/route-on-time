import { berlinInstant } from "./check";
import type { CheckReason, CheckStatus, LegView } from "./check";
import { modeLabel, type Mode } from "./mode";
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
    leave: "Ich verlasse das Büro",
    notLeft: "Noch nicht aufgebrochen.",
    choose: "Als heutige Verbindung",
    chosen: "Heutige Verbindung",
    clear: "Wahl aufheben",
    notChecked: "Noch nicht geprüft.",
    saveFailed: "Der Stand konnte nicht gespeichert werden.",
    legsSummary: "Abschnitte",
    walking: "Fußweg",
    transfer: "Umstieg",
    cancelledLeg: "Fällt aus",
    alternative: "Alternative",
    suggestions: "Vorschläge",
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
    leave: "I'm leaving the office",
    notLeft: "Not left yet.",
    choose: "Use as today's connection",
    chosen: "Today's connection",
    clear: "Clear choice",
    notChecked: "Not checked yet.",
    saveFailed: "The result could not be saved.",
    legsSummary: "Legs",
    walking: "Walk",
    transfer: "Transfer",
    cancelledLeg: "Cancelled",
    alternative: "Alternative",
    suggestions: "Suggestions",
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

export function noPreferredLabel(language: Language, mode: string) {
  const name = modeLabel(language, mode as Mode);
  return language === "de" ? `Keine passende Verbindung mit ${name}.` : `No fitting connection with ${name}.`;
}

export function leftAtLabel(language: Language, leftAt: string) {
  const time = clockLabel(leftAt);
  return language === "de" ? `Aufbruch um ${time}` : `Left at ${time}`;
}

export function ageLabel(language: Language, checkedAt: string, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(checkedAt).getTime()) / 60000));
  if (minutes < 1) return language === "de" ? "gerade eben" : "just now";
  const span = durationLabel(minutes);
  return language === "de" ? `vor ${span}` : `${span} ago`;
}

export function failedLabel(language: Language, failedAt: string) {
  const time = clockLabel(failedAt);
  return language === "de"
    ? `Die Prüfung um ${time} hat nicht geklappt. Der Stand ist älter.`
    : `The check at ${time} did not work. This stand is older.`;
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

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function connectionSummary(language: Language, legs: LegView[]) {
  const first = legs[0];
  const last = legs[legs.length - 1];
  if (!first || !last) return null;

  const total = Math.round((new Date(last.arrival).getTime() - new Date(first.departure).getTime()) / 60000);
  const duration = durationLabel(total);

  const rides = legs.filter((leg) => !leg.walking).length;
  const changes = Math.max(0, rides - 1);
  const transfers =
    changes === 0
      ? language === "de" ? "direkt" : "direct"
      : language === "de"
        ? `${changes} ${changes === 1 ? "Umstieg" : "Umstiege"}`
        : `${changes} ${changes === 1 ? "transfer" : "transfers"}`;

  return {
    departure: clockLabel(first.departure),
    arrival: clockLabel(last.arrival),
    duration,
    transfers,
  };
}
