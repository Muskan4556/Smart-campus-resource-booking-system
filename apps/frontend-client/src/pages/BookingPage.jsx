import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../services/resourceService";
import { bookResource } from "../services/bookingService";

export default function BookingPage() {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await getResources();
        setResources(res.data);
      } catch (err) {
        setError("Failed to load resources. Please refresh the page.");
      }
    };
    fetchResources();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedResource || !date || !startTime || !endTime) {
      setError("Please fill in all reservation fields.");
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
      setError("Booking failed: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
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
          --db-bg: #f2f4f8;
          --db-surface: #ffffff;
          --db-border: #cdd4e4;
          --db-ink: #0a0f1e;
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

        /* NAVIGATION */
        .db-nav {
          background: var(--db-navy);
          padding: 0 60px;
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
          padding: 7px 16px; cursor: pointer; border-radius: 2px;
          transition: all 0.2s;
        }
        .db-nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        /* SHELL */
        .db-shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        /* HEADER */
        .db-header-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--db-navy); margin-bottom: 12px;
        }
        .db-header-title {
          font-family: var(--db-font-s); font-size: clamp(28px, 5vw, 36px); margin-bottom: 32px; line-height: 1.1;
        }
        .db-header-title em { font-style: italic; color: var(--db-navy); }

        /* FORM CARD */
        .form-card {
          background: var(--db-surface);
          border: 1px solid var(--db-border);
          border-radius: 4px;
          padding: 48px 40px;
          box-shadow: 0 12px 40px rgba(10,15,30,0.06);
          position: relative;
          max-width: 100%;
        }
        .form-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--db-navy); }

        .form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--db-muted); }
        .form-input, .form-select { padding: 14px 16px; font-family: var(--db-font-b); font-size: 14px; border: 1px solid var(--db-border); border-radius: 2px; width: 100%; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .db-btn-book {
          width: 100%; padding: 18px; margin-top: 12px;
          font-family: var(--db-font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #fff; background: var(--db-navy);
          border: none; border-radius: 2px; cursor: pointer;
          transition: all 0.2s;
        }
        .db-btn-book:hover:not(:disabled) { background: var(--db-navy-dk); transform: translateY(-1px); }

        .db-error-box {
          background: var(--db-error-lt); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 2px; padding: 12px 18px; font-size: 13px; color: var(--db-error);
          margin-bottom: 28px; display: flex; align-items: center; gap: 8px;
        }
        @media (max-width: 768px) {
          .db-shell { padding: 32px 24px 60px; }
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
          <button className="db-nav-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      {/* SHELL */}
      <div className="db-shell">
        <div className="db-header">
          <p className="db-header-eyebrow">Service Request</p>
          <h1 className="db-header-title">Reserve a <em>Resource.</em></h1>
        </div>

        {error && <div className="db-error-box">⚠ {error}</div>}
        {success && (
          <div className="db-error-box" style={{ background: "#f0fdf4", color: "#15803d", borderColor: "rgba(21,128,61,0.1)" }}>
            ✓ Booking confirmed successfully!
          </div>
        )}

        <div className="form-card">
          <div className="form-card-bar" />
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label className="form-label">Available Resources</label>
              <select className="form-select" value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
                <option value="">Select a facility or item...</option>
                {resources.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Reservation</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
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
      </div>
    </>
  );
}