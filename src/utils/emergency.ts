import type { EmergencyLocation, EmergencySection, Role } from "../types";

export const EMERGENCY_STORAGE_KEY = "sse-emergency-sections-v2";

export function canEditEmergency(role: Role): boolean {
  return role === "Admin";
}

export function sectionsForLocation(sections: EmergencySection[], location: EmergencyLocation): EmergencySection[] {
  return sections.filter((section) => section.location === location).sort((a, b) => a.order - b.order);
}

export function saveEmergencyDraft(section: EmergencySection, now = new Date()): EmergencySection {
  return { ...section, status: "Draft", sampleOnly: false, updatedAt: now.toISOString() };
}

export function confirmEmergencySection(section: EmergencySection, now = new Date()): EmergencySection {
  return { ...section, status: "Confirmed", sampleOnly: false, updatedAt: now.toISOString() };
}

export function emergencyPhoneHref(section: EmergencySection): string | null {
  if (section.status !== "Confirmed" || section.sampleOnly || !section.phone) return null;
  const normalized = section.phone.replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? `tel:${normalized}` : null;
}

export function emergencyDocumentHref(section: EmergencySection): string | null {
  if (section.status !== "Confirmed" || section.sampleOnly || !section.url) return null;
  try {
    const parsed = new URL(section.url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function readEmergencySections(storage: Pick<Storage, "getItem">, fallback: EmergencySection[]): EmergencySection[] {
  try {
    const stored = storage.getItem(EMERGENCY_STORAGE_KEY);
    return stored ? JSON.parse(stored) as EmergencySection[] : fallback;
  } catch {
    return fallback;
  }
}

export function writeEmergencySections(storage: Pick<Storage, "setItem">, sections: EmergencySection[]): void {
  storage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(sections));
}
