import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

// ── API ───────────────────────────────────────────────────────────────────────
const BOOKINGS_API = "http://localhost:5003"; // booking service port (server.js → PORT 5003)
const AUTH_API     = "http://localhost:4000";

async function fetchResourceBookings(resourceId, token) {
  // Route prefix is /booking (singular) — matches app.use("/booking", bookingRoutes) in server.js
  const res = await fetch(`${BOOKINGS_API}/booking/resource/${resourceId}`, {
    headers: {
      "Content-Type": "application/json",
      role: "admin",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");
  return Array.isArray(data) ? data : [];
}

async function fetchUser(userId, token) {
  try {
    const res = await fetch(`${AUTH_API}/auth/users/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return "";
  const clean = t.includes("T") ? (() => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  })() : t.slice(0, 5);
  const [h, m] = clean.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ampm}`;
}

// Handles both DD-MM-YYYY (backend stored) and YYYY-MM-DD
function formatDateDisplay(d) {
  if (!d) return "—";
  let year, month, day;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    [year, month, day] = d.split("-").map(Number);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    [day, month, year] = d.split("-").map(Number);
  } else return d;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function normalizeDateISO(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [day, month, year] = d.split("-");
    return `${year}-${month}-${day}`;
  }
  return d;
}

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function bookingStatus(dateStr) {
  const iso = normalizeDateISO(dateStr);
  const today = todayISO();
  if (iso < today) return "past";
  if (iso === today) return "today";
  return "upcoming";
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
}

function duration(start, end) {
  if (!start || !end) return null;
  const s = start.slice(0,5).split(":").map(Number);
  const e = end.slice(0,5).split(":").map(Number);
  const mins = (e[0]*60+e[1]) - (s[0]*60+s[1]);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins/60), m = mins%60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ResourceBookingsPage() {
  const { resourceId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();

  // Resource name + icon passed via navigate state from AdminPage
  const resourceName = location.state?.resourceName || "Resource";
  const resourceType = location.state?.resourceType || "";
  const resourceLoc  = location.state?.resourceLocation || "";

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  const [bookings,  setBookings]  = useState([]);
  const [userMap,   setUserMap]   = useState({}); // userId → user object
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("all"); // all | upcoming | today | past
  const [searchQuery,  setSearchQuery]  = useState("");
  const [sortBy,       setSortBy]       = useState("date-asc"); // date-asc | date-desc | user

  useEffect(() => {
    if (role !== "admin") navigate("/dashboard");
  }, [role, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchResourceBookings(resourceId, token);
      console.log("Bookings:", data);
      setBookings(data);

      // Fetch unique users in parallel
      const uniqueUserIds = [...new Set(data.map(b => b.userId).filter(Boolean))];
      const userEntries = await Promise.all(
        uniqueUserIds.map(async uid => {
          const user = await fetchUser(uid, token);
          return [uid, user];
        })
      );
      setUserMap(Object.fromEntries(userEntries.filter(([, u]) => u)));
    } catch (e) {
      setError(e.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [resourceId, token]);

  useEffect(() => { load(); }, [load]);

  // ── Derived: filtered + sorted bookings ──────────────────────────────────
  const displayed = bookings
    .filter(b => {
      const status = bookingStatus(b.date);
      if (filterStatus !== "all" && status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const user = userMap[b.userId];
        const nameMatch  = user?.name?.toLowerCase().includes(q);
        const emailMatch = user?.email?.toLowerCase().includes(q);
        const dateMatch  = formatDateDisplay(b.date).toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !dateMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date-asc")  return normalizeDateISO(a.date).localeCompare(normalizeDateISO(b.date)) || (a.startTime||"").localeCompare(b.startTime||"");
      if (sortBy === "date-desc") return normalizeDateISO(b.date).localeCompare(normalizeDateISO(a.date)) || (a.startTime||"").localeCompare(b.startTime||"");
      if (sortBy === "user") {
        const nameA = userMap[a.userId]?.name || a.userId || "";
        const nameB = userMap[b.userId]?.name || b.userId || "";
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  // ── Stat counts ───────────────────────────────────────────────────────────
  const countAll      = bookings.length;
  const countUpcoming = bookings.filter(b => bookingStatus(b.date) === "upcoming").length;
  const countToday    = bookings.filter(b => bookingStatus(b.date) === "today").length;
  const countPast     = bookings.filter(b => bookingStatus(b.date) === "past").length;
  const uniqueUsers   = new Set(bookings.map(b => b.userId).filter(Boolean)).size;

  const RESOURCE_ICONS = { Lab:"🔬", Library:"📚", "Sports Area":"🏟️", Auditorium:"🎭", Room:"🚪", default:"📋" };
  const icon = RESOURCE_ICONS[resourceType] || RESOURCE_ICONS.default;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100%; }

        :root {
          --bg:       #f2f4f8;
          --surface:  #ffffff;
          --border:   #cdd4e4;
          --ink:      #0a0f1e;
          --ink2:     #1a2340;
          --muted:    #5c6b8a;
          --navy:     #0f1f5c;
          --navy-dk:  #0a1540;
          --navy-lt:  #e8ecf8;
          --navy-xs:  #f0f3fc;
          --green:    #15803d;
          --green-lt: #f0fdf4;
          --red:      #c0392b;
          --red-lt:   #fdf0ef;
          --amber:    #d97706;
          --amber-lt: #fffbeb;
          --blue:     #2a4db5;
          --font-s:   'DM Serif Display', Georgia, serif;
          --font-b:   'DM Sans', sans-serif;
        }

        body { background: var(--bg); font-family: var(--font-b); color: var(--ink); }

        /* ── Nav ── */
        .nav {
          background: var(--navy); padding: 0 60px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 16px rgba(10,15,30,0.18);
        }
        .nav-left { display: flex; align-items: center; gap: 16px; }
        .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .nav-logo-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.12); display: grid; place-items: center; font-size: 14px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.15); }
        .nav-logo-text { font-family: var(--font-s); font-size: 18px; color: #fff; }
        .nav-logo-text span { color: #a5b4fc; font-style: italic; }
        .nav-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--amber); background: var(--amber-lt); padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(217,119,6,0.25); }
        .nav-right { display: flex; gap: 10px; align-items: center; }
        .nav-btn { font-family: var(--font-b); font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.7); background: transparent; border: 1px solid rgba(255,255,255,0.2); padding: 7px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s; }
        .nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        /* ── Shell ── */
        .shell { max-width: 1100px; margin: 0 auto; padding: 48px 60px 80px; }

        /* ── Resource hero ── */
        .resource-hero {
          background: var(--navy); border-radius: 4px; padding: 36px 40px;
          margin-bottom: 36px; position: relative; overflow: hidden;
          box-shadow: 0 16px 48px rgba(15,31,92,0.3);
        }
        .resource-hero::before {
          content: attr(data-icon);
          position: absolute; right: 40px; top: 50%; transform: translateY(-50%);
          font-size: 96px; opacity: 0.08; user-select: none; pointer-events: none;
          line-height: 1;
        }
        .hero-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 10px; }
        .hero-name { font-family: var(--font-s); font-size: clamp(24px,4vw,36px); color: #fff; line-height: 1.1; margin-bottom: 14px; }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 20px; }
        .hero-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .hero-meta-label { font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
        .hero-meta-val { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); }

        /* ── Stats strip ── */
        .stats-strip {
          display: grid; grid-template-columns: repeat(5,1fr); gap: 1px;
          background: var(--border); border: 1px solid var(--border);
          border-radius: 4px; overflow: hidden; margin-bottom: 32px;
        }
        .stat-box { background: var(--surface); padding: 20px 18px; cursor: pointer; transition: background 0.18s; position: relative; }
        .stat-box:hover { background: var(--navy-xs); }
        .stat-box.active { background: var(--navy-xs); }
        .stat-box.active::after { content:''; position:absolute; left:0; bottom:0; right:0; height:3px; background: var(--navy); }
        .stat-box.active.s-today::after  { background: var(--amber); }
        .stat-box.active.s-upcoming::after { background: var(--green); }
        .stat-box.active.s-past::after    { background: var(--muted); }
        .stat-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .stat-val   { font-family: var(--font-s); font-size: 28px; color: var(--ink); line-height: 1; }
        .stat-sub   { font-size: 10px; color: var(--muted); margin-top: 4px; }

        /* ── Controls bar ── */
        .controls { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-wrap { flex: 1; min-width: 200px; position: relative; }
        .search-input {
          width: 100%; padding: 10px 14px 10px 36px;
          font-family: var(--font-b); font-size: 13px;
          border: 1px solid var(--border); border-radius: 2px;
          background: var(--surface); color: var(--ink); transition: border-color 0.2s;
        }
        .search-input:focus { outline: none; border-color: var(--navy); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; opacity: 0.4; pointer-events: none; }
        .sort-select {
          padding: 10px 12px; font-family: var(--font-b); font-size: 12px; font-weight: 600;
          border: 1px solid var(--border); border-radius: 2px;
          background: var(--surface); color: var(--ink); cursor: pointer;
        }
        .sort-select:focus { outline: none; border-color: var(--navy); }
        .results-count { font-size: 12px; color: var(--muted); font-weight: 600; white-space: nowrap; }

        /* ── Table card ── */
        .table-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 4px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(10,15,30,0.05);
          position: relative;
        }
        .table-card::before { content:''; position:absolute; left:0; top:0; right:0; height:3px; background: var(--navy); }

        .table-head {
          display: grid;
          grid-template-columns: 2fr 1.4fr 1.4fr 1fr 1fr;
          padding: 13px 24px; border-bottom: 1px solid var(--border);
          background: var(--navy-xs);
        }
        .th { font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }

        .booking-row {
          display: grid;
          grid-template-columns: 2fr 1.4fr 1.4fr 1fr 1fr;
          padding: 16px 24px; border-bottom: 1px solid var(--border);
          align-items: center; transition: background 0.18s;
          animation: fadeUp 0.35s ease both;
        }
        .booking-row:last-child { border-bottom: none; }
        .booking-row:hover { background: var(--navy-xs); }

        /* User cell */
        .user-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .user-avatar {
          width: 36px; height: 36px; border-radius: 2px; flex-shrink: 0;
          background: var(--navy); display: grid; place-items: center;
          font-family: var(--font-s); font-size: 13px; color: #fff; letter-spacing: 0.04em;
        }
        .user-avatar.past     { background: var(--muted); }
        .user-avatar.today    { background: var(--amber); }
        .user-avatar.upcoming { background: var(--green); }
        .user-name  { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Date cell */
        .date-cell { display: flex; flex-direction: column; gap: 3px; }
        .date-primary { font-size: 13px; font-weight: 600; color: var(--ink2); }
        .date-secondary { font-size: 11px; color: var(--muted); }

        /* Time cell */
        .time-cell { display: flex; flex-direction: column; gap: 3px; }
        .time-primary { font-size: 13px; font-weight: 600; color: var(--ink2); }
        .time-dur   { font-size: 10px; font-weight: 700; color: var(--navy); background: var(--navy-lt); padding: 1px 6px; border-radius: 2px; width: fit-content; }

        /* Status badge */
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 999px; width: fit-content;
        }
        .status-badge.upcoming { color: var(--green); background: var(--green-lt); border: 1px solid rgba(21,128,61,0.2); }
        .status-badge.today    { color: var(--amber); background: var(--amber-lt); border: 1px solid rgba(217,119,6,0.25); }
        .status-badge.past     { color: var(--muted); background: var(--bg);       border: 1px solid var(--border); }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .upcoming .status-dot { background: var(--green); }
        .today    .status-dot { background: var(--amber); }
        .past     .status-dot { background: var(--muted); }

        /* Booking ID */
        .booking-id { font-size: 10px; color: var(--muted); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Empty + Loading */
        .empty { text-align: center; padding: 72px 0; color: var(--muted); }
        .empty-icon  { font-size: 40px; opacity: 0.3; margin-bottom: 12px; }
        .empty-title { font-family: var(--font-s); font-size: 22px; color: var(--ink); margin-bottom: 6px; }
        .empty-sub   { font-size: 13px; }

        .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--navy); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 56px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        .alert-error { background: var(--red-lt); border: 1px solid rgba(192,57,43,0.2); color: var(--red); border-radius: 2px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }

        /* Refresh btn */
        .btn-refresh { font-family: var(--font-b); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: transparent; border: 1px solid var(--border); padding: 8px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s; }
        .btn-refresh:hover:not(:disabled) { border-color: var(--navy); color: var(--navy); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 900px) {
          .nav { padding: 0 24px; }
          .shell { padding: 32px 24px 60px; }
          .stats-strip { grid-template-columns: repeat(3,1fr); }
          .table-head,
          .booking-row { grid-template-columns: 1.8fr 1.2fr 1.2fr 1fr; }
          .booking-row > *:last-child,
          .table-head  > *:last-child { display: none; }
          .resource-hero::before { display: none; }
        }
        @media (max-width: 640px) {
          .stats-strip { grid-template-columns: repeat(2,1fr); }
          .table-head,
          .booking-row { grid-template-columns: 1.6fr 1fr 1fr; }
          .booking-row > *:nth-child(4),
          .table-head  > *:nth-child(4) { display: none; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-left">
          <a href="/dashboard" className="nav-logo">
            <div className="nav-logo-icon">🏛</div>
            <div className="nav-logo-text">Smart<span>Campus</span></div>
          </a>
          <span className="nav-badge">⚙ Admin</span>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate("/admin")}>← Resources</button>
          <button className="nav-btn" onClick={() => { localStorage.clear(); navigate("/"); }}>Log Out</button>
        </div>
      </nav>

      <div className="shell">

        {/* ── Resource hero ── */}
        <div className="resource-hero" data-icon={icon}>
          <div className="hero-eyebrow">Resource Bookings</div>
          <div className="hero-name">{icon} {resourceName}</div>
          <div className="hero-meta">
            {resourceType && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Type</span>
                <span className="hero-meta-val">{resourceType}</span>
              </div>
            )}
            {resourceLoc && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Location</span>
                <span className="hero-meta-val">{resourceLoc}</span>
              </div>
            )}
            <div className="hero-meta-item">
              <span className="hero-meta-label">Resource ID</span>
              <span className="hero-meta-val" style={{ fontFamily: "monospace", fontSize: 12 }}>{resourceId}</span>
            </div>
          </div>
        </div>

        {error && <div className="alert-error">⚠ {error}</div>}

        {/* ── Stats strip (clickable filters) ── */}
        <div className="stats-strip">
          {[
            { key: "all",      label: "All",      val: countAll,      sub: "bookings",  cls: "" },
            { key: "upcoming", label: "Upcoming",  val: countUpcoming, sub: "ahead",     cls: "s-upcoming" },
            { key: "today",    label: "Today",     val: countToday,    sub: "right now", cls: "s-today" },
            { key: "past",     label: "Past",      val: countPast,     sub: "completed", cls: "s-past" },
            { key: "_users",   label: "Users",     val: uniqueUsers,   sub: "unique",    cls: "" },
          ].map(s => (
            <div
              key={s.key}
              className={`stat-box ${s.cls}${filterStatus === s.key ? " active" : ""}`}
              onClick={() => s.key !== "_users" && setFilterStatus(s.key)}
              style={s.key === "_users" ? { cursor: "default" } : {}}
            >
              <div className="stat-label">{s.label}</div>
              <div className="stat-val">{loading ? "—" : s.val}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by name, email, or date…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date-asc">Date ↑</option>
            <option value="date-desc">Date ↓</option>
            <option value="user">User A–Z</option>
          </select>
          <button className="btn-refresh" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          {!loading && <span className="results-count">{displayed.length} shown</span>}
        </div>

        {/* ── Bookings table ── */}
        <div className="table-card">
          <div className="table-head">
            <div className="th">User</div>
            <div className="th">Date</div>
            <div className="th">Time</div>
            <div className="th">Status</div>
            <div className="th">Booking ID</div>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : displayed.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-title">
                {bookings.length === 0 ? "No bookings yet" : "No results found"}
              </div>
              <div className="empty-sub">
                {bookings.length === 0
                  ? "This resource has no bookings on record."
                  : "Try adjusting your search or filter."}
              </div>
            </div>
          ) : (
            displayed.map((b, i) => {
              const user   = userMap[b.userId] || {};
              const status = bookingStatus(b.date);
              const dur    = duration(b.startTime, b.endTime);

              return (
                <div
                  className="booking-row"
                  key={b._id}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* User */}
                  <div className="user-cell">
                    <div className={`user-avatar ${status}`}>
                      {initials(user.name || b.userId)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="user-name">{user.name || b.userId || "Unknown User"}</div>
                      <div className="user-email">{user.email || "—"}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="date-cell">
                    <div className="date-primary">{formatDateDisplay(b.date)}</div>
                  </div>

                  {/* Time */}
                  <div className="time-cell">
                    <div className="time-primary">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </div>
                    {dur && <div className="time-dur">{dur}</div>}
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`status-badge ${status}`}>
                      <span className="status-dot" />
                      {status === "upcoming" ? "Upcoming" : status === "today" ? "Today" : "Past"}
                    </span>
                  </div>

                  {/* Booking ID */}
                  <div className="booking-id" title={b._id}>
                    {b._id ? `#${b._id.slice(-8)}` : "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}