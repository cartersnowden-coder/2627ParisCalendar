import type { CalendarView } from "./types";

export const DESKTOP_VIEW_ORDER: CalendarView[] = ["today", "three-day", "week", "month", "emergency"];
export const MOBILE_PRIMARY_ORDER = ["today", "calendar", "my-view", "manage", "emergency"] as const;
