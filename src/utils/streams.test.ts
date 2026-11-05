import { describe, expect, it } from "vitest";
import { seedEvents, seedStreams } from "../data";
import { countStreamEvents, deleteStreamSafely } from "./streams";

describe("stream management", () => {
  it("removes a stream and reassigns affected events without deleting them", () => {
    const result = deleteStreamSafely(seedStreams, seedEvents, "staff", "travel");
    expect(result.streams.some(({ id }) => id === "staff")).toBe(false);
    expect(result.events).toHaveLength(seedEvents.length);
    expect(result.events.every(({ streamIds }) => !streamIds.includes("staff"))).toBe(true);
    expect(result.events.filter(({ streamIds }) => streamIds.includes("travel")).length).toBeGreaterThan(countStreamEvents(seedEvents, "travel"));
  });

  it("blocks deletion when an event would be left with no stream", () => {
    expect(() => deleteStreamSafely(seedStreams, seedEvents, "staff")).toThrow(/would have no stream/);
  });
});
