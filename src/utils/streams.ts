import type { CalendarEvent, Stream } from "../types";

export function deleteStreamSafely(
  streams: Stream[],
  events: CalendarEvent[],
  streamId: string,
  replacementId?: string,
): { streams: Stream[]; events: CalendarEvent[] } {
  const nextStreams = streams.filter((stream) => stream.id !== streamId);
  const fallback = replacementId && replacementId !== streamId ? replacementId : undefined;
  const nextEvents = events.map((event) => {
    if (!event.streamIds.includes(streamId)) return event;
    const remaining = event.streamIds.filter((id) => id !== streamId);
    const streamIds = fallback && !remaining.includes(fallback) ? [...remaining, fallback] : remaining;
    if (streamIds.length === 0) {
      throw new Error(`Event ${event.id} would have no stream`);
    }
    return { ...event, streamIds };
  });
  return { streams: nextStreams, events: nextEvents };
}

export function countStreamEvents(events: CalendarEvent[], streamId: string): number {
  return events.filter((event) => event.streamIds.includes(streamId)).length;
}
