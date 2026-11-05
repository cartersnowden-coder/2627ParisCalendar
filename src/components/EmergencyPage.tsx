import { ArrowLeft, CheckCircle, FileText, PencilSimple, Phone, ShieldWarning, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { EmergencyLocation, EmergencySection, Role } from "../types";
import {
  canEditEmergency,
  confirmEmergencySection,
  emergencyDocumentHref,
  emergencyPhoneHref,
  saveEmergencyDraft,
  sectionsForLocation,
} from "../utils/emergency";

const LOCATIONS: EmergencyLocation[] = ["Trip-wide", "Paris", "Manchester", "San Antonio"];

interface Props {
  sections: EmergencySection[];
  role: Role;
  onChange: (sections: EmergencySection[]) => void;
  onReset: () => void;
  onReturn: () => void;
}

function StatusBadge({ section }: { section: EmergencySection }) {
  const label = section.sampleOnly && section.status === "Confirmed" ? "Confirmed sample" : section.status;
  return <span className={`emergency-status emergency-status-${section.status.toLowerCase().replace(" ", "-")}`}>{label}</span>;
}

function EmergencyCard({ section, canEdit, onEdit, onConfirm }: {
  section: EmergencySection;
  canEdit: boolean;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const phoneHref = emergencyPhoneHref(section);
  const documentHref = emergencyDocumentHref(section);
  return (
    <article className={`emergency-card ${section.primary ? "is-primary" : ""}`} aria-labelledby={`emergency-${section.id}`}>
      <header>
        <div><StatusBadge section={section} /><h2 id={`emergency-${section.id}`}>{section.title}</h2></div>
        {canEdit && <button className="emergency-edit-button" onClick={onEdit} aria-label={`Edit ${section.title}`}><PencilSimple size={18} />Edit</button>}
      </header>
      <p className="emergency-guidance">{section.guidance}</p>
      {section.contactLabel && (
        phoneHref ? (
          <a className="emergency-contact-action" href={phoneHref}><Phone size={21} /><span><small>Call</small>{section.contactLabel}</span></a>
        ) : (
          <button className="emergency-contact-action is-disabled" disabled><Phone size={21} /><span><small>Contact unavailable</small>{section.contactLabel}</span></button>
        )
      )}
      {section.documentLabel && (
        documentHref ? (
          <a className="emergency-document-action" href={documentHref} target="_blank" rel="noreferrer"><FileText size={20} />{section.documentLabel}</a>
        ) : (
          <button className="emergency-document-action is-disabled" disabled><FileText size={20} />{section.documentLabel}</button>
        )
      )}
      <dl className="emergency-meta">
        <div><dt>Source / owner</dt><dd>{section.sourceOwner || "To be provided"}</dd></div>
        <div><dt>Last updated</dt><dd>{section.updatedAt ? new Date(section.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not yet supplied"}</dd></div>
        <div><dt>Offline readiness</dt><dd>Planned - not active</dd></div>
      </dl>
      {canEdit && section.status === "Draft" && (
        <button className="emergency-confirm-button" onClick={onConfirm}><CheckCircle size={20} />Review and mark Confirmed</button>
      )}
    </article>
  );
}

function EmergencyEditor({ section, onClose, onSave }: {
  section: EmergencySection;
  onClose: () => void;
  onSave: (section: EmergencySection) => void;
}) {
  const [draft, setDraft] = useState(section);
  const update = <K extends keyof EmergencySection>(key: K, value: EmergencySection[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div className="nested-dialog emergency-editor-backdrop" role="presentation">
      <form className="nested-card emergency-editor" onSubmit={(event) => { event.preventDefault(); onSave(saveEmergencyDraft(draft)); }} aria-label={`Edit ${section.title}`}>
        <header><h3>Edit emergency section</h3><button type="button" className="icon-button" onClick={onClose} aria-label="Close emergency editor"><X /></button></header>
        <p className="emergency-editor-warning">Saving creates a Draft. A separate review is required before the section can be marked Confirmed.</p>
        <label>Heading<input value={draft.title} onChange={(event) => update("title", event.target.value)} required /></label>
        <label>Guidance<textarea value={draft.guidance} onChange={(event) => update("guidance", event.target.value)} required /></label>
        <div className="form-row">
          <label>Location<select value={draft.location} onChange={(event) => update("location", event.target.value as EmergencyLocation)}>{LOCATIONS.map((location) => <option key={location}>{location}</option>)}</select></label>
          <label>Display order<input type="number" value={draft.order} onChange={(event) => update("order", Number(event.target.value))} /></label>
        </div>
        <label>Contact label<input value={draft.contactLabel || ""} onChange={(event) => update("contactLabel", event.target.value)} placeholder="Contact information to be provided" /></label>
        <label>Phone number<input value={draft.phone || ""} onChange={(event) => update("phone", event.target.value)} placeholder="Leave blank until an official number is supplied" /></label>
        <label>Document label<input value={draft.documentLabel || ""} onChange={(event) => update("documentLabel", event.target.value)} /></label>
        <label>Secure document URL<input type="url" value={draft.url || ""} onChange={(event) => update("url", event.target.value)} placeholder="https://" /></label>
        <label>Source / owner<input value={draft.sourceOwner || ""} onChange={(event) => update("sourceOwner", event.target.value)} /></label>
        <button className="primary-button full-button" type="submit">Save as Draft</button>
      </form>
    </div>
  );
}

export default function EmergencyPage({ sections, role, onChange, onReset, onReturn }: Props) {
  const [location, setLocation] = useState<EmergencyLocation>("Trip-wide");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const adminControls = canEditEmergency(role) && !previewMode;
  const visibleSections = useMemo(() => sectionsForLocation(sections, location), [sections, location]);
  const editingSection = sections.find((section) => section.id === editingId);
  const latestUpdate = sections.map((section) => section.updatedAt).filter(Boolean).sort().at(-1);

  const replaceSection = (next: EmergencySection) => {
    onChange(sections.map((section) => section.id === next.id ? next : section));
    setEditingId(null);
  };

  const confirmSection = (section: EmergencySection) => {
    if (!window.confirm(`Confirm that ${section.title} has been reviewed and may be marked Confirmed?`)) return;
    replaceSection(confirmEmergencySection(section));
  };

  return (
    <section className="emergency-page" aria-labelledby="emergency-page-title">
      <div className="emergency-page-header">
        <button className="emergency-return" onClick={onReturn}><ArrowLeft size={19} />Return to calendar</button>
        <div className="emergency-title-row">
          <div><p className="view-kicker">Critical information</p><h1 id="emergency-page-title">Emergency</h1></div>
          {canEditEmergency(role) && <button className="secondary-button" onClick={() => setPreviewMode((current) => !current)}>{previewMode ? "Exit Viewer preview" : "Preview as Viewer"}</button>}
        </div>
        <div className="emergency-draft-banner" role="alert"><ShieldWarning size={26} weight="fill" /><strong>DRAFT PLACEHOLDER</strong><span>Official NBA emergency information has not yet been added. Do not use this prototype for an actual emergency.</span></div>
      </div>

      <div className="emergency-reliability" aria-label="Emergency content readiness">
        <div><span>Last updated</span><strong>{latestUpdate ? new Date(latestUpdate).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Not supplied"}</strong></div>
        <div><span>Content status</span><strong>Prototype placeholders</strong></div>
        <div><span>Available offline</span><strong>No - readiness planned</strong></div>
      </div>

      <nav className="emergency-location-tabs" aria-label="Emergency information location">
        {LOCATIONS.map((item) => <button key={item} className={location === item ? "is-active" : ""} onClick={() => setLocation(item)}>{item}</button>)}
      </nav>

      {previewMode && <div className="viewer-preview-banner">Viewer preview is active. Admin editing controls are hidden.</div>}

      <div className="emergency-section-list">
        {visibleSections.map((section) => <EmergencyCard key={section.id} section={section} canEdit={adminControls} onEdit={() => setEditingId(section.id)} onConfirm={() => confirmSection(section)} />)}
      </div>

      {visibleSections.length === 0 && <div className="empty-state"><h2>No information added</h2><p>Official content for this location is still pending.</p></div>}

      {adminControls && <div className="emergency-admin-footer"><p>Prototype Admin controls. Changes remain in this browser only.</p><button className="danger-button" onClick={() => window.confirm("Reset all emergency content to the safe demo placeholders?") && onReset()}>Reset demo placeholders</button></div>}

      {editingSection && <EmergencyEditor section={editingSection} onClose={() => setEditingId(null)} onSave={replaceSection} />}
    </section>
  );
}
