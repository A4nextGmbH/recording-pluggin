import { useState, useEffect, useCallback, useRef } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "https://www.a4next.de";

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("auth_token");
  const isJson = options.body && !(options.body instanceof FormData);
  return fetch(url, {
    ...options,
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const STATUS_CONFIG = {
  open:        { label: "Open",        color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  fixed:       { label: "Fixed",       color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  wont_fix:    { label: "Won't Fix",   color: "#6b7280", bg: "#f9fafb", text: "#374151" },
};

const PRIORITY_CONFIG = {
  low:      { label: "Low",      color: "#9ca3af", bg: "#f3f4f6", text: "#374151" },
  medium:   { label: "Medium",   color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  high:     { label: "High",     color: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  critical: { label: "Critical", color: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Shield: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  User: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Link: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Grid: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Play: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Comment: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      onLogin(data.token, data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <Icon.Shield />
        </div>
        <h1 className="login-title">Bug Tracker</h1>
        <p className="login-subtitle">Sign in to access the dashboard</p>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────

function TicketModal({ ticket, currentUser, onClose, onUpdate }) {
  const [data, setData] = useState({ ...ticket });
  const [newItem, setNewItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef(null);

  const persist = useCallback(
    async (updates) => {
      setSaving(true);
      try {
        const res = await authFetch(`${API_URL}/api/bug-reports/${data._id}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Save failed");
        const updated = await res.json();
        setData(updated);
        onUpdate(updated);
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [data._id, onUpdate]
  );

  const setField = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    persist({ [field]: value });
  };

  const addCheckItem = () => {
    if (!newItem.trim()) return;
    const checklist = [...(data.checklist || []), { text: newItem.trim(), done: false }];
    setNewItem("");
    setData((prev) => ({ ...prev, checklist }));
    persist({ checklist });
  };

  const toggleCheck = (i) => {
    const checklist = data.checklist.map((item, idx) =>
      idx === i ? { ...item, done: !item.done } : item
    );
    setData((prev) => ({ ...prev, checklist }));
    persist({ checklist });
  };

  const removeCheck = (i) => {
    const checklist = data.checklist.filter((_, idx) => idx !== i);
    setData((prev) => ({ ...prev, checklist }));
    persist({ checklist });
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    const comments = [
      ...(data.comments || []),
      { text: newComment.trim(), author: currentUser, createdAt: new Date().toISOString() },
    ];
    setNewComment("");
    setData((prev) => ({ ...prev, comments }));
    persist({ comments });
  };

  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium;
  const checkDone = (data.checklist || []).filter((i) => i.done).length;
  const checkTotal = (data.checklist || []).length;
  const pct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="modal-content">
        {/* Modal header */}
        <div className="modal-header">
          <div className="modal-badges">
            <span className="badge" style={{ background: status.bg, color: status.text }}>{status.label}</span>
            <span className="badge" style={{ background: priority.bg, color: priority.text }}>{priority.label}</span>
            {data.tested && <span className="badge badge-tested">✓ Tested</span>}
            {saving && <span className="saving-pill">Saving…</span>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>
        </div>

        <div className="modal-body">
          {/* ── Left column ── */}
          <div className="modal-left">
            <div className="modal-video-wrap">
              <video controls src={data.videoUrl} preload="metadata" className="modal-video">
                Your browser does not support the video tag.
              </video>
            </div>

            <h2 className="modal-bug-title">{data.title}</h2>

            <div className="modal-meta">
              <span className="app-badge">{data.appName}</span>
              <span className="meta-sep">·</span>
              <span className="timestamp">
                {new Date(data.reportedAt).toLocaleDateString()}{" "}
                {new Date(data.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {data.pageUrl && (
              <a href={data.pageUrl} target="_blank" rel="noopener noreferrer" className="report-url">
                <Icon.Link /> {data.pageUrl}
              </a>
            )}

            {data.notes && (
              <div className="modal-notes">
                <h4>Description</h4>
                <p>{data.notes}</p>
              </div>
            )}

            {/* Comments */}
            <div className="modal-section">
              <h4>
                Activity
                {(data.comments || []).length > 0 && (
                  <span className="section-count">{data.comments.length}</span>
                )}
              </h4>
              {(data.comments || []).length > 0 ? (
                <div className="comments-list">
                  {data.comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-avatar">{(c.author || "?")[0].toUpperCase()}</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{c.author}</span>
                          <span className="comment-time">
                            {new Date(c.createdAt).toLocaleDateString()}{" "}
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-comments">No comments yet.</p>
              )}
              <div className="comment-compose">
                <div className="comment-avatar">{(currentUser || "?")[0].toUpperCase()}</div>
                <div className="compose-area">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a comment…"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendComment();
                      }
                    }}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={sendComment}
                    disabled={!newComment.trim()}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="modal-right">
            <div className="control-block">
              <label className="control-label">Status</label>
              <select
                className="control-select"
                value={data.status || "open"}
                onChange={(e) => setField("status", e.target.value)}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="control-block">
              <label className="control-label">Priority</label>
              <select
                className="control-select"
                value={data.priority || "medium"}
                onChange={(e) => setField("priority", e.target.value)}
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="control-block">
              <label className="control-label">Assignee</label>
              <input
                type="text"
                className="control-input"
                value={data.assignee || ""}
                placeholder="Unassigned"
                onChange={(e) => setData((prev) => ({ ...prev, assignee: e.target.value }))}
                onBlur={(e) => persist({ assignee: e.target.value })}
              />
            </div>

            <div className="control-block">
              <label className="control-label">Testing Status</label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={!!data.tested}
                  onChange={(e) => setField("tested", e.target.checked)}
                />
                <span className={`toggle-text ${data.tested ? "toggle-on" : ""}`}>
                  {data.tested ? "✓ Tested & Verified" : "Not tested yet"}
                </span>
              </label>
            </div>

            <div className="control-block">
              <label className="control-label">
                Checklist
                {checkTotal > 0 && (
                  <span className="checklist-progress">{checkDone}/{checkTotal} · {pct}%</span>
                )}
              </label>
              {checkTotal > 0 && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div className="checklist-items">
                {(data.checklist || []).map((item, i) => (
                  <div key={i} className="checklist-row">
                    <input
                      type="checkbox"
                      id={`chk-${i}`}
                      checked={item.done}
                      onChange={() => toggleCheck(i)}
                    />
                    <label htmlFor={`chk-${i}`} className={item.done ? "chk-done" : ""}>{item.text}</label>
                    <button className="remove-btn" onClick={() => removeCheck(i)} title="Remove">
                      <Icon.Close />
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-item-row">
                <input
                  type="text"
                  className="control-input"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add checklist item…"
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                />
                <button
                  className="btn btn-sm btn-outline"
                  onClick={addCheckItem}
                  disabled={!newItem.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Card (grid) ───────────────────────────────────────────────────────

function TicketCard({ report, onClick }) {
  const status = STATUS_CONFIG[report.status || "open"] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[report.priority || "medium"] || PRIORITY_CONFIG.medium;
  const checkDone = (report.checklist || []).filter((i) => i.done).length;
  const checkTotal = (report.checklist || []).length;

  return (
    <div className="report-card" onClick={onClick}>
      <div className="video-thumb">
        <div className="play-overlay">
          <Icon.Play />
        </div>
        <div className="thumb-badges">
          <span className="badge badge-sm" style={{ background: status.bg, color: status.text }}>{status.label}</span>
          <span className="badge badge-sm" style={{ background: priority.bg, color: priority.text }}>{priority.label}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-top">
          <span className="app-badge">{report.appName}</span>
          <span className="timestamp">{new Date(report.reportedAt).toLocaleDateString()}</span>
        </div>
        <h3 className="report-title">{report.title}</h3>

        <div className="card-footer">
          <div>
            {report.assignee ? (
              <span className="assignee-chip">
                <Icon.User size={12} />
                {report.assignee}
              </span>
            ) : (
              <span className="assignee-chip unassigned">Unassigned</span>
            )}
          </div>
          <div className="card-footer-right">
            {checkTotal > 0 && (
              <span className="checklist-chip">
                <Icon.Check />
                {checkDone}/{checkTotal}
              </span>
            )}
            {report.tested && <span className="badge badge-tested badge-sm">Tested</span>}
            {(report.comments || []).length > 0 && (
              <span className="comment-chip">
                <Icon.Comment />
                {report.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Row (list) ────────────────────────────────────────────────────────

function TicketRow({ report, onClick }) {
  const status = STATUS_CONFIG[report.status || "open"] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[report.priority || "medium"] || PRIORITY_CONFIG.medium;
  const checkDone = (report.checklist || []).filter((i) => i.done).length;
  const checkTotal = (report.checklist || []).length;

  return (
    <div className="list-row" onClick={onClick}>
      <span className="status-dot" style={{ background: status.color }} />
      <div className="list-main">
        <span className="list-title">{report.title}</span>
        <span className="list-sub">
          <span className="app-badge-xs">{report.appName}</span>
          {report.assignee && <><span className="meta-sep">·</span>{report.assignee}</>}
        </span>
      </div>
      <div className="list-aside">
        {checkTotal > 0 && (
          <span className="checklist-chip"><Icon.Check />{checkDone}/{checkTotal}</span>
        )}
        {report.tested && <span className="badge badge-tested badge-sm">Tested</span>}
        {(report.comments || []).length > 0 && (
          <span className="comment-chip"><Icon.Comment />{report.comments.length}</span>
        )}
        <span className="badge badge-sm" style={{ background: priority.bg, color: priority.text }}>{priority.label}</span>
        <span className="badge badge-sm" style={{ background: status.bg, color: status.text }}>{status.label}</span>
        <span className="timestamp">{new Date(report.reportedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apps, setApps] = useState([]);
  const [filterApp, setFilterApp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filterApp
        ? `${API_URL}/api/bug-reports?appName=${encodeURIComponent(filterApp)}`
        : `${API_URL}/api/bug-reports`;
      const res = await authFetch(url);
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
      setApps((prev) =>
        prev.length === 0 ? [...new Set(data.map((r) => r.appName).filter(Boolean))] : prev
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterApp, onLogout]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpdate = (updated) => {
    setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    setSelected((prev) => (prev?._id === updated._id ? updated : prev));
  };

  const filtered = reports.filter((r) => {
    if (filterStatus && (r.status || "open") !== filterStatus) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = reports.filter((r) => (r.status || "open") === k).length;
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-icon"><Icon.Shield /></div>
          <div>
            <h1>Bug Tracker</h1>
            <p className="header-sub">{reports.length} report{reports.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={fetchReports} title="Refresh" disabled={loading}>
            <Icon.Refresh />
          </button>
          <span className="user-chip"><Icon.User />{user}</span>
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Status filter strip */}
      <div className="status-strip">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <button
            key={k}
            className={`status-pill ${filterStatus === k ? "active" : ""}`}
            style={filterStatus === k ? { background: v.bg, color: v.text, borderColor: v.color } : {}}
            onClick={() => setFilterStatus((prev) => (prev === k ? "" : k))}
          >
            <span className="status-dot" style={{ background: v.color }} />
            {v.label}
            <span className="pill-count">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Icon.Search />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")}>
              <Icon.Close />
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={filterApp}
          onChange={(e) => setFilterApp(e.target.value)}
        >
          <option value="">All Applications</option>
          {apps.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="view-toggle">
          <button className={`view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")} title="Grid view">
            <Icon.Grid />
          </button>
          <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")} title="List view">
            <Icon.List />
          </button>
        </div>
      </div>

      {/* Results info */}
      {!loading && (filterStatus || search) && (
        <p className="results-info">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {(filterStatus || search) && (
            <button className="clear-filters" onClick={() => { setFilterStatus(""); setSearch(""); }}>
              Clear filters
            </button>
          )}
        </p>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🐛</p>
          <h3>{search || filterStatus ? "No matching reports" : "No bug reports yet"}</h3>
          <p>{search || filterStatus ? "Try adjusting your filters." : "Reports will appear here once submitted via the plugin."}</p>
        </div>
      ) : view === "grid" ? (
        <div className="reports-grid">
          {filtered.map((r) => (
            <TicketCard key={r._id} report={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      ) : (
        <div className="reports-list">
          <div className="list-header">
            <span>Title</span>
            <span>Details</span>
          </div>
          {filtered.map((r) => (
            <TicketRow key={r._id} report={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {selected && (
        <TicketModal
          ticket={selected}
          currentUser={user}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState(() => localStorage.getItem("auth_user"));

  const handleLogin = (t, u) => {
    localStorage.setItem("auth_token", t);
    localStorage.setItem("auth_user", u);
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
