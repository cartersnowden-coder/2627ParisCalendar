import type { CalendarEvent, EventLane } from "../types";

function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
  return Date.parse(a.startAt) < Date.parse(b.endAt) && Date.parse(b.startAt) < Date.parse(a.endAt);
}

export function assignOverlapLanes(events: CalendarEvent[]): EventLane[] {
  const sorted = [...events].sort((a, b) => {
    const startDiff = Date.parse(a.startAt) - Date.parse(b.startAt);
    if (startDiff !== 0) return startDiff;
    const durationA = Date.parse(a.endAt) - Date.parse(a.startAt);
    const durationB = Date.parse(b.endAt) - Date.parse(b.startAt);
    return durationB - durationA || a.id.localeCompare(b.id);
  });

  const result: EventLane[] = [];
  let group: CalendarEvent[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    if (!group.length) return;
    const laneEnds: number[] = [];
    const provisional = group.map((event) => {
      const start = Date.parse(event.startAt);
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = Date.parse(event.endAt);
      return { event, lane, laneCount: 0 };
    });
    const laneCount = laneEnds.length;
    provisional.forEach((item) => result.push({ ...item, laneCount }));
    group = [];
    groupEnd = -Infinity;
  };

  sorted.forEach((event) => {
    const start = Date.parse(event.startAt);
    if (group.length && start >= groupEnd) flush();
    group.push(event);
    groupEnd = Math.max(groupEnd, Date.parse(event.endAt));
  });
  flush();

  return result;
}

export function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  return overlaps(a, b);
}
