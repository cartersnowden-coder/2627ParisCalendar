import { beforeEach, describe, expect, it } from "vitest";
import { seedEmergencySections } from "../emergencyData";
import { DESKTOP_VIEW_ORDER, MOBILE_PRIMARY_ORDER } from "../navigation";
import type { EmergencySection } from "../types";
import {
  canEditEmergency,
  confirmEmergencySection,
  emergencyDocumentHref,
  emergencyPhoneHref,
  readEmergencySections,
  saveEmergencyDraft,
  sectionsForLocation,
  writeEmergencySections,
} from "./emergency";

const baseSection: EmergencySection = {
  id: "test",
  title: "Test guidance",
  guidance: "Official guidance supplied for testing.",
  location: "Paris",
  status: "Draft",
  order: 1,
};

describe("emergency information safeguards", () => {
  beforeEach(() => localStorage.clear());

  it("places Emergency last in desktop and five-item mobile navigation", () => {
    expect(DESKTOP_VIEW_ORDER.at(-1)).toBe("emergency");
    expect(MOBILE_PRIMARY_ORDER).toHaveLength(5);
    expect(MOBILE_PRIMARY_ORDER.at(-1)).toBe("emergency");
  });

  it("keeps Emergency reachable alongside every calendar view", () => {
    expect(DESKTOP_VIEW_ORDER).toEqual(["today", "three-day", "week", "month", "emergency"]);
  });

  it("allows only Admin to edit emergency content", () => {
    expect(canEditEmergency("Admin")).toBe(true);
    expect(canEditEmergency("Editor")).toBe(false);
    expect(canEditEmergency("Viewer")).toBe(false);
  });

  it("contains every required location and safe sample status", () => {
    expect(new Set(seedEmergencySections.map(({ location }) => location))).toEqual(new Set(["Trip-wide", "Paris", "Manchester", "San Antonio"]));
    expect(seedEmergencySections.some(({ location, status }) => location === "Paris" && status === "Draft")).toBe(true);
    expect(seedEmergencySections.some(({ location, status }) => location === "Manchester" && status === "Pending NBA")).toBe(true);
    expect(seedEmergencySections.some(({ location, status, sampleOnly }) => location === "San Antonio" && status === "Confirmed" && sampleOnly)).toBe(true);
  });

  it("filters and orders sections by location", () => {
    const paris = sectionsForLocation(seedEmergencySections, "Paris");
    expect(paris.length).toBeGreaterThan(0);
    expect(paris.every(({ location }) => location === "Paris")).toBe(true);
    expect(paris.map(({ order }) => order)).toEqual([...paris.map(({ order }) => order)].sort((a, b) => a - b));
  });

  it("saves edits as Draft before they can be confirmed", () => {
    const date = new Date("2026-11-02T18:00:00Z");
    const draft = saveEmergencyDraft({ ...baseSection, status: "Confirmed", sampleOnly: true }, date);
    expect(draft.status).toBe("Draft");
    expect(draft.sampleOnly).toBe(false);
    expect(draft.updatedAt).toBe(date.toISOString());
  });

  it("marks a reviewed draft Confirmed in a separate operation", () => {
    expect(confirmEmergencySection(baseSection, new Date("2026-11-02T18:00:00Z")).status).toBe("Confirmed");
  });

  it("never makes pending, draft, sample, or invalid phones callable", () => {
    expect(emergencyPhoneHref({ ...baseSection, phone: "+33123456789" })).toBeNull();
    expect(emergencyPhoneHref({ ...baseSection, status: "Pending NBA", phone: "+33123456789" })).toBeNull();
    expect(emergencyPhoneHref({ ...baseSection, status: "Confirmed", sampleOnly: true, phone: "+33123456789" })).toBeNull();
    expect(emergencyPhoneHref({ ...baseSection, status: "Confirmed", phone: "contact pending" })).toBeNull();
  });

  it("creates a tel link only for a confirmed valid international number", () => {
    expect(emergencyPhoneHref({ ...baseSection, status: "Confirmed", phone: "+33 1 23 45 67 89" })).toBe("tel:+33123456789");
  });

  it("allows only confirmed secure document links", () => {
    expect(emergencyDocumentHref({ ...baseSection, status: "Confirmed", url: "https://example.org/protocol" })).toBe("https://example.org/protocol");
    expect(emergencyDocumentHref({ ...baseSection, status: "Confirmed", url: "http://example.org/protocol" })).toBeNull();
    expect(emergencyDocumentHref({ ...baseSection, url: "https://example.org/protocol" })).toBeNull();
  });

  it("persists sections locally and falls back safely when storage is invalid", () => {
    writeEmergencySections(localStorage, [baseSection]);
    expect(readEmergencySections(localStorage, [])).toEqual([baseSection]);
    localStorage.setItem("sse-emergency-sections-v2", "not-json");
    expect(readEmergencySections(localStorage, seedEmergencySections)).toBe(seedEmergencySections);
  });

  it("preserves long official text without transforming or truncating it", () => {
    const longGuidance = "Official guidance ".repeat(150);
    const saved = saveEmergencyDraft({ ...baseSection, guidance: longGuidance });
    expect(saved.guidance).toBe(longGuidance);
  });
});
