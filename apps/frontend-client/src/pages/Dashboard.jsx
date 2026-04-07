import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../services/resourceService";

const TYPE_ICONS = {
  "Lab":          "🔬",
  "Library":      "📚",
  "Sports Area":  "🏟️",
  "Auditorium":   "🎭",
  "Room":         "🚪",
  "default":      "📋",
};

function getIcon(type = "") {
  return TYPE_ICONS[type] || TYPE_ICONS.default;
}

function filterAvailable(resources) {
  return resources.filter(r => !r.status || r.status === "available");
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Dashboard() {
  const [resources,    setResources]    = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchTerm,   setSearchTerm]   = useState("");

  const role     = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res  = await getResources();
        const data = Array.isArray(res.data) ? res.data : [];
        setAllResources(data);
        setResources(filterAvailable(data));
      } catch {
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Search by name, type, or location
  const displayed = resources.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())     ||
    r.type?.toLowerCase().includes(searchTerm.toLowerCase())     ||
    r.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bookedCount = allResources.length - resources.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100%; margin: 0; padding: 0; }

        :root {
          --db-bg:          #f2f4f8;
          --db-surface:     #ffffff;
          --db-border:      #cdd4e4;
          --db-ink:         #0a0f1e;
          --db-ink2:        #1a2340;
          --db-muted:       #5c6b8a;
          --db-navy:        #0f1f5c;
          --db-navy-dk:     #0a1540;
          --db-navy-lt:     #e8ecf8;
          --db-navy-xs:     #f0f3fc;
          --db-error:       #c0392b;
          --db-error-lt:    #fdf0ef;
          --db-success:     #15803d;
          --db-success-lt:  #f0fdf4;
          --db-amber:       #d97706;
          --db-amber-lt:    #fffbeb;
          --db-font-s: 'DM Serif Display', Georgia, serif;
          --db-font-b: 'DM Sans', sans-serif;
        }

        body { background: var(--db-bg); font-family: var(--db-font-b); color: var(--db-ink); }

        /* ── Nav ── */
        .db-nav {
          background: var(--db-navy); padding: 0 60px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 16px rgba(10,15,30,0.15);
        }
        .db-nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .db-nav-logo-icon {
          width: 32px; height: 32px; background: rgba(255,255,255,0.12);
          display: grid; place-items: center; font-size: 14px;
          border-radius: 2px; border: 1px solid rgba(255,255,255,0.15);
        }
        .db-nav-logo-text { font-family: var(--db-font-s); font-size: 18px; color: #fff; line-height: 1; }
        .db-nav-logo-text span { color: #a5b4fc; font-style: italic; }
        .db-nav-right { display: flex; align-items: center; gap: 12px; }
        .db-nav-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .db-nav-btn {
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.7); background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 7px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .db-nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
        .db-nav-btn.admin {
          background: rgba(165,180,252,0.15); border-color: rgba(165,180,252,0.4); color: #a5b4fc;
        }
        .db-nav-btn.admin:hover { background: rgba(165,180,252,0.25); color: #c7d2fe; }

        /* ── Shell ── */
        .db-shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        .db-header { margin-bottom: 40px; }
        .db-header-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--db-navy); display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .db-header-eyebrow::after { content: ''; width: 24px; height: 1px; background: var(--db-navy); }
        .db-header-title {
          font-family: var(--db-font-s); font-size: clamp(36px, 4vw, 52px);
          line-height: 1.05; color: var(--db-ink); margin-bottom: 10px;
        }
        .db-header-title em { color: var(--db-navy); font-style: italic; }
        .db-header-sub { font-size: 15px; color: var(--db-muted); line-height: 1.6; }

        /* ── Stats row ── */
        .db-stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--db-border);
          border: 1px solid var(--db-border); border-radius: 4px; overflow: hidden;
          margin-bottom: 32px;
        }
        .db-stat { background: var(--db-surface); padding: 20px 24px; position: relative; }
        .db-stat::before { content:''; position:absolute; left:0; top:0; right:0; height:3px; background: var(--db-navy); }
        .db-stat.green::before { background: var(--db-success); }
        .db-stat.amber::before { background: var(--db-amber); }
        .db-stat-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--db-muted); margin-bottom: 8px; }
        .db-stat-val   { font-family: var(--db-font-s); font-size: 28px; color: var(--db-ink); line-height: 1; }
        .db-stat-sub   { font-size: 11px; color: var(--db-muted); margin-top: 4px; }

        /* ── Actions bar ── */
        .db-actions-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .db-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--db-navy); display: flex; align-items: center; gap: 10px;
        }
        .db-section-label::after { content: ''; width: 20px; height: 1px; background: var(--db-navy); }
        .db-resource-count {
          font-family: var(--db-font-s); font-size: 13px; font-style: italic;
          color: var(--db-muted); margin-left: 8px;
        }
        .db-actions-right { display: flex; align-items: center; gap: 12px; }

        /* ── Search ── */
        .db-search {
          padding: 9px 14px; font-family: var(--db-font-b); font-size: 13px;
          border: 1px solid var(--db-border); border-radius: 2px;
          background: var(--db-surface); color: var(--db-ink);
          width: 220px; transition: border-color 0.2s;
        }
        .db-search:focus { outline: none; border-color: var(--db-navy); }
        .db-search::placeholder { color: var(--db-muted); }

        .db-btn-booking {
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; padding: 10px 24px; cursor: pointer; border-radius: 2px;
          transition: all 0.25s; white-space: nowrap;
        }
        .db-btn-booking:hover { background: var(--db-navy-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,92,0.28); }

        /* ── Error ── */
        .db-error-box {
          background: var(--db-error-lt); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 2px; padding: 12px 18px;
          font-size: 13px; color: var(--db-error);
          margin-bottom: 28px; display: flex; align-items: center; gap: 8px;
        }

        /* ── Loading ── */
        .db-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 0; gap: 16px;
        }
        .db-spinner {
          width: 36px; height: 36px; border: 2.5px solid var(--db-border);
          border-top-color: var(--db-navy); border-radius: 50%;
          animation: dbSpin 0.7s linear infinite;
        }
        .db-loading-text { font-size: 13px; color: var(--db-muted); letter-spacing: 0.06em; }

        /* ── Empty state ── */
        .db-empty {
          text-align: center; padding: 80px 0;
          border: 1px dashed var(--db-border); border-radius: 4px;
          background: var(--db-surface);
        }
        .db-empty-icon  { font-size: 40px; margin-bottom: 16px; opacity: 0.5; }
        .db-empty-title { font-family: var(--db-font-s); font-size: 22px; color: var(--db-ink); margin-bottom: 8px; }
        .db-empty-sub   { font-size: 14px; color: var(--db-muted); }

        /* ── Resource grid ── */
        .db-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1px; background: var(--db-border);
          border: 1px solid var(--db-border); border-radius: 4px; overflow: hidden;
        }

        /* ── Resource card ── */
        .db-card {
          background: var(--db-surface); padding: 32px 28px;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 14px;
          transition: background 0.25s;
          animation: dbFadeUp 0.5s ease both;
        }
        .db-card:hover { background: var(--db-navy-xs); }
        .db-card-bar {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--db-navy); transform: scaleY(0); transform-origin: top;
          transition: transform 0.35s ease;
        }
        .db-card:hover .db-card-bar { transform: scaleY(1); }

        .db-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .db-card-icon {
          font-size: 26px; background: var(--db-navy-lt);
          border-radius: 2px; width: 48px; height: 48px;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .db-card-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .db-card-type {
          font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--db-navy); background: var(--db-navy-lt);
          padding: 4px 10px; border-radius: 999px; white-space: nowrap;
        }
        .db-card-avail {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--db-success); background: var(--db-success-lt);
          padding: 3px 8px; border-radius: 999px;
          border: 1px solid rgba(21,128,61,0.2);
        }

        /* Resource name */
        .db-card-name {
          font-family: var(--db-font-s); font-size: 20px;
          color: var(--db-ink); line-height: 1.1;
        }

        /* Capacity + location row */
        .db-card-meta { display: flex; gap: 20px; flex-wrap: wrap; }
        .db-card-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .db-card-meta-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--db-muted);
        }
        .db-card-meta-val { font-size: 13px; font-weight: 600; color: var(--db-ink2); }

        /* Availability hours pill */
        .db-card-avail-hours {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: var(--db-success);
          background: var(--db-success-lt); border: 1px solid rgba(21,128,61,0.2);
          padding: 6px 12px; border-radius: 999px; width: fit-content;
        }
        .db-card-avail-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--db-success); flex-shrink: 0;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }

        /* Book button */
        .db-card-footer { margin-top: auto; padding-top: 4px; }
        .db-btn-book {
          width: 100%; padding: 11px;
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; border-radius: 2px; cursor: pointer; transition: all 0.25s;
        }
        .db-btn-book:hover { background: var(--db-navy-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,92,0.25); }

        /* ── Footer ── */
        .db-footer {
          margin-top: 80px; padding-top: 32px; border-top: 1px solid var(--db-border);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .db-footer-logo { font-family: var(--db-font-s); font-size: 16px; color: var(--db-muted); }
        .db-footer-logo span { color: var(--db-navy); font-style: italic; }
        .db-footer-copy { font-size: 11px; color: var(--db-border); letter-spacing: 0.08em; }

        @keyframes dbSpin   { to { transform: rotate(360deg); } }
        @keyframes dbFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .db-card:nth-child(1) { animation-delay: 0.04s; }
        .db-card:nth-child(2) { animation-delay: 0.08s; }
        .db-card:nth-child(3) { animation-delay: 0.12s; }
        .db-card:nth-child(4) { animation-delay: 0.16s; }
        .db-card:nth-child(5) { animation-delay: 0.20s; }
        .db-card:nth-child(6) { animation-delay: 0.24s; }
        .db-card:nth-child(7) { animation-delay: 0.28s; }
        .db-card:nth-child(8) { animation-delay: 0.32s; }

        @media (max-width: 768px) {
          .db-nav   { padding: 0 24px; }
          .db-shell { padding: 32px 24px 60px; }
          .db-grid  { grid-template-columns: 1fr; }
          .db-stats-row { grid-template-columns: 1fr 1fr; }
          .db-search { width: 100%; }
          .db-actions-bar { flex-direction: column; align-items: flex-start; }
          .db-actions-right { width: 100%; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="db-nav">
        <a href="/" className="db-nav-logo">
          <div className="db-nav-logo-icon">🏛</div>
          <div className="db-nav-logo-text">Smart<span>Campus</span></div>
        </a>
        <div className="db-nav-right">
          <span className="db-nav-label">Dashboard</span>
          {role === "admin" && (
            <button className="db-nav-btn admin" onClick={() => navigate("/admin")}>
              ⚙ Admin Panel
            </button>
          )}
          <button className="db-nav-btn" onClick={() => navigate("/booking")}>My Bookings</button>
          <button className="db-nav-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="db-shell">
        <div className="db-header">
          <p className="db-header-eyebrow">Campus Resources</p>
          <h1 className="db-header-title">Book your <em>space.</em></h1>
          <p className="db-header-sub">
            Browse available labs, rooms, courts, and equipment below. Only currently available resources are shown.
          </p>
        </div>

        {error && <div className="db-error-box">⚠ {error}</div>}

        {/* ── Stats ── */}
        {!loading && (
          <div className="db-stats-row">
            <div className="db-stat green">
              <div className="db-stat-label">Available Now</div>
              <div className="db-stat-val">{resources.length}</div>
              <div className="db-stat-sub">Ready to book</div>
            </div>
            <div className="db-stat amber">
              <div className="db-stat-label">Currently Booked</div>
              <div className="db-stat-val">{bookedCount}</div>
              <div className="db-stat-sub">In use right now</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-label">Total Resources</div>
              <div className="db-stat-val">{allResources.length}</div>
              <div className="db-stat-sub">Across campus</div>
            </div>
          </div>
        )}

        {/* ── Actions bar ── */}
        <div className="db-actions-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="db-section-label">Available Now</span>
            {!loading && (
              <span className="db-resource-count">
                — {displayed.length} resource{displayed.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="db-actions-right">
            <input
              type="text"
              className="db-search"
              placeholder="Search by name, type, location…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="db-btn-booking" onClick={() => navigate("/booking")}>
              Reserve with Details →
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        {loading ? (
          <div className="db-loading">
            <div className="db-spinner" />
            <span className="db-loading-text">Loading resources…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">{searchTerm ? "🔍" : "📋"}</div>
            <div className="db-empty-title">
              {searchTerm ? `No results for "${searchTerm}"` : "No resources available right now"}
            </div>
            <div className="db-empty-sub">
              {searchTerm
                ? "Try a different search term."
                : "All resources are currently booked. Please check back later or contact your administrator."}
            </div>
          </div>
        ) : (
          <div className="db-grid">
            {displayed.map(r => (
              <div className="db-card" key={r._id}>
                <div className="db-card-bar" />

                {/* Icon + type badge + available badge */}
                <div className="db-card-top">
                  <div className="db-card-icon">{getIcon(r.type)}</div>
                  <div className="db-card-badges">
                    {r.type && <span className="db-card-type">{r.type}</span>}
                    <span className="db-card-avail">● Available</span>
                  </div>
                </div>

                {/* Resource name — uses r.name (correct model field) */}
                <div className="db-card-name">{r.name}</div>

                {/* Capacity + location */}
                <div className="db-card-meta">
                  {r.capacity && (
                    <div className="db-card-meta-item">
                      <span className="db-card-meta-label">Capacity</span>
                      <span className="db-card-meta-val">{r.capacity} people</span>
                    </div>
                  )}
                  {r.location && (
                    <div className="db-card-meta-item">
                      <span className="db-card-meta-label">Location</span>
                      <span className="db-card-meta-val">{r.location}</span>
                    </div>
                  )}
                </div>

                {/* Availability hours — shown as a green animated pill */}
                {r.availabilityHours?.start && r.availabilityHours?.end && (
                  <div className="db-card-avail-hours">
                    <div className="db-card-avail-dot" />
                    {formatTime(r.availabilityHours.start)} – {formatTime(r.availabilityHours.end)}
                  </div>
                )}

                {/* Book button */}
                <div className="db-card-footer">
                  <button
                    className="db-btn-book"
                    onClick={() => navigate("/booking", { state: { preselectedResource: r._id } })}
                  >
                    Book This Resource →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="db-footer">
          <div className="db-footer-logo">Smart<span>Campus</span></div>
          <div className="db-footer-copy">© 2025 SmartCampus</div>
        </div>
      </div>
    </>
  );
}