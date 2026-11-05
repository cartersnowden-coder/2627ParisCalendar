import { CalendarBlank, CalendarDots, ClockCounterClockwise, Gear, List, MagnifyingGlass, Plus, ShieldWarning, SlidersHorizontal, UsersThree } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { demoDates, seedEvents, seedStreams } from "./data";
import { MonthView, ThreeDayView, TodayView, WeekView } from "./components/CalendarViews";
import EventSheet from "./components/EventSheet";
import StreamSettings from "./components/StreamSettings";
import EmergencyPage from "./components/EmergencyPage";
import { seedEmergencySections } from "./emergencyData";
import { DESKTOP_VIEW_ORDER } from "./navigation";
import type { CalendarEvent, CalendarView, EmergencySection, Role, Stream } from "./types";
import { readEmergencySections, writeEmergencySections } from "./utils/emergency";
import { eventLocalDate } from "./utils/time";
import { deleteStreamSafely } from "./utils/streams";

const STREAMS_KEY = "sse-demo-streams-v2";
const EVENTS_KEY = "sse-demo-events-v2";

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

const blankEvent = (): CalendarEvent => ({
  id: `event-${crypto.randomUUID()}`,
  title: "",
  startAt: "2027-01-22T09:00:00+01:00",
  endAt: "2027-01-22T10:00:00+01:00",
  timeZone: "Europe/Paris",
  city: "Paris",
  allDay: false,
  streamIds: ["staff"],
  location: "",
  meetingPoint: "",
  owner: "",
  audience: "All staff",
  status: "Confirmed",
});

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => readStored(EVENTS_KEY, seedEvents));
  const [streams, setStreams] = useState<Stream[]>(() => readStored(STREAMS_KEY, seedStreams));
  const [emergencySections, setEmergencySections] = useState<EmergencySection[]>(() => readEmergencySections(localStorage, seedEmergencySections));
  const [view, setView] = useState<CalendarView>("today");
  const [selectedDate, setSelectedDate] = useState("2027-01-20");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [role, setRole] = useState<Role>("Admin");
  const [search, setSearch] = useState("");
  const [activeStreams, setActiveStreams] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCentral, setShowCentral] = useState(false);

  useEffect(() => localStorage.setItem(EVENTS_KEY, JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem(STREAMS_KEY, JSON.stringify(streams)), [streams]);
  useEffect(() => writeEmergencySections(localStorage, emergencySections), [emergencySections]);
  useEffect(() => { document.title = view === "emergency" ? "Emergency | Les Spurs 2027" : "Les Spurs 2027 | Operations Calendar"; }, [view]);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [event.title, event.location, event.owner, event.description, event.transportationNotes].some((value) => value?.toLowerCase().includes(query));
    const matchesStream = activeStreams.length === 0 || event.streamIds.some((id) => activeStreams.includes(id));
    return matchesQuery && matchesStream;
  }), [events, search, activeStreams]);

  const visibleStreams = streams.filter((stream) => stream.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const activeFilterCount = activeStreams.length + (search ? 1 : 0);

  const openEvent = (event: CalendarEvent) => { setSelectedEvent(event); setSheetMode("view"); };
  const saveEvent = (event: CalendarEvent) => {
    setEvents((current) => current.some((item) => item.id === event.id) ? current.map((item) => item.id === event.id ? event : item) : [...current, event]);
    setSelectedEvent(event);
    setSheetMode("view");
  };
  const deleteEvent = (id: string) => { setEvents((current) => current.filter((event) => event.id !== id)); setSelectedEvent(null); };
  const addEvent = () => { setSelectedEvent(blankEvent()); setSheetMode("edit"); };
  const dayClick = (date: string) => { setSelectedDate(date); setView("today"); };
  const deleteStream = (id: string, replacementId?: string) => {
    try {
      const next = deleteStreamSafely(streams, events, id, replacementId);
      setStreams(next.streams);
      setEvents(next.events);
      setActiveStreams((current) => current.filter((item) => item !== id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete stream");
    }
  };

  const viewProps = { events: filteredEvents, streams, selectedDate, showCentral, onEventClick: openEvent, onDayClick: dayClick };

  return (
    <div className="app-shell">
      <header className="brand-header">
        <div className="brand-lockup"><img src="/brand/les-spurs-white.png" alt="Les Spurs 2027" /><div><span>Global Games</span><strong>Operations calendar</strong></div></div>
        <div className="header-actions">
          <label className="role-switcher"><span>Demo role</span><select value={role} onChange={(e) => setRole(e.target.value as Role)}><option>Admin</option><option>Editor</option><option>Viewer</option></select></label>
          {role === "Admin" && <button className="header-icon" onClick={() => setShowSettings(true)} aria-label="Manage streams"><Gear size={22} /></button>}
        </div>
      </header>

      <div className="prototype-banner"><strong>Prototype</strong><span>{view === "emergency" ? "Emergency content is placeholder-only and not operational." : "Fictional sample schedule. Times display in each event's local zone."}</span></div>

      <main className="calendar-shell">
        <aside className="desktop-sidebar">
          <div className="sidebar-section"><h2>Views</h2>{DESKTOP_VIEW_ORDER.filter((item) => item !== "emergency").map((item) => <button key={item} className={view === item ? "is-active" : ""} onClick={() => setView(item)}>{item === "today" ? <List /> : item === "three-day" ? <ClockCounterClockwise /> : item === "week" ? <CalendarDots /> : <CalendarBlank />}{item === "three-day" ? "3-Day" : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
          <div className="sidebar-section"><h2>Streams</h2><button className={activeStreams.length === 0 ? "is-active" : ""} onClick={() => setActiveStreams([])}>All streams</button>{visibleStreams.map((stream) => <button key={stream.id} onClick={() => setActiveStreams((current) => current.includes(stream.id) ? current.filter((id) => id !== stream.id) : [...current, stream.id])} className={activeStreams.includes(stream.id) ? "is-active" : ""}><span className="sidebar-swatch" style={{ backgroundColor: stream.color }} />{stream.name}</button>)}</div>
          <button className={`desktop-emergency-link ${view === "emergency" ? "is-active" : ""}`} onClick={() => setView("emergency")}><ShieldWarning size={21} />Emergency</button>
        </aside>

        <section className="calendar-main">
          {view !== "emergency" && <><div className="mobile-toolbar">
            <button className="filter-button" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={19} />Filters{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
            <label className="central-toggle"><input type="checkbox" checked={showCentral} onChange={(e) => setShowCentral(e.target.checked)} />Show CT</label>
          </div>

          <div className="search-row">
            <label className="search-box"><MagnifyingGlass size={19} /><input type="search" placeholder="Search events, owners, locations" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <label className="central-toggle desktop-ct"><input type="checkbox" checked={showCentral} onChange={(e) => setShowCentral(e.target.checked)} />Show CT secondarily</label>
          </div>

          <nav className="mobile-view-tabs" aria-label="Calendar view">
            {(["today", "three-day", "week", "month"] as CalendarView[]).map((item) => (
              <button key={item} className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
                {item === "three-day" ? "3-Day" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>

          {showFilters && <div className="mobile-filters"><div className="filter-heading"><strong>Filter streams</strong><button onClick={() => { setActiveStreams([]); setSearch(""); }}>Clear all</button></div>{visibleStreams.map((stream) => <button key={stream.id} className={activeStreams.includes(stream.id) ? "is-active" : ""} onClick={() => setActiveStreams((current) => current.includes(stream.id) ? current.filter((id) => id !== stream.id) : [...current, stream.id])}><span style={{ backgroundColor: stream.color }} />{stream.name}</button>)}</div>}

          <nav className="date-strip" aria-label="Demo dates">{demoDates.map((date) => { const count = filteredEvents.filter((event) => eventLocalDate(event) === date).length; return <button key={date} className={selectedDate === date ? "is-active" : ""} onClick={() => setSelectedDate(date)}><span>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</span><strong>{Number(date.slice(-2))}</strong>{count > 1 && <small>{count}</small>}</button>; })}</nav>

          </>}

          {view === "today" && <TodayView {...viewProps} />}
          {view === "three-day" && <ThreeDayView {...viewProps} />}
          {view === "week" && <WeekView {...viewProps} />}
          {view === "month" && <MonthView {...viewProps} />}
          {view === "emergency" && <EmergencyPage sections={emergencySections} role={role} onChange={setEmergencySections} onReset={() => setEmergencySections(seedEmergencySections)} onReturn={() => setView("today")} />}
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={view === "today" ? "is-active" : ""} onClick={() => setView("today")}><List /><span>Today</span></button>
        <button className={["three-day", "week", "month"].includes(view) ? "is-active" : ""} onClick={() => setView("week")}><CalendarBlank /><span>Calendar</span></button>
        <button onClick={() => { setActiveStreams((current) => current.length ? current : ["staff"]); setShowFilters(true); }}><UsersThree /><span>My View</span></button>
        {role === "Admin" ? <button onClick={() => setShowSettings(true)}><Gear /><span>Manage</span></button> : <button onClick={() => setShowFilters(true)}><SlidersHorizontal /><span>More</span></button>}
        <button className={view === "emergency" ? "is-active is-emergency" : "is-emergency"} onClick={() => setView("emergency")}><ShieldWarning /><span>Emergency</span></button>
      </nav>

      {role !== "Viewer" && view !== "emergency" && <button className="fab" onClick={addEvent} aria-label="Add event"><Plus size={26} weight="bold" /></button>}

      <EventSheet event={selectedEvent} streams={streams} role={role} showCentral={showCentral} mode={sheetMode} onClose={() => setSelectedEvent(null)} onEdit={() => setSheetMode("edit")} onSave={saveEvent} onDelete={deleteEvent} />
      {showSettings && <StreamSettings streams={streams} events={events} onChange={setStreams} onDelete={deleteStream} onReset={() => { setStreams(seedStreams); setActiveStreams([]); }} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
