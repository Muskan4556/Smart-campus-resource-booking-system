import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../services/resourceService";
import { bookResource } from "../services/bookingService";

// Fetch user bookings — adjust URL to match your API base
const getUserBookings = (userId, token) =>
  fetch(`http://localhost:5000/bookings/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}`, role: "user" },
  }).then((r) => r.json());

const deleteBooking = (id, token) =>
  fetch(`http://localhost:5000/bookings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, role: "user" },
  }).then((r) => r.json());

export default function BookingPage() {
  const [resources,         setResources]         = useState([]);
  const [selectedResource,  setSelectedResource]  = useState("");
  const [date,              setDate]              = useState("");
  const [startTime,         setStartTime]         = useState("");
  const [endTime,           setEndTime]           = useState("");
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState(false);

  // Existing bookings list
  const [bookings,          setBookings]          = useState([]);
  const [bookingsLoading,   setBookingsLoading]   = useState(true);
  const [deletingId,        setDeletingId]        = useState(null);

  const navigate = useNavigate();
  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await getResources();
        setResources(res.data);
      } catch {
        setError("Failed to load resources. Please refresh the page.");
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const data = await getUserBookings(userId, token);
        setBookings(Array.isArray(data) ? data : []);
      } catch {
        // silently fail for bookings list
      } finally {
        setBookingsLoading(false);
      }
    };
    if (userId) fetchBookings();
  }, [userId, success]); // refetch after new booking

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedResource || !date || !startTime || !endTime) {
      setError("Please fill in all reservation fields.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      await bookResource(
        { userId, resourceId: selectedResource, date, startTime, endTime },
        token
      );
      setSuccess(true);
      setSelectedResource("");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError("Booking failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteBooking(id, token);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch {
      setError("Failed to cancel booking.");
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

  // helper: find resource name by ID
  const getResourceName = (id) => {
    const r = resources.find((x) => x._id === id);
    return r ? r.resourceName : id;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100%; margin: 0; padding: 0; }

        :root {
          --db-bg: #f2f4f8;
          --db-surface: #ffffff;
          --db-border: #cdd4e4;
          --db-ink: #0a0f1e;
          --db-ink2: #1a2340;
          --db-muted: #5c6b8a;
          --db-navy: #0f1f5c;
          --db-navy-dk: #0a1540;
          --db-navy-lt: #e8ecf8;
          --db-success: #15803d;
          --db-success-lt: #f0fdf4;
          --db-error: #c0392b;
          --db-error-lt: #fdf0ef;
          --db-font-s: 'DM Serif Display', Georgia, serif;
          --db-font-b: 'DM Sans', sans-serif;
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

        /* TWO-COLUMN LAYOUT */
        .db-layout {
          display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start;
        }

        .form-card {
          background: var(--db-surface); border: 1px solid var(--db-border);
          border-radius: 4px; padding: 40px 36px;
          box-shadow: 0 12px 40px rgba(10,15,30,0.06); position: relative;
        }
        .form-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--db-navy); border-radius: 4px 4px 0 0; }
        .form-card-title {
          font-family: var(--db-font-s); font-size: 20px; margin-bottom: 28px;
          color: var(--db-ink);
        }

        .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 7px; }
        .form-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--db-muted); }
        .form-input, .form-select {
          padding: 12px 14px; font-family: var(--db-font-b); font-size: 14px;
          border: 1px solid var(--db-border); border-radius: 2px; width: 100%;
          background: #fff; transition: border-color 0.2s;
        }
        .form-input:focus, .form-select:focus { outline: none; border-color: var(--db-navy); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .db-btn-book {
          width: 100%; padding: 15px; margin-top: 8px;
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .db-btn-book:hover:not(:disabled) { background: var(--db-navy-dk); transform: translateY(-1px); }
        .db-btn-book:disabled { opacity: 0.6; cursor: not-allowed; }

        .db-alert {
          border-radius: 2px; padding: 11px 16px; font-size: 13px;
          margin-bottom: 24px; display: flex; align-items: center; gap: 8px;
        }
        .db-alert.error { background: var(--db-error-lt); border: 1px solid rgba(192,57,43,0.2); color: var(--db-error); }
        .db-alert.success { background: var(--db-success-lt); border: 1px solid rgba(21,128,61,0.15); color: var(--db-success); }

        /* BOOKINGS LIST CARD */
        .bookings-card {
          background: var(--db-surface); border: 1px solid var(--db-border);
          border-radius: 4px; box-shadow: 0 12px 40px rgba(10,15,30,0.06);
          position: relative; overflow: hidden;
        }
        .bookings-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--db-navy); }
        .bookings-card-header {
          padding: 28px 32px 20px;
          border-bottom: 1px solid var(--db-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .bookings-card-title { font-family: var(--db-font-s); font-size: 20px; color: var(--db-ink); }
        .bookings-count {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--db-muted);
        }

        .booking-item {
          padding: 18px 32px; border-bottom: 1px solid var(--db-border);
          display: flex; align-items: center; gap: 16px;
          animation: dbFadeUp 0.4s ease both;
          transition: background 0.2s;
        }
        .booking-item:last-child { border-bottom: none; }
        .booking-item:hover { background: #f8f9fd; }

        .booking-dot {
          width: 8px; height: 8px; background: var(--db-navy);
          border-radius: 50%; flex-shrink: 0;
        }
        .booking-info { flex: 1; min-width: 0; }
        .booking-name {
          font-family: var(--db-font-s); font-size: 15px;
          color: var(--db-ink); margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .booking-meta { font-size: 11px; color: var(--db-muted); }

        .booking-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .booking-tag {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--db-navy); background: var(--db-navy-lt);
          padding: 3px 8px; border-radius: 2px;
        }

        .btn-cancel {
          font-family: var(--db-font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--db-error); background: transparent;
          border: 1px solid rgba(192,57,43,0.25);
          padding: 6px 12px; cursor: pointer; border-radius: 2px;
          flex-shrink: 0; transition: all 0.2s;
        }
        .btn-cancel:hover:not(:disabled) { background: var(--db-error-lt); }
        .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

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

        @keyframes dbSpin { to { transform: rotate(360deg); } }
        @keyframes dbFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 900px) {
          .db-layout { grid-template-columns: 1fr; }
          .db-shell { padding: 32px 24px 60px; }
          .db-nav { padding: 0 24px; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>

      {/* NAV */}
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

        {error && <div className="db-alert error">⚠ {error}</div>}
        {success && <div className="db-alert success">✓ Booking confirmed successfully!</div>}

        <div className="db-layout">
          {/* FORM */}
          <div className="form-card">
            <div className="form-card-bar" />
            <div className="form-card-title">New Reservation</div>
            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label className="form-label">Available Resources</label>
                <select
                  className="form-select"
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                >
                  <option value="">Select a facility or item...</option>
                  {/* FIX: use r.resourceName */}
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>{r.resourceName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Reservation</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="db-btn-book" disabled={loading}>
                {loading ? "Processing..." : "Confirm Reservation →"}
              </button>
            </form>
          </div>

          {/* BOOKINGS LIST */}
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
              bookings.map((b) => (
                <div className="booking-item" key={b._id}>
                  <div className="booking-dot" />
                  <div className="booking-info">
                    <div className="booking-name">{getResourceName(b.resourceId)}</div>
                    <div className="booking-meta">{b.date} · {b.startTime} – {b.endTime}</div>
                  </div>
                  <button
                    className="btn-cancel"
                    onClick={() => handleDelete(b._id)}
                    disabled={deletingId === b._id}
                  >
                    {deletingId === b._id ? "..." : "Cancel"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}