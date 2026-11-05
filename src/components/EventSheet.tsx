import { AirplaneTilt, CalendarBlank, Clock, MapPin, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import type { CalendarEvent, EventStatus, Role, Stream } from "../types";
import { CITY_TIME_ZONES, formatCentralSecondary, formatFlight, formatLongDate, formatTimeRange } from "../utils/time";

interface Props {
  event: CalendarEvent | null;
  streams: Stream[];
  role: Role;
  showCentral: boolean;
  mode: "view" | "edit";
  onClose: () => void;
  onEdit: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

function localInput(iso: string, timeZone: string) {
  return formatInTimeZone(iso, timeZone, "yyyy-MM-dd'T'HH:mm");
}

export default function EventSheet({ event, streams, role, showCentral, mode, onClose, onEdit, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<CalendarEvent | null>(event);
  const [error, setError] = useState("");
  useEffect(() => setDraft(event), [event]);
  if (!event || !draft) return null;
  const flight = formatFlight(event);
  const eventStreams = streams.filter((stream) => event.streamIds.includes(stream.id));

  const update = <K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.location.trim() || !draft.owner.trim() || draft.streamIds.length === 0) {
      setError("Title, location, owner, and at least one stream are required.");
      return;
    }
    onSave(draft);
  };

  const setDateTime = (key: "startAt" | "endAt", value: string) => {
    update(key, fromZonedTime(value, draft.timeZone).toISOString());
  };

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="event-sheet" role="dialog" aria-modal="true" aria-labelledby="event-sheet-title">
        <header className="sheet-header">
          <button className="icon-button" onClick={onClose} aria-label="Close event"><X size={22} /></button>
          <span>{mode === "edit" ? "Edit event" : "Event details"}</span>
          {role !== "Viewer" && mode === "view" ? <button className="icon-button" onClick={onEdit} aria-label="Edit event"><PencilSimple size={22} /></button> : <span className="icon-spacer" />}
        </header>
        {mode === "view" ? (
          <div className="sheet-content">
            <div className="event-hero">
              <div className="event-stream-bars">{eventStreams.map((stream) => <span key={stream.id} style={{ backgroundColor: stream.color }} />)}</div>
              <span className={`status status-${event.status.toLowerCase()}`}>{event.status}</span>
              <h2 id="event-sheet-title">{event.title}</h2>
              <p><CalendarBlank size={18} />{formatLongDate(event.startAt, event.timeZone)}</p>
              <p><Clock size={18} />{formatTimeRange(event)}{showCentral && event.timeZone !== "America/Chicago" ? ` (${formatCentralSecondary(event)})` : ""}</p>
              <p><MapPin size={18} />{event.location}</p>
            </div>
            {flight && event.flight && (
              <div className="flight-card">
                <AirplaneTilt size={24} />
                <div><span>{event.flight.origin}</span><strong>{flight.departure}</strong></div>
                <div className="flight-line" />
                <div><span>{event.flight.destination}</span><strong>{flight.arrival}</strong></div>
              </div>
            )}
            {event.changeNote && <div className="change-note"><strong>What changed</strong><p>{event.changeNote}</p></div>}
            <dl className="event-details">
              <div><dt>Meeting point</dt><dd>{event.meetingPoint}</dd></div>
              <div><dt>Owner</dt><dd>{event.owner}</dd></div>
              <div><dt>Audience</dt><dd>{event.audience}</dd></div>
              <div><dt>Streams</dt><dd>{eventStreams.map((stream) => stream.name).join(", ")}</dd></div>
              {event.transportationNotes && <div><dt>Transportation</dt><dd>{event.transportationNotes}</dd></div>}
              {event.description && <div><dt>Notes</dt><dd>{event.description}</dd></div>}
            </dl>
            <p className="sample-notice">Fictional sample data for prototype review.</p>
          </div>
        ) : (
          <form className="event-form" onSubmit={submit}>
            <label>Title<input value={draft.title} onChange={(e) => update("title", e.target.value)} /></label>
            <div className="form-row">
              <label>City<select value={draft.city} onChange={(e) => { const city = e.target.value as keyof typeof CITY_TIME_ZONES; update("city", city); update("timeZone", CITY_TIME_ZONES[city]); }}><option>Paris</option><option>Manchester</option><option>San Antonio</option></select></label>
              <label>Time zone<input value={draft.timeZone} onChange={(e) => update("timeZone", e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Starts<input type="datetime-local" value={localInput(draft.startAt, draft.timeZone)} onChange={(e) => setDateTime("startAt", e.target.value)} /></label>
              <label>Ends<input type="datetime-local" value={localInput(draft.endAt, draft.timeZone)} onChange={(e) => setDateTime("endAt", e.target.value)} /></label>
            </div>
            <label>Location<input value={draft.location} onChange={(e) => update("location", e.target.value)} /></label>
            <label>Meeting point<input value={draft.meetingPoint} onChange={(e) => update("meetingPoint", e.target.value)} /></label>
            <div className="form-row">
              <label>Owner<input value={draft.owner} onChange={(e) => update("owner", e.target.value)} /></label>
              <label>Audience<input value={draft.audience} onChange={(e) => update("audience", e.target.value)} /></label>
            </div>
            <label>Status<select value={draft.status} onChange={(e) => update("status", e.target.value as EventStatus)}><option>Confirmed</option><option>Tentative</option><option>Changed</option><option>Canceled</option></select></label>
            <fieldset><legend>Streams</legend><div className="stream-checkboxes">{streams.filter((stream) => stream.active || draft.streamIds.includes(stream.id)).map((stream) => <label key={stream.id}><input type="checkbox" checked={draft.streamIds.includes(stream.id)} onChange={(e) => update("streamIds", e.target.checked ? [...draft.streamIds, stream.id] : draft.streamIds.filter((id) => id !== stream.id))} /><span style={{ backgroundColor: stream.color }} />{stream.name}</label>)}</div></fieldset>
            <label>Change note<textarea value={draft.changeNote ?? ""} onChange={(e) => update("changeNote", e.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="button" className="danger-button" onClick={() => { if (window.confirm("Delete this sample event?")) onDelete(event.id); }}><Trash size={18} />Delete</button>
              <button className="primary-button" type="submit">Save event</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
