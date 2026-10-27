import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { useDocuments } from "../DocumentsContext";
import { categories, categoryLabel, noteLabel, statusLabel } from "../mockData";

const STATUS_ICON = { uploaded: "clock", ready: "check", processing: "clock", failed: "alert" };
const UPLOAD_CATEGORIES = categories.filter((c) => c.key !== "all");

function StatusPill({ status }) {
  return (
    <span className="pill" data-s={status}>
      <Icon name={STATUS_ICON[status]} size={14} />
      {statusLabel[status]}
    </span>
  );
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  // The API sends UTC timestamps; the Date object shows them in the browser's local time.
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function noteFor(d) {
  if (d.status === "ready") return d.summary || "This document is ready for questions.";
  if (d.status === "uploaded") return "Stored safely. Reading and indexing its text is the next build step.";
  if (d.status === "processing") return "PolicyPal is reading this document.";
  return d.summary || "Processing failed. Try uploading a new copy.";
}

export default function Documents() {
  const { documents, loading, error, upload, remove } = useDocuments();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileInput = useRef(null);

  const q = query.trim().toLowerCase();
  const rows = documents.filter(
    (d) => (filter === "all" || d.category === filter) && d.original_filename.toLowerCase().includes(q)
  );
  const selected = documents.find((d) => d.id === selectedId) ?? documents[0];

  async function onFileChosen(e) {
    const file = e.target.files[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    setActionError("");
    setUploading(true);
    try {
      const doc = await upload(file, uploadCategory);
      setSelectedId(doc.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(doc) {
    if (!window.confirm(`Delete "${doc.original_filename}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await remove(doc.id);
      setSelectedId(null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="docs-page">
      <div className="docs-head">
        <div>
          <h1>Documents</h1>
          <p>Every policy you have uploaded, and what PolicyPal knows about it.</p>
        </div>
        <div className="upload-box">
          <select
            aria-label="Category for the next upload"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {UPLOAD_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,application/pdf" hidden onChange={onFileChosen} />
          <button className="btn-primary" disabled={uploading} onClick={() => fileInput.current.click()}>
            <Icon name="upload" /> {uploading ? "Uploading…" : "Upload policy"}
          </button>
        </div>
      </div>

      {(actionError || error) && <div className="error" role="alert">{actionError || error}</div>}

      <div className="docs-toolbar">
        <div className="search wide">
          <Icon name="search" size={16} />
          <input
            aria-label="Search documents"
            placeholder="Search documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c.key}
              className="chip"
              data-on={filter === c.key ? "yes" : "no"}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="docs-layout">
        <div className="docs-list">
          <div role="table" aria-label="Your documents" className="docs-table">
            <div role="row" className="docs-row docs-header">
              <div role="columnheader">Name</div>
              <div role="columnheader">Category</div>
              <div role="columnheader">Status</div>
              <div role="columnheader">Pages</div>
              <div role="columnheader">Uploaded</div>
            </div>

            {rows.map((d) => (
              <div
                key={d.id}
                role="row"
                className="docs-row docs-body-row"
                data-sel={d.id === selected?.id ? "yes" : "no"}
              >
                <div role="cell" className="cell-name">
                  <button className="namebtn" onClick={() => setSelectedId(d.id)}>
                    <Icon name="file" />
                    <span className="t">{d.original_filename}</span>
                  </button>
                </div>
                <div role="cell"><span className="cat">{categoryLabel[d.category] ?? d.category}</span></div>
                <div role="cell"><StatusPill status={d.status} /></div>
                <div role="cell">{d.page_count ?? "—"}</div>
                <div role="cell" className="muted">{formatDate(d.created_time)}</div>
              </div>
            ))}

            {loading && <div className="docs-empty">Loading your documents…</div>}
            {!loading && documents.length === 0 && (
              <div className="docs-empty">No documents yet. Choose a category and click “Upload policy” to add your first document (PDF, Word or text).</div>
            )}
            {!loading && documents.length > 0 && rows.length === 0 && (
              <div className="docs-empty">No documents match your search or filter.</div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="detail" aria-label="Document details">
            <div className="detail-title">
              <Icon name="file" size={22} />
              <h2>{selected.original_filename}</h2>
            </div>

            <div><StatusPill status={selected.status} /></div>

            <div>
              <div className="detail-label">{noteLabel[selected.status]}</div>
              <p className="detail-note">{noteFor(selected)}</p>
            </div>

            <dl className="detail-facts">
              <dt>Category</dt><dd>{categoryLabel[selected.category] ?? selected.category}</dd>
              <dt>Pages</dt><dd>{selected.page_count ?? "—"}</dd>
              <dt>Size</dt><dd>{formatSize(selected.size_bytes)}</dd>
              <dt>Uploaded</dt><dd>{formatDate(selected.created_time)}</dd>
            </dl>

            <div className="detail-actions">
              {selected.status === "ready" && (
                <Link to="/" className="btn-primary block">Ask about this document</Link>
              )}
              <button className="btn-danger" onClick={() => onDelete(selected)}>Delete document</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
