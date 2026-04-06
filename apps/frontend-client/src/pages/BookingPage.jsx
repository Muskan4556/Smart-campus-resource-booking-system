import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getResources } from "../services/resourceService";
import {
  bookResource,
  getMyBookings,
  cancelBooking,
  getResourceBookings,
} from "../services/bookingService";

// ── Time helpers ─────────────────────────────────────────────────────────────

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) &&
         toMinutes(endA)   > toMinutes(startB);
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d) {
  if (!d) return "";
  // Parse as LOCAL date to avoid UTC-offset day-shift (important for IST +5:30)
  const [year, month, day] = d.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// bookingRoute.js stores startTime/endTime as plain "HH:MM" strings.
// Also safely handles ISO timestamps in case they ever appear.
function extractTime(val) {
  if (!val) return null;
  if (val.includes("T")) {
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  if (/^\d{2}:\d{2}/.test(val)) return val.slice(0, 5);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const [resources,        setResources]        = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [date,             setDate]             = useState("");
  const [startTime,        setStartTime]        = useState("");
  const [endTime,          setEndTime]          = useState("");
  const [loading,          setLoading]          = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [error,            setError]            = useState("");
  const [fieldErrors,      setFieldErrors]      = useState({});
  const [successMsg,       setSuccessMsg]       = useState("");

  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [deletingId,      setDeletingId]      = useState(null);
  const [deleteError,     setDeleteError]     = useState("");

  const [existingSlots, setExistingSlots] = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Read auth from localStorage; redirect immediately if missing ──────────
  const token     = localStorage.getItem("token");
  const userId    = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("email") || "";
  const userName  = localStorage.getItem("name")  || "";

  useEffect(() => {
    if (!token || !userId) {
      navigate("/", { replace: true });
    }
  }, [token, userId, navigate]);

  // Pre-select resource if navigated from Dashboard
  useEffect(() => {
    if (location.state?.preselectedResource) {
      setSelectedResource(location.state.preselectedResource);
    }
  }, [location.state]);

  // Load available resources
  useEffect(() => {
    const fetchResources = async () => {
      setResourcesLoading(true);
      try {
        const res = await getResources();
        const data = Array.isArray(res.data) ? res.data : [];
        setResources(data.filter(r => !r.status || r.status === "available"));
      } catch {
        setError("Failed to load resources. Please refresh the page.");
      } finally {
        setResourcesLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Load user's own bookings via bookingService → GET /booking/user/:userId
  const fetchMyBookings = useCallback(async () => {
    if (!userId || !token) return;
    setBookingsLoading(true);
    try {
      const res  = await getMyBookings(userId, token);
      const data = Array.isArray(res.data) ? res.data : [];
      setBookings(data);
    } catch {
      // Silently fail — don't block the booking form
    } finally {
      setBookingsLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchMyBookings(); }, [fetchMyBookings]);

  // Fetch booked slots for selected resource + date (for overlap preview)
  useEffect(() => {
    if (!selectedResource || !date) {
      setExistingSlots([]);
      return;
    }
    setSlotsLoading(true);
    getResourceBookings(selectedResource, date, token)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setExistingSlots(data);
      })
      .catch(() => setExistingSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedResource, date, token]);

  // ── Field-level validation ──────────────────────────────────────────────
  const validate = () => {
    const errs  = {};
    const today = todayString();

    if (!selectedResource) errs.resource  = "Please select a resource.";
    if (!date)             errs.date      = "Please select a date.";
    else if (date < today) errs.date      = "Date cannot be in the past.";
    if (!startTime)        errs.startTime = "Please enter a start time.";
    if (!endTime)          errs.endTime   = "Please enter an end time.";

    if (startTime && endTime) {
      if (toMinutes(endTime) <= toMinutes(startTime)) {
        errs.endTime = "End time must be after start time.";
      } else if (toMinutes(endTime) - toMinutes(startTime) < 15) {
        errs.endTime = "Booking must be at least 15 minutes.";
      } else if (toMinutes(endTime) - toMinutes(startTime) > 480) {
        errs.endTime = "Booking cannot exceed 8 hours.";
      }
    }

    if (date === today && startTime) {
      const now        = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (toMinutes(startTime) <= nowMinutes) {
        errs.startTime = "Start time must be in the future for today's bookings.";
      }
    }

    return errs;
  };

  // ── Client-side overlap check against fetched slots ─────────────────────
  const checkOverlap = () => {
    if (!startTime || !endTime || !existingSlots.length) return null;
    for (const slot of existingSlots) {
      const slotStart = extractTime(slot.startTime);
      const slotEnd   = extractTime(slot.endTime);
      if (slotStart && slotEnd && timesOverlap(startTime, endTime, slotStart, slotEnd)) {
        return `This resource is already booked from ${formatTime(slotStart)} to ${formatTime(slotEnd)} on this date.`;
      }
    }
    return null;
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    // Guard — should never reach here without auth, but be safe
    if (!userId || !token) {
      setError("You must be logged in to make a booking.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const overlapMsg = checkOverlap();
    if (overlapMsg) {
      setError(overlapMsg);
      return;
    }

    setLoading(true);
    try {
      // Payload matches exactly what bookingRoute.js destructures:
      // { userId, resourceId, date, startTime, endTime }
      const selectedRes = resources.find(r => String(r._id) === String(selectedResource));
      const payload = {
        userId,
        resourceId: selectedResource,
        date,
        startTime,
        endTime,
        userEmail,
        userName,
        resourceName: selectedRes?.resourceName || "",
      };

      await bookResource(payload, token);

      setSuccessMsg(
        `Booking confirmed for ${formatDate(date)}, ${formatTime(startTime)} – ${formatTime(endTime)}.`
      );
      setSelectedResource("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setExistingSlots([]);
      fetchMyBookings(); // Redis cache cleared on backend — fetches fresh data
    } catch (err) {
      // axios wraps the server response inside err.response.data
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Booking failed.";

      // Match exact error text from bookingRoute.js: "Slot already booked"
      if (
        msg.toLowerCase().includes("overlap")        ||
        msg.toLowerCase().includes("conflict")       ||
        msg.toLowerCase().includes("already booked") ||
        msg.toLowerCase().includes("slot already booked")
      ) {
        setError("This time slot overlaps with an existing booking. Please choose a different time.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Delete handler ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setDeleteError("");
    setDeletingId(id);
    try {
      await cancelBooking(id, token);
      // Optimistically remove — backend also clears Redis cache for this user
      setBookings(prev => prev.filter(b => b._id !== id));
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to cancel booking.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/");
  };

  // bookingRoute.js stores resourceId as a plain string — match by string comparison
  const getResourceName = (resourceId) => {
    if (!resourceId) return "Unknown Resource";
    const found = resources.find(r => String(r._id) === String(resourceId));
    return found ? found.resourceName : String(resourceId);
  };

  const bookedSlotsDisplay = existingSlots
    .map(s => ({ start: extractTime(s.startTime), end: extractTime(s.endTime) }))
    .filter(s => s.start && s.end)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const today = todayString();

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
          --db-success:     #15803d;
          --db-success-lt:  #f0fdf4;
          --db-error:       #c0392b;
          --db-error-lt:    #fdf0ef;
          --db-amber:       #d97706;
          --db-amber-lt:    #fffbeb;
          --db-font-s:  'DM Serif Display', Georgia, serif;
          --db-font-b:  'DM Sans', sans-serif;
        }

        body { background: var(--db-bg); font-family: var(--db-font-b); color: var(--db-ink); }

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
        .db-nav-btn {
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.7); background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 7px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .db-nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        .db-shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        .db-header-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--db-navy); margin-bottom: 12px;
        }
        .db-header-title {
          font-family: var(--db-font-s); font-size: clamp(28px, 5vw, 36px);
          margin-bottom: 32px; line-height: 1.1;
        }
        .db-header-title em { font-style: italic; color: var(--db-navy); }

        .db-alert {
          border-radius: 2px; padding: 12px 16px; font-size: 13px;
          margin-bottom: 24px; display: flex; align-items: flex-start; gap: 8px;
          animation: alertIn 0.25s ease;
        }
        @keyframes alertIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .db-alert.error   { background: var(--db-error-lt); border: 1px solid rgba(192,57,43,0.2); color: var(--db-error); }
        .db-alert.success { background: var(--db-success-lt); border: 1px solid rgba(21,128,61,0.15); color: var(--db-success); }
        .db-alert.warning { background: var(--db-amber-lt); border: 1px solid rgba(217,119,6,0.2); color: var(--db-amber); }

        .db-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }

        .form-card {
          background: var(--db-surface); border: 1px solid var(--db-border);
          border-radius: 4px; padding: 40px 36px;
          box-shadow: 0 12px 40px rgba(10,15,30,0.06); position: relative;
        }
        .form-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--db-navy); border-radius: 4px 4px 0 0; }
        .form-card-title { font-family: var(--db-font-s); font-size: 20px; margin-bottom: 28px; color: var(--db-ink); }

        .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--db-muted); }
        .form-label span { color: var(--db-error); margin-left: 2px; }
        .form-input, .form-select {
          padding: 12px 14px; font-family: var(--db-font-b); font-size: 14px;
          border: 1px solid var(--db-border); border-radius: 2px; width: 100%;
          background: #fff; transition: border-color 0.2s; color: var(--db-ink);
        }
        .form-input:focus, .form-select:focus { outline: none; border-color: var(--db-navy); }
        .form-input.has-error, .form-select.has-error { border-color: var(--db-error); }
        .form-error { font-size: 11px; color: var(--db-error); display: flex; align-items: center; gap: 4px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .slots-preview {
          margin-top: -8px; margin-bottom: 20px;
          padding: 12px 14px;
          background: var(--db-navy-xs); border: 1px solid var(--db-border);
          border-radius: 2px;
        }
        .slots-preview-title {
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--db-muted); margin-bottom: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .slot-chip {
          display: inline-block; font-size: 11px; font-weight: 600;
          color: var(--db-error); background: var(--db-error-lt);
          border: 1px solid rgba(192,57,43,0.2);
          padding: 3px 9px; border-radius: 999px; margin: 3px 4px 3px 0;
        }
        .slots-empty { font-size: 12px; color: var(--db-success); font-weight: 600; }

        .db-btn-book {
          width: 100%; padding: 15px; margin-top: 8px;
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .db-btn-book:hover:not(:disabled) { background: var(--db-navy-dk); transform: translateY(-1px); }
        .db-btn-book:disabled { opacity: 0.6; cursor: not-allowed; }

        .bookings-card {
          background: var(--db-surface); border: 1px solid var(--db-border);
          border-radius: 4px; box-shadow: 0 12px 40px rgba(10,15,30,0.06);
          position: relative; overflow: hidden;
        }
        .bookings-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--db-navy); }
        .bookings-card-header {
          padding: 28px 32px 20px; border-bottom: 1px solid var(--db-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .bookings-card-title { font-family: var(--db-font-s); font-size: 20px; color: var(--db-ink); }
        .bookings-count { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--db-muted); }

        .booking-item {
          padding: 18px 32px; border-bottom: 1px solid var(--db-border);
          display: flex; align-items: center; gap: 16px;
          animation: dbFadeUp 0.4s ease both;
          transition: background 0.2s;
        }
        .booking-item:last-child { border-bottom: none; }
        .booking-item:hover { background: #f8f9fd; }

        .booking-status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          background: var(--db-navy);
        }
        .booking-status-dot.past   { background: var(--db-muted); }
        .booking-status-dot.today  { background: var(--db-amber); }
        .booking-status-dot.future { background: var(--db-success); }

        .booking-info { flex: 1; min-width: 0; }
        .booking-name {
          font-family: var(--db-font-s); font-size: 15px;
          color: var(--db-ink); margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .booking-meta { font-size: 11px; color: var(--db-muted); }
        .booking-date-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          color: var(--db-navy); background: var(--db-navy-lt);
          padding: 2px 7px; border-radius: 2px; margin-right: 6px;
        }

        .btn-cancel-booking {
          font-family: var(--db-font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--db-error); background: transparent;
          border: 1px solid rgba(192,57,43,0.25);
          padding: 6px 12px; cursor: pointer; border-radius: 2px;
          flex-shrink: 0; transition: all 0.2s;
        }
        .btn-cancel-booking:hover:not(:disabled) { background: var(--db-error-lt); }
        .btn-cancel-booking:disabled { opacity: 0.5; cursor: not-allowed; }

        .bookings-empty {
          padding: 40px 32px; text-align: center;
          color: var(--db-muted); font-size: 14px;
        }
        .bookings-empty-icon { font-size: 32px; opacity: 0.4; margin-bottom: 8px; }

        .db-spinner {
          width: 28px; height: 28px; border: 2px solid var(--db-border);
          border-top-color: var(--db-navy); border-radius: 50%;
          animation: dbSpin 0.7s linear infinite; margin: 32px auto;
        }
        .db-spinner.sm {
          width: 12px; height: 12px; margin: 0;
          display: inline-block; vertical-align: middle;
        }

        @keyframes dbSpin { to { transform: rotate(360deg); } }
        @keyframes dbFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 900px) {
          .db-layout { grid-template-columns: 1fr; }
          .db-shell  { padding: 32px 24px 60px; }
          .db-nav    { padding: 0 24px; }
          .form-row  { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>

      <nav className="db-nav">
        <a href="/dashboard" className="db-nav-logo">
          <div className="db-nav-logo-icon">🏛</div>
          <div className="db-nav-logo-text">Smart<span>Campus</span></div>
        </a>
        <div className="db-nav-right">
          <button className="db-nav-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <button className="db-nav-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="db-shell">
        <div className="db-header">
          <p className="db-header-eyebrow">Service Request</p>
          <h1 className="db-header-title">Reserve a <em>Resource.</em></h1>
        </div>

        {error       && <div className="db-alert error">⚠ {error}</div>}
        {successMsg  && <div className="db-alert success">✓ {successMsg}</div>}
        {deleteError && <div className="db-alert error">⚠ {deleteError}</div>}

        <div className="db-layout">

          <div className="form-card">
            <div className="form-card-bar" />
            <div className="form-card-title">New Reservation</div>

            <form onSubmit={handleBooking} noValidate>

              <div className="form-group">
                <label className="form-label">Resource <span>*</span></label>
                {resourcesLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "var(--db-muted)", fontSize: 13 }}>
                    <div className="db-spinner sm" /> Loading resources…
                  </div>
                ) : resources.length === 0 ? (
                  <div className="db-alert warning" style={{ marginBottom: 0 }}>
                    ⚠ No resources are currently available for booking.
                  </div>
                ) : (
                  <select
                    className={`form-select${fieldErrors.resource ? " has-error" : ""}`}
                    value={selectedResource}
                    onChange={e => {
                      setSelectedResource(e.target.value);
                      setFieldErrors(f => ({ ...f, resource: "" }));
                      setError("");
                    }}
                  >
                    <option value="">Select a resource…</option>
                    {resources.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.resourceName}
                        {r.location ? ` — ${r.location}` : ""}
                        {r.capacity ? ` (cap: ${r.capacity})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.resource && <span className="form-error">⚠ {fieldErrors.resource}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Date <span>*</span></label>
                <input
                  type="date"
                  className={`form-input${fieldErrors.date ? " has-error" : ""}`}
                  value={date}
                  min={today}
                  onChange={e => {
                    setDate(e.target.value);
                    setFieldErrors(f => ({ ...f, date: "" }));
                    setError("");
                  }}
                />
                {fieldErrors.date && <span className="form-error">⚠ {fieldErrors.date}</span>}
              </div>

              {selectedResource && date && (
                <div className="slots-preview">
                  <div className="slots-preview-title">
                    Already booked on this date
                    {slotsLoading && <div className="db-spinner sm" />}
                  </div>
                  {!slotsLoading && (
                    bookedSlotsDisplay.length === 0
                      ? <span className="slots-empty">✓ No bookings yet — all slots free!</span>
                      : bookedSlotsDisplay.map((s, i) => (
                          <span key={i} className="slot-chip">
                            🚫 {formatTime(s.start)} – {formatTime(s.end)}
                          </span>
                        ))
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time <span>*</span></label>
                  <input
                    type="time"
                    className={`form-input${fieldErrors.startTime ? " has-error" : ""}`}
                    value={startTime}
                    onChange={e => {
                      setStartTime(e.target.value);
                      setFieldErrors(f => ({ ...f, startTime: "" }));
                      setError("");
                    }}
                  />
                  {fieldErrors.startTime && <span className="form-error">⚠ {fieldErrors.startTime}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">End Time <span>*</span></label>
                  <input
                    type="time"
                    className={`form-input${fieldErrors.endTime ? " has-error" : ""}`}
                    value={endTime}
                    min={startTime || undefined}
                    onChange={e => {
                      setEndTime(e.target.value);
                      setFieldErrors(f => ({ ...f, endTime: "" }));
                      setError("");
                    }}
                  />
                  {fieldErrors.endTime && <span className="form-error">⚠ {fieldErrors.endTime}</span>}
                </div>
              </div>

              {startTime && endTime && toMinutes(endTime) > toMinutes(startTime) && (
                <div style={{ fontSize: 12, color: "var(--db-muted)", marginBottom: 16, marginTop: -8 }}>
                  Duration: {toMinutes(endTime) - toMinutes(startTime)} min
                  &nbsp;({formatTime(startTime)} – {formatTime(endTime)})
                </div>
              )}

              <button
                type="submit"
                className="db-btn-book"
                disabled={loading || resourcesLoading || resources.length === 0}
              >
                {loading ? "Processing…" : "Confirm Reservation →"}
              </button>
            </form>
          </div>

          <div className="bookings-card">
            <div className="bookings-card-bar" />
            <div className="bookings-card-header">
              <div className="bookings-card-title">My Bookings</div>
              {!bookingsLoading && (
                <span className="bookings-count">{bookings.length} total</span>
              )}
            </div>

            {bookingsLoading ? (
              <div className="db-spinner" />
            ) : bookings.length === 0 ? (
              <div className="bookings-empty">
                <div className="bookings-empty-icon">📅</div>
                <div>No bookings yet. Reserve a resource to get started.</div>
              </div>
            ) : (
              [...bookings]
                .sort((bA, bB) => {
                  if (bA.date === bB.date) {
                    return (bA.startTime || "") < (bB.startTime || "") ? -1 : 1;
                  }
                  return bA.date < bB.date ? -1 : 1;
                })
                .map(b => {
                  const isPast   = b.date < today;
                  const isToday  = b.date === today;
                  const dotClass = isPast ? "past" : isToday ? "today" : "future";
                  const startStr = extractTime(b.startTime);
                  const endStr   = extractTime(b.endTime);

                  return (
                    <div className="booking-item" key={b._id}>
                      <div className={`booking-status-dot ${dotClass}`} />
                      <div className="booking-info">
                        <div className="booking-name">
                          {getResourceName(b.resourceId)}
                        </div>
                        <div className="booking-meta">
                          <span className="booking-date-badge">{formatDate(b.date)}</span>
                          {startStr && endStr
                            ? `${formatTime(startStr)} – ${formatTime(endStr)}`
                            : b.date}
                        </div>
                      </div>
                      {!isPast ? (
                        <button
                          className="btn-cancel-booking"
                          onClick={() => handleDelete(b._id)}
                          disabled={deletingId === b._id}
                        >
                          {deletingId === b._id ? "…" : "Cancel"}
                        </button>
                      ) : (
                        <span style={{
                          fontSize: 10, color: "var(--db-muted)", fontWeight: 600,
                          letterSpacing: "0.06em", textTransform: "uppercase"
                        }}>
                          Past
                        </span>
                      )}
                    </div>
                  );
                })
            )}
          </div>

        </div>
      </div>
    </>
  );
}