import { ArrowDown, ArrowUp, Check, Plus, Trash, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { CalendarEvent, Stream } from "../types";
import { countStreamEvents } from "../utils/streams";

interface Props {
  streams: Stream[];
  events: CalendarEvent[];
  onChange: (streams: Stream[]) => void;
  onDelete: (streamId: string, replacementId?: string) => void;
  onReset: () => void;
  onClose: () => void;
}

const palette = ["#7A4E9D", "#247BA0", "#4B6B58", "#A64B2A", "#C07A12", "#3E5AA9", "#9B335F", "#55606A"];

export default function StreamSettings({ streams, events, onChange, onDelete, onReset, onClose }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(palette[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replacement, setReplacement] = useState("");
  const sorted = useMemo(() => [...streams].sort((a, b) => a.sortOrder - b.sortOrder), [streams]);

  const save = () => {
    if (!draftName.trim()) return;
    if (editing === "new") {
      onChange([...streams, { id: `stream-${crypto.randomUUID()}`, name: draftName.trim(), color: draftColor, icon: "calendar", active: true, sortOrder: streams.length }]);
    } else {
      onChange(streams.map((stream) => stream.id === editing ? { ...stream, name: draftName.trim(), color: draftColor } : stream));
    }
    setEditing(null);
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((stream) => stream.id === id);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered.map((stream, sortOrder) => ({ ...stream, sortOrder })));
  };

  const streamToDelete = streams.find((stream) => stream.id === deleteId);
  const affectedCount = deleteId ? countStreamEvents(events, deleteId) : 0;

  return (
    <div className="sheet-backdrop settings-backdrop" role="presentation">
      <section className="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="sheet-header"><button className="icon-button" onClick={onClose} aria-label="Close stream settings"><X size={22} /></button><span id="settings-title">Manage streams</span><button className="icon-button" onClick={() => { setEditing("new"); setDraftName(""); setDraftColor(palette[0]); }} aria-label="Add stream"><Plus size={22} /></button></header>
        <div className="settings-intro"><h2>Calendar streams</h2><p>Change the categories and colors used across the prototype. Colors are always paired with a label.</p></div>
        <div className="stream-settings-list">
          {sorted.map((stream, index) => (
            <div className="stream-setting" key={stream.id}>
              <button className="stream-main" onClick={() => { setEditing(stream.id); setDraftName(stream.name); setDraftColor(stream.color); }}>
                <span className="color-swatch" style={{ backgroundColor: stream.color }} />
                <span><strong>{stream.name}</strong><small>{stream.active ? "Active" : "Inactive"}</small></span>
              </button>
              <div className="stream-actions">
                <button className="mini-button" onClick={() => move(stream.id, -1)} disabled={index === 0} aria-label={`Move ${stream.name} up`}><ArrowUp /></button>
                <button className="mini-button" onClick={() => move(stream.id, 1)} disabled={index === sorted.length - 1} aria-label={`Move ${stream.name} down`}><ArrowDown /></button>
                <button className="mini-button" onClick={() => onChange(streams.map((item) => item.id === stream.id ? { ...item, active: !item.active } : item))} aria-label={`${stream.active ? "Deactivate" : "Activate"} ${stream.name}`}><Check weight={stream.active ? "bold" : "regular"} /></button>
                <button className="mini-button is-danger" onClick={() => { setDeleteId(stream.id); setReplacement(""); }} aria-label={`Delete ${stream.name}`}><Trash /></button>
              </div>
            </div>
          ))}
        </div>
        <button className="secondary-button reset-button" onClick={() => window.confirm("Reset all streams to the demo defaults?") && onReset()}>Reset demo streams</button>
        {editing && (
          <div className="nested-dialog" role="dialog" aria-modal="true" aria-label={editing === "new" ? "Add stream" : "Edit stream"}>
            <div className="nested-card">
              <header><h3>{editing === "new" ? "Add stream" : "Edit stream"}</h3><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor"><X /></button></header>
              <label>Stream name<input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)} /></label>
              <fieldset><legend>Stream color</legend><div className="color-palette">{palette.map((color) => <button type="button" key={color} className={draftColor === color ? "is-selected" : ""} style={{ backgroundColor: color }} onClick={() => setDraftColor(color)} aria-label={`Use color ${color}`} />)}</div></fieldset>
              <label>Custom color<input type="color" value={draftColor} onChange={(e) => setDraftColor(e.target.value)} /></label>
              <div className="color-preview"><span style={{ borderLeftColor: draftColor, backgroundColor: `${draftColor}1f` }}>Preview on light</span><span style={{ borderLeftColor: draftColor }}>Preview on dark</span></div>
              <button className="primary-button" onClick={save}>Save stream</button>
            </div>
          </div>
        )}
        {deleteId && streamToDelete && (
          <div className="nested-dialog" role="dialog" aria-modal="true" aria-label="Delete stream">
            <div className="nested-card">
              <header><h3>Delete stream?</h3><button className="icon-button" onClick={() => setDeleteId(null)} aria-label="Cancel delete"><X /></button></header>
              <p><strong>{streamToDelete.name}</strong> is used by {affectedCount} event{affectedCount === 1 ? "" : "s"}.</p>
              {affectedCount > 0 && <label>Reassign affected events<select value={replacement} onChange={(e) => setReplacement(e.target.value)}><option value="">Choose a replacement</option>{streams.filter((stream) => stream.id !== deleteId && stream.active).map((stream) => <option key={stream.id} value={stream.id}>{stream.name}</option>)}</select></label>}
              <p className="helper-text">Events are never deleted with a stream. A replacement is required when an event would otherwise have no stream.</p>
              <button className="danger-button full-button" disabled={affectedCount > 0 && !replacement} onClick={() => { onDelete(deleteId, replacement || undefined); setDeleteId(null); }}>Delete and reassign</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
