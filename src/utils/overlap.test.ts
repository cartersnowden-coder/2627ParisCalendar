import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../types";
import { assignOverlapLanes, eventsOverlap } from "./overlap";

function event(id: string, start: string, end: string): CalendarEvent {
  return {
    id,
    title: id,
    startAt: start,
    endAt: end,
    timeZone: "Europe/Paris",
    city: "Paris",
    allDay: false,
    streamIds: ["staff"],
    location: "Test",
    meetingPoint: "Test",
    owner: "Test",
    audience: "Test",
    status: "Confirmed",
  };
}

describe("assignOverlapLanes", () => {
  it("keeps back-to-back events in one lane", () => {
    const result = assignOverlapLanes([
      event("a", "2027-01-21T09:00:00+01:00", "2027-01-21T10:00:00+01:00"),
      event("b", "2027-01-21T10:00:00+01:00", "2027-01-21T11:00:00+01:00"),
    ]);
    expect(result.map(({ laneCount }) => laneCount)).toEqual([1, 1]);
    expect(eventsOverlap(result[0].event, result[1].event)).toBe(false);
  });

  it("assigns separate lanes to partial, nested, and identical overlaps", () => {
    const result = assignOverlapLanes([
      event("nested", "2027-01-21T09:30:00+01:00", "2027-01-21T10:30:00+01:00"),
      event("long", "2027-01-21T09:00:00+01:00", "2027-01-21T12:00:00+01:00"),
      event("same-b", "2027-01-21T10:30:00+01:00", "2027-01-21T11:30:00+01:00"),
      event("same-a", "2027-01-21T10:30:00+01:00", "2027-01-21T11:30:00+01:00"),
    ]);
    expect(new Set(result.map(({ lane }) => lane)).size).toBe(3);
    expect(result.every(({ laneCount }) => laneCount === 3)).toBe(true);
  });

  it("is deterministic regardless of input order", () => {
    const items = [
      event("a", "2027-01-21T10:00:00+01:00", "2027-01-21T12:00:00+01:00"),
      event("b", "2027-01-21T10:00:00+01:00", "2027-01-21T11:00:00+01:00"),
      event("c", "2027-01-21T10:30:00+01:00", "2027-01-21T11:30:00+01:00"),
    ];
    const simplify = (input: CalendarEvent[]) => assignOverlapLanes(input).map(({ event: item, lane, laneCount }) => [item.id, lane, laneCount]);
    expect(simplify(items)).toEqual(simplify([...items].reverse()));
  });
});
