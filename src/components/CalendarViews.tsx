import { CaretRight, Clock, MapPin } from "@phosphor-icons/react";
import { addDays, format, parseISO, startOfMonth } from "date-fns";
import type { CalendarEvent, Stream } from "../types";
import { assignOverlapLanes } from "../utils/overlap";
import {
  eventLocalDate,
  formatCentralSecondary,
  formatEventTime,
  formatLongDate,
  minutesInLocalDay,
} from "../utils/time";

interface ViewProps {
  events: CalendarEvent[];
  streams: Stream[];
  selectedDate: string;
  showCentral: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: string) => void;
}

function streamFor(event: CalendarEvent, streams: Stream[]): Stream | undefined {
  return streams.find((stream) => stream.id === event.streamIds[0]);
}

function EventStatus({ status }: { status: CalendarEvent["status"] }) {
  if (status === "Confirmed") return null;
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

export function TodayView({ events, streams, selectedDate, showCentral, onEventClick }: ViewProps) {
  const dayEvents = events
    .filter((event) => eventLocalDate(event) === selectedDate)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  return (
    <section className="today-view" aria-label="Selected day agenda">
      <header className="view-heading">
        <div>
          <p className="view-kicker">Today in the trip</p>
          <h1>{dayEvents[0] ? formatLongDate(dayEvents[0].startAt, dayEvents[0].timeZone) : selectedDate}</h1>
        </div>
        <span className="event-count">{dayEvents.length} events</span>
      </header>
      {dayEvents.length === 0 ? (
        <div className="empty-state"><h2>No events scheduled</h2><p>Choose another day or clear active filters.</p></div>
      ) : (
        <div className="agenda-list">
          {dayEvents.map((event, index) => {
            const stream = streamFor(event, streams);
            return (
              <button className={`agenda-event ${event.status === "Canceled" ? "is-canceled" : ""}`} key={event.id} onClick={() => onEventClick(event)}>
                <span className="agenda-rail" style={{ backgroundColor: stream?.color }} />
                <span className="agenda-time">
                  <strong>{formatEventTime(event.startAt, event.timeZone)}</strong>
                  <small>{event.city}</small>
                </span>
                <span className="agenda-content">
                  <span className="agenda-title-row">
                    <strong>{event.title}</strong>
                    <EventStatus status={event.status} />
                  </span>
                  <span className="agenda-meta"><MapPin size={15} />{event.location}</span>
                  <span className="stream-name">{stream?.name}</span>
                  {showCentral && event.timeZone !== "America/Chicago" && <small className="secondary-time">{formatCentralSecondary(event)}</small>}
                </span>
                {index === 0 && <span className="next-label">Next</span>}
                <CaretRight className="agenda-caret" size={20} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function dayEvents(events: CalendarEvent[], date: string) {
  return events.filter((event) => eventLocalDate(event) === date && !event.allDay);
}

export function WeekView({ events, streams, selectedDate, showCentral, onEventClick }: ViewProps & { days?: number }) {
  const dates = Array.from({ length: 7 }, (_, index) => format(addDays(parseISO(selectedDate), index), "yyyy-MM-dd"));
  const weekLabel = `${format(parseISO(dates[0]), "MMM d")}-${format(parseISO(dates[6]), "d")}`;
  const startMinute = 7 * 60;
  const endMinute = 23 * 60;
  const pixelsPerMinute = 0.72;

  return (
    <section className="week-view" aria-label="Week calendar">
      <header className="view-heading">
        <div><p className="view-kicker">Operational week</p><h1>{weekLabel}</h1></div>
        <span className="event-count">Local event time</span>
      </header>
      <div className="week-scroll" tabIndex={0} aria-label="Scrollable week time grid">
        <div className="week-grid">
          {dates.map((date) => {
            const eventsForDay = dayEvents(events, date);
            const lanes = assignOverlapLanes(eventsForDay);
            return (
              <article className="week-day" key={date}>
                <header><span>{format(parseISO(date), "EEE")}</span><strong>{format(parseISO(date), "d")}</strong><small>{eventsForDay.length} events</small></header>
                <div className="week-day-canvas" style={{ height: (endMinute - startMinute) * pixelsPerMinute }}>
                  {[8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
                    <div className="hour-line" key={hour} style={{ top: (hour * 60 - startMinute) * pixelsPerMinute }}><span>{hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}</span></div>
                  ))}
                  {lanes.map(({ event, lane, laneCount }) => {
                    const stream = streamFor(event, streams);
                    const top = Math.max(0, (minutesInLocalDay(event.startAt, event.timeZone) - startMinute) * pixelsPerMinute);
                    const height = Math.max(44, (Date.parse(event.endAt) - Date.parse(event.startAt)) / 60000 * pixelsPerMinute);
                    return (
                      <button
                        key={event.id}
                        className={`week-event ${event.status === "Canceled" ? "is-canceled" : ""}`}
                        style={{
                          top,
                          height,
                          left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                          width: `calc(${100 / laneCount}% - 4px)`,
                          borderLeftColor: stream?.color,
                          backgroundColor: `${stream?.color}18`,
                        }}
                        onClick={() => onEventClick(event)}
                        aria-label={`${event.title}, ${formatEventTime(event.startAt, event.timeZone)}, ${stream?.name}`}
                      >
                        <strong>{event.title}</strong>
                        <span>{formatEventTime(event.startAt, event.timeZone)}</span>
                        <small>{stream?.name}</small>
                        {showCentral && event.timeZone !== "America/Chicago" && <small>{formatCentralSecondary(event)}</small>}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ThreeDayView(props: ViewProps) {
  const dates = Array.from({ length: 3 }, (_, index) => format(addDays(parseISO(props.selectedDate), index), "yyyy-MM-dd"));
  return (
    <section className="three-day-view" aria-label="Three day calendar">
      <header className="view-heading"><div><p className="view-kicker">Near-term view</p><h1>Next three days</h1></div></header>
      <div className="three-day-columns">
        {dates.map((date) => (
          <article key={date}>
            <h2>{format(parseISO(date), "EEEE, MMM d")}</h2>
            {dayEvents(props.events, date).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)).map((event) => {
              const stream = streamFor(event, props.streams);
              return (
                <button className="compact-event" key={event.id} onClick={() => props.onEventClick(event)} style={{ borderLeftColor: stream?.color }}>
                  <span>{formatEventTime(event.startAt, event.timeZone)}</span>
                  <strong>{event.title}</strong>
                  <small>{event.city} | {stream?.name}</small>
                </button>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}

export function MonthView({ events, streams, selectedDate, onEventClick, onDayClick }: ViewProps) {
  const monthStart = startOfMonth(parseISO(selectedDate));
  const firstDayIndex = Number(format(monthStart, "i")) % 7;
  const cells: Array<string | null> = Array(firstDayIndex).fill(null);
  for (let day = 1; day <= 31; day += 1) cells.push(`2027-01-${String(day).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section className="month-view" aria-label="Month calendar">
      <header className="view-heading"><div><p className="view-kicker">Trip month</p><h1>January 2027</h1></div><span className="event-count">Times shown locally</span></header>
      <div className="month-weekdays" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">
        {cells.map((date, index) => {
          if (!date) return <div className="month-cell is-empty" key={`empty-${index}`} />;
          const eventsForDay = dayEvents(events, date).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
          const visible = eventsForDay.slice(0, 3);
          const hidden = eventsForDay.length - visible.length;
          return (
            <article className={`month-cell ${date === selectedDate ? "is-selected" : ""}`} key={date}>
              <button className="month-date" onClick={() => onDayClick(date)} aria-label={`Open ${date} agenda`}>{Number(date.slice(-2))}</button>
              <div className="month-events">
                {visible.map((event) => {
                  const stream = streamFor(event, streams);
                  return (
                    <button className="month-event" key={event.id} onClick={() => onEventClick(event)} style={{ borderLeftColor: stream?.color }} title={`${formatEventTime(event.startAt, event.timeZone)} ${event.title}`}>
                      <span>{formatEventTime(event.startAt, event.timeZone)}</span><strong>{event.title}</strong>
                    </button>
                  );
                })}
                {hidden > 0 && <button className="more-events" onClick={() => onDayClick(date)}>+{hidden} more</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
