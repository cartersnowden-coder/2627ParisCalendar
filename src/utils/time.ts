import { formatInTimeZone } from "date-fns-tz";
import type { CalendarEvent } from "../types";

export const CITY_TIME_ZONES = {
  Paris: "Europe/Paris",
  Manchester: "Europe/London",
  "San Antonio": "America/Chicago",
} as const;

export function formatEventTime(iso: string, timeZone: string): string {
  return formatInTimeZone(iso, timeZone, "h:mm a");
}

export function formatEventDate(iso: string, timeZone: string): string {
  return formatInTimeZone(iso, timeZone, "yyyy-MM-dd");
}

export function formatShortDate(iso: string, timeZone: string): string {
  return formatInTimeZone(iso, timeZone, "EEE, MMM d");
}

export function formatLongDate(iso: string, timeZone: string): string {
  return formatInTimeZone(iso, timeZone, "EEEE, MMMM d");
}

export function formatZone(iso: string, timeZone: string): string {
  return formatInTimeZone(iso, timeZone, "zzz");
}

export function formatTimeRange(event: CalendarEvent): string {
  const start = formatEventTime(event.startAt, event.timeZone);
  const end = formatEventTime(event.endAt, event.timeZone);
  return `${start} - ${end} ${formatZone(event.startAt, event.timeZone)}`;
}

export function minutesInLocalDay(iso: string, timeZone: string): number {
  const hours = Number(formatInTimeZone(iso, timeZone, "H"));
  const minutes = Number(formatInTimeZone(iso, timeZone, "m"));
  return hours * 60 + minutes;
}

export function eventLocalDate(event: CalendarEvent): string {
  return formatEventDate(event.startAt, event.timeZone);
}

export function formatFlight(event: CalendarEvent): { departure: string; arrival: string } | null {
  if (!event.flight) return null;
  return {
    departure: `${formatEventTime(event.startAt, event.flight.originTimeZone)} ${formatZone(event.startAt, event.flight.originTimeZone)}`,
    arrival: `${formatEventTime(event.flight.arrivalAt, event.flight.destinationTimeZone)} ${formatZone(event.flight.arrivalAt, event.flight.destinationTimeZone)}`,
  };
}

export function formatCentralSecondary(event: CalendarEvent): string {
  return `${formatEventTime(event.startAt, "America/Chicago")} CT`;
}
