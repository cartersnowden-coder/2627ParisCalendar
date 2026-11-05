export type Role = "Admin" | "Editor" | "Viewer";
export type CalendarView = "today" | "three-day" | "week" | "month" | "emergency";
export type EventStatus = "Confirmed" | "Tentative" | "Changed" | "Canceled";
export type EmergencyLocation = "Trip-wide" | "Paris" | "Manchester" | "San Antonio";
export type EmergencyStatus = "Pending NBA" | "Draft" | "Confirmed";

export interface Stream {
  id: string;
  name: string;
  color: string;
  icon: string;
  active: boolean;
  sortOrder: number;
}

export interface FlightDetails {
  origin: string;
  originTimeZone: string;
  destination: string;
  destinationTimeZone: string;
  arrivalAt: string;
  flightNumber?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  city: string;
  allDay: boolean;
  streamIds: string[];
  location: string;
  meetingPoint: string;
  owner: string;
  audience: string;
  status: EventStatus;
  description?: string;
  transportationNotes?: string;
  changeNote?: string;
  updatedAt?: string;
  recurring?: boolean;
  flight?: FlightDetails;
}

export interface EventLane {
  event: CalendarEvent;
  lane: number;
  laneCount: number;
}

export interface EmergencySection {
  id: string;
  title: string;
  guidance: string;
  location: EmergencyLocation;
  status: EmergencyStatus;
  order: number;
  contactLabel?: string;
  phone?: string;
  documentLabel?: string;
  url?: string;
  sourceOwner?: string;
  updatedAt?: string;
  sampleOnly?: boolean;
  primary?: boolean;
}
