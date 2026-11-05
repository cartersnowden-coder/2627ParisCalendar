import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../types";
import { eventLocalDate, formatCentralSecondary, formatEventTime, formatFlight } from "./time";

const flight: CalendarEvent = {
  id: "flight",
  title: "Return flight",
  startAt: "2027-01-26T10:20:00+00:00",
  endAt: "2027-01-26T15:10:00-06:00",
  timeZone: "Europe/London",
  city: "Manchester",
  allDay: false,
  streamIds: ["travel"],
  location: "MAN",
  meetingPoint: "Check-in",
  owner: "Travel",
  audience: "Staff",
  status: "Confirmed",
  flight: {
    origin: "Manchester",
    originTimeZone: "Europe/London",
    destination: "San Antonio",
    destinationTimeZone: "America/Chicago",
    arrivalAt: "2027-01-26T15:10:00-06:00",
  },
};

describe("event-local time formatting", () => {
  it("uses a 12-hour clock in Paris, Manchester, and San Antonio", () => {
    const instant = "2027-01-21T19:00:00+01:00";
    expect(formatEventTime(instant, "Europe/Paris")).toBe("7:00 PM");
    expect(formatEventTime(instant, "Europe/London")).toBe("6:00 PM");
    expect(formatEventTime(instant, "America/Chicago")).toBe("12:00 PM");
  });

  it("shows flight departure and arrival in their own zones", () => {
    expect(formatFlight(flight)).toEqual({ departure: "10:20 AM GMT", arrival: "3:10 PM CST" });
  });

  it("handles local dates near midnight and daylight-saving offsets", () => {
    expect(eventLocalDate({ ...flight, startAt: "2027-01-21T23:30:00-06:00", timeZone: "Europe/Paris" })).toBe("2027-01-22");
    expect(formatEventTime("2027-07-01T12:00:00Z", "Europe/Paris")).toBe("2:00 PM");
    expect(formatEventTime("2027-07-01T12:00:00Z", "America/Chicago")).toBe("7:00 AM");
  });

  it("labels optional central time secondarily", () => {
    expect(formatCentralSecondary(flight)).toBe("4:20 AM CT");
  });
});
