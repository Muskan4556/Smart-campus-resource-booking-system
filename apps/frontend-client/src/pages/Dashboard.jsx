import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../services/resourceService";
import { bookResource } from "../services/bookingService";

const RESOURCE_ICONS = {
  lab: "🔬", library: "📚", sport: "🏟️", auditorium: "🎭",
  equipment: "💻", computer: "💻", seminar: "🎭", default: "📋",
};

function getIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("lab"))        return RESOURCE_ICONS.lab;
  if (n.includes("library"))    return RESOURCE_ICONS.library;
  if (n.includes("sport") || n.includes("court") || n.includes("gym")) return RESOURCE_ICONS.sport;
  if (n.includes("auditorium") || n.includes("seminar") || n.includes("hall")) return RESOURCE_ICONS.auditorium;
  if (n.includes("computer") || n.includes("equipment") || n.includes("projector")) return RESOURCE_ICONS.equipment;
  return RESOURCE_ICONS.default;
}

export default function Dashboard() {
  const [resources, setResources]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [bookingId, setBookingId]   = useState(null);  // which card is mid-booking
  const [booked,    setBooked]      = useState({});     // resourceId → true
  const [error,     setError]       = useState("");
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getResources();
        setResources(res.data);
      } catch {
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBooking = async (resourceId) => {
    setBookingId(resourceId);
    try {
      const [startTime, endTime] = "10:00-11:00".split("-");
      await bookResource(
        { userId, resourceId, date: "2026-03-14", startTime, endTime },
        token
      );
      setBooked(b => ({ ...b, [resourceId]: true }));
    } catch (err) {
      setError("Booking failed: " + (err.response?.data || err.message));
    } finally {
      setBookingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root { width: 100%; min-height: 100%; margin: 0; padding: 0; }

        :root {
          --db-bg:       #f2f4f8;
          --db-bg2:      #e8ecf4;
          --db-surface:  #ffffff;
          --db-border:   #cdd4e4;
          --db-ink:      #0a0f1e;
          --db-ink2:     #1a2340;
          --db-muted:    #5c6b8a;
          --db-navy:     #0f1f5c;
          --db-navy-dk:  #0a1540;
          --db-navy-lt:  #e8ecf8;
          --db-navy-xs:  #f0f3fc;
          --db-error:    #c0392b;
          --db-error-lt: #fdf0ef;
          --db-success:     #15803d;
          --db-success-lt:  #f0fdf4;
          --db-font-s:   'DM Serif Display', Georgia, serif;
          --db-font-b:   'DM Sans', sans-serif;
        }

        body { background: var(--db-bg); font-family: var(--db-font-b); color: var(--db-ink); }

        /* ── NAV ── */
        .db-nav {
          background: var(--db-navy);
          padding: 0 60px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 16px rgba(10,15,30,0.15);
        }
        .db-nav-logo {
          display: flex; align-items: center; gap: 12px; text-decoration: none;
        }
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
          padding: 7px 16px; cursor: pointer; border-radius: 2px;
          transition: all 0.2s;
        }
        .db-nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        /* ── LAYOUT ── */
        .db-shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        /* ── HEADER ── */
        .db-header { margin-bottom: 48px; }
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

        /* ── ACTIONS BAR ── */
        .db-actions-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
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
        .db-btn-booking {
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; padding: 10px 24px; cursor: pointer; border-radius: 2px;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .db-btn-booking::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .db-btn-booking:hover::after { transform: translateX(100%); }
        .db-btn-booking:hover { background: var(--db-navy-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,92,0.28); }

        /* ── ALERTS ── */
        .db-error-box {
          background: var(--db-error-lt); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 2px; padding: 12px 18px;
          font-size: 13px; color: var(--db-error);
          margin-bottom: 28px; display: flex; align-items: center; gap: 8px;
        }

        /* ── LOADING ── */
        .db-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 0; gap: 16px;
        }
        .db-spinner {
          width: 36px; height: 36px;
          border: 2.5px solid var(--db-border);
          border-top-color: var(--db-navy);
          border-radius: 50%;
          animation: dbSpin 0.7s linear infinite;
        }
        .db-loading-text { font-size: 13px; color: var(--db-muted); letter-spacing: 0.06em; }

        /* ── EMPTY ── */
        .db-empty {
          text-align: center; padding: 80px 0;
          border: 1px dashed var(--db-border); border-radius: 4px;
          background: var(--db-surface);
        }
        .db-empty-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.5; }
        .db-empty-title { font-family: var(--db-font-s); font-size: 22px; color: var(--db-ink); margin-bottom: 8px; }
        .db-empty-sub { font-size: 14px; color: var(--db-muted); }

        /* ── RESOURCE GRID ── */
        .db-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1px; background: var(--db-border);
          border: 1px solid var(--db-border); border-radius: 4px; overflow: hidden;
        }

        .db-card {
          background: var(--db-surface);
          padding: 32px 28px;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 16px;
          transition: background 0.25s;
        }
        .db-card:hover { background: var(--db-navy-xs); }
        .db-card-bar {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--db-navy);
          transform: scaleY(0); transform-origin: top;
          transition: transform 0.35s ease;
        }
        .db-card:hover .db-card-bar { transform: scaleY(1); }

        .db-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .db-card-icon {
          font-size: 28px; line-height: 1;
          background: var(--db-navy-lt); border-radius: 2px;
          width: 48px; height: 48px; display: grid; place-items: center; flex-shrink: 0;
        }
        .db-card-type {
          font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--db-navy); background: var(--db-navy-lt);
          padding: 4px 10px; border-radius: 999px; white-space: nowrap;
        }

        .db-card-name {
          font-family: var(--db-font-s); font-size: 20px;
          color: var(--db-ink); line-height: 1.1;
        }

        .db-card-meta {
          display: flex; gap: 20px; flex-wrap: wrap;
        }
        .db-card-meta-item {
          display: flex; flex-direction: column; gap: 2px;
        }
        .db-card-meta-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--db-muted);
        }
        .db-card-meta-val {
          font-size: 14px; font-weight: 600; color: var(--db-ink2);
        }

        .db-card-footer { margin-top: auto; padding-top: 4px; }

        .db-btn-book {
          width: 100%; padding: 11px;
          font-family: var(--db-font-b); font-size: 13px; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; border-radius: 2px; cursor: pointer;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .db-btn-book::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .db-btn-book:hover:not(:disabled)::after { transform: translateX(100%); }
        .db-btn-book:hover:not(:disabled) { background: var(--db-navy-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,92,0.25); }
        .db-btn-book:disabled { opacity: 0.6; cursor: not-allowed; }

        .db-btn-book.db-booked {
          background: var(--db-success-lt); color: var(--db-success);
          border: 1.5px solid rgba(21,128,61,0.25); cursor: default;
        }
        .db-btn-book.db-booked:hover { transform: none; box-shadow: none; }

        /* ── FOOTER ── */
        .db-footer {
          margin-top: 80px; padding-top: 32px;
          border-top: 1px solid var(--db-border);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .db-footer-logo { font-family: var(--db-font-s); font-size: 16px; color: var(--db-muted); }
        .db-footer-logo span { color: var(--db-navy); font-style: italic; }
        .db-footer-copy { font-size: 11px; color: var(--db-border); letter-spacing: 0.08em; }

        /* ── ANIMATIONS ── */
        @keyframes dbSpin { to { transform: rotate(360deg); } }
        @keyframes dbFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .db-card { animation: dbFadeUp 0.5s ease both; }
        .db-card:nth-child(1)  { animation-delay: 0.04s; }
        .db-card:nth-child(2)  { animation-delay: 0.08s; }
        .db-card:nth-child(3)  { animation-delay: 0.12s; }
        .db-card:nth-child(4)  { animation-delay: 0.16s; }
        .db-card:nth-child(5)  { animation-delay: 0.20s; }
        .db-card:nth-child(6)  { animation-delay: 0.24s; }
        .db-card:nth-child(7)  { animation-delay: 0.28s; }
        .db-card:nth-child(8)  { animation-delay: 0.32s; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .db-nav { padding: 0 24px; }
          .db-shell { padding: 32px 24px 60px; }
          .db-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="db-nav">
        <a href="/" className="db-nav-logo">
          <div className="db-nav-logo-icon">🏛</div>
          <div className="db-nav-logo-text">Smart<span>Campus</span></div>
        </a>
        <div className="db-nav-right">
          <span className="db-nav-label">Dashboard</span>
          <button className="db-nav-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="db-shell">
        {/* HEADER */}
        <div className="db-header">
          <p className="db-header-eyebrow">Campus Resources</p>
          <h1 className="db-header-title">
            Book your <em>space.</em>
          </h1>
          <p className="db-header-sub">
            Browse available labs, rooms, courts, and equipment below and reserve your slot instantly.
          </p>
        </div>

        {/* ERROR */}
        {error && <div className="db-error-box">⚠ {error}</div>}

        {/* ACTIONS */}
        <div className="db-actions-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="db-section-label">Available Now</span>
            {!loading && (
              <span className="db-resource-count">— {resources.length} resource{resources.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <button className="db-btn-booking" onClick={() => navigate("/booking")}>
            View All Bookings →
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="db-loading">
            <div className="db-spinner" />
            <span className="db-loading-text">Loading resources…</span>
          </div>
        )}

        {/* EMPTY */}
        {!loading && resources.length === 0 && !error && (
          <div className="db-empty">
            <div className="db-empty-icon">📋</div>
            <div className="db-empty-title">No resources available</div>
            <div className="db-empty-sub">Check back later or contact your campus administrator.</div>
          </div>
        )}

        {/* GRID */}
        {!loading && resources.length > 0 && (
          <div className="db-grid">
            {resources.map((r) => (
              <div className="db-card" key={r._id}>
                <div className="db-card-bar" />

                <div className="db-card-top">
                  <div className="db-card-icon">{getIcon(r.name)}</div>
                  <span className="db-card-type">{r.type || "Resource"}</span>
                </div>

                <div className="db-card-name">{r.name}</div>

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

                <div className="db-card-footer">
                  <button
                    className={`db-btn-book${booked[r._id] ? " db-booked" : ""}`}
                    onClick={() => !booked[r._id] && handleBooking(r._id)}
                    disabled={bookingId === r._id}
                  >
                    {booked[r._id]
                      ? "✓ Booked"
                      : bookingId === r._id
                      ? "Booking…"
                      : "Book This Resource"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="db-footer">
          <div className="db-footer-logo">Smart<span>Campus</span></div>
          <div className="db-footer-copy">© 2025 SmartCampus</div>
        </div>
      </div>
    </>
  );
}