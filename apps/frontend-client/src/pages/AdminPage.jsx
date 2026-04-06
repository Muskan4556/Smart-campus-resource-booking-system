import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── API helpers ────────────────────────────────────────────────────────────
const RESOURCES_API = "http://localhost:5003/resources";
const ANALYTICS_API = "http://localhost:5004/api/analytics/peak-hours";

const apiFetch = (path, opts = {}, token) =>
  fetch(`${RESOURCES_API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      role: "admin",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Request failed");
    return data;
  });

const getResources   = (token)           => apiFetch("/", {}, token);
const addResource    = (body, token)     => apiFetch("/add", { method: "POST", body: JSON.stringify(body) }, token);
const deleteResource = (id, token)       => apiFetch(`/${id}`, { method: "DELETE" }, token);
const updateResource = (id, body, token) => apiFetch(`/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);

const EMPTY_FORM = { resourceId: "", resourceName: "", capacity: "", location: "" };

const RESOURCE_ICONS = {
  lab: "🔬", library: "📚", sport: "🏟️", auditorium: "🎭",
  equipment: "💻", default: "📋",
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

// ── Analytics sub-components ───────────────────────────────────────────────
function PeakHoursChart({ peakHours }) {
  if (!peakHours?.length)
    return <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>No data yet.</p>;
  const max = Math.max(...peakHours.map(h => h.bookingCount));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {peakHours.map((h, i) => {
        const pct = Math.round((h.bookingCount / max) * 100);
        return (
          <div key={h.timeSlot} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink2)", width: 52, flexShrink: 0, textAlign: "right" }}>
              {h.timeSlot}
            </div>
            <div style={{ flex: 1, background: "var(--navy-xs)", borderRadius: 2, height: 24, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: i === 0 ? "var(--navy)" : "#2a4db5",
                borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 8, minWidth: 28, transition: "width 0.8s cubic-bezier(.22,1,.36,1)",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{h.bookingCount}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PopularResourcesChart({ resources }) {
  if (!resources?.length)
    return <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>No data yet.</p>;
  const max = Math.max(...resources.map(r => r.bookingCount));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {resources.map((r, i) => {
        const pct = Math.round((r.bookingCount / max) * 100);
        return (
          <div key={r.resourceName} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted)", width: 18, flexShrink: 0 }}>
              #{i + 1}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink2)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.resourceName}
            </div>
            <div style={{ width: 100, flexShrink: 0 }}>
              <div style={{ background: "var(--navy-xs)", borderRadius: 2, height: 7, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--navy)", borderRadius: 2, transition: "width 0.8s cubic-bezier(.22,1,.36,1)" }} />
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)", width: 24, textAlign: "right", flexShrink: 0 }}>
              {r.bookingCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [resources,  setResources]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState({ msg: "", type: "success" });
  const [showForm,   setShowForm]   = useState(false);

  // Analytics
  const [analytics,     setAnalytics]     = useState(null);
  const [analyticsLoad, setAnalyticsLoad] = useState(true);
  const [analyticsErr,  setAnalyticsErr]  = useState("");
  const [analyticsTime, setAnalyticsTime] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "admin") navigate("/dashboard");
  }, [role, navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResources(token);
      setResources(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoad(true);
    setAnalyticsErr("");
    try {
      const res = await fetch(ANALYTICS_API, {
        headers: {
          "Content-Type": "application/json",
          role: "admin",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!json.success) throw new Error("Analytics unavailable");
      setAnalytics(json.data);
      setAnalyticsTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setAnalyticsErr(e.message || "Failed to load analytics");
    } finally {
      setAnalyticsLoad(false);
    }
  }, [token]);

  useEffect(() => {
    fetchResources();
    loadAnalytics();
  }, [fetchResources, loadAnalytics]);

  const handleChange = (e) => {
    setError("");
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const { resourceId, resourceName, capacity } = form;
    if (!resourceId.trim())    return "Resource ID is required.";
    if (!resourceName.trim())  return "Resource Name is required.";
    if (!capacity)             return "Capacity is required.";
    if (Number(capacity) <= 0) return "Capacity must be greater than 0.";
    if (Number(capacity) > 10000) return "Capacity seems unrealistically large.";
    // Check duplicate resourceId when adding
    if (!editId) {
      const exists = resources.find(r => r.resourceId.toLowerCase() === resourceId.trim().toLowerCase());
      if (exists) return `Resource ID "${resourceId}" already exists.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const { resourceId, resourceName, capacity, location } = form;
      if (editId) {
        await updateResource(
          editId,
          { resourceName: resourceName.trim(), capacity: Number(capacity), location: location.trim() },
          token
        );
        showToast("Resource updated successfully.");
      } else {
        await addResource(
          { resourceId: resourceId.trim(), resourceName: resourceName.trim(), capacity: Number(capacity), location: location.trim() },
          token
        );
        showToast("Resource added successfully.");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      fetchResources();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (r) => {
    setError("");
    setEditId(r._id);
    setForm({
      resourceId:   r.resourceId,
      resourceName: r.resourceName,
      capacity:     String(r.capacity),
      location:     r.location || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource? All bookings for this resource may be affected. This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteResource(id, token);
      showToast("Resource deleted.");
      setResources(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const analyticsPeak = analytics?.peakHours?.reduce(
    (a, b) => b.bookingCount > a.bookingCount ? b : a,
    analytics?.peakHours?.[0]
  );
  const analyticsTop = analytics?.popularResources?.[0];

  const totalCapacity = resources.reduce((s, r) => s + (r.capacity || 0), 0);
  const uniqueLocations = new Set(resources.map(r => r.location).filter(Boolean)).size;

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
          --red:      #c0392b;
          --red-lt:   #fdf0ef;
          --green:    #15803d;
          --green-lt: #f0fdf4;
          --amber:    #92400e;
          --amber-lt: #fffbeb;
          --font-s: 'DM Serif Display', Georgia, serif;
          --font-b: 'DM Sans', sans-serif;
        }
        body { background: var(--bg); font-family: var(--font-b); color: var(--ink); }

        .nav {
          background: var(--navy); padding: 0 60px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 16px rgba(10,15,30,0.15);
        }
        .nav-left { display: flex; align-items: center; gap: 16px; }
        .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .nav-logo-icon {
          width: 32px; height: 32px; background: rgba(255,255,255,0.12);
          display: grid; place-items: center; font-size: 14px;
          border-radius: 2px; border: 1px solid rgba(255,255,255,0.15);
        }
        .nav-logo-text { font-family: var(--font-s); font-size: 18px; color: #fff; }
        .nav-logo-text span { color: #a5b4fc; font-style: italic; }
        .nav-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--amber); background: var(--amber-lt);
          padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(146,64,14,0.2);
        }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-btn {
          font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.7); background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 7px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        .shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        .page-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--navy); display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .page-eyebrow::after { content: ''; width: 24px; height: 1px; background: var(--navy); }
        .page-title { font-family: var(--font-s); font-size: clamp(32px,4vw,48px); line-height: 1.05; margin-bottom: 40px; }
        .page-title em { color: var(--navy); font-style: italic; }

        .alert { border-radius: 2px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
        .alert.error { background: var(--red-lt); border: 1px solid rgba(192,57,43,0.2); color: var(--red); }

        .toast {
          position: fixed; bottom: 32px; right: 32px; z-index: 999;
          font-size: 13px; font-weight: 500;
          padding: 12px 20px; border-radius: 4px; box-shadow: 0 8px 32px rgba(10,15,30,0.25);
          animation: toastIn 0.3s ease;
        }
        .toast.success { background: var(--ink); color: #fff; }
        .toast.error   { background: var(--red); color: #fff; }
        @keyframes toastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        .stats-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 32px;
        }
        .stat-card { background: var(--surface); padding: 24px 24px 20px; position: relative; overflow: hidden; }
        .stat-card::before { content:''; position:absolute; left:0; top:0; right:0; height:3px; background: var(--navy); }
        .stat-card.accent-amber::before { background: #d97706; }
        .stat-card.accent-green::before { background: var(--green); }
        .stat-card.accent-blue::before  { background: #2a4db5; }
        .stat-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .stat-val { font-family: var(--font-s); font-size: 32px; color: var(--ink); line-height: 1; }
        .stat-val.sm { font-size: 18px; padding-top: 6px; }
        .stat-sub { font-size: 11px; color: var(--muted); margin-top: 6px; }

        .section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; margin-top: 40px;
        }
        .section-title-wrap { display: flex; align-items: center; gap: 10px; }
        .section-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--navy); }
        .section-count { font-family: var(--font-s); font-size: 13px; font-style: italic; color: var(--muted); }

        .btn-add-resource {
          font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fff; background: var(--navy);
          border: none; padding: 10px 20px; cursor: pointer; border-radius: 2px;
          transition: all 0.25s; display: flex; align-items: center; gap: 8px;
        }
        .btn-add-resource:hover { background: var(--navy-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,92,0.28); }

        .resource-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
        }
        .resource-card {
          background: var(--surface); padding: 28px 24px;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 14px;
          transition: background 0.25s;
          animation: fadeUp 0.4s ease both;
        }
        .resource-card:hover { background: var(--navy-xs); }
        .resource-card.is-editing { background: #fffbeb; }
        .resource-card-bar {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--navy); transform: scaleY(0); transform-origin: top;
          transition: transform 0.35s ease;
        }
        .resource-card:hover .resource-card-bar,
        .resource-card.is-editing .resource-card-bar { transform: scaleY(1); }
        .resource-card.is-editing .resource-card-bar { background: #d97706; }

        .rc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .rc-icon {
          font-size: 24px; background: var(--navy-lt); border-radius: 2px;
          width: 44px; height: 44px; display: grid; place-items: center; flex-shrink: 0;
        }
        .rc-id {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--navy); background: var(--navy-lt);
          padding: 4px 10px; border-radius: 999px;
        }
        .rc-name { font-family: var(--font-s); font-size: 18px; color: var(--ink); line-height: 1.1; }
        .rc-meta { display: flex; gap: 16px; flex-wrap: wrap; }
        .rc-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .rc-meta-label { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .rc-meta-val { font-size: 13px; font-weight: 600; color: var(--ink2); }
        .rc-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 4px; }
        .btn-edit-card {
          flex: 1; padding: 9px; font-family: var(--font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--navy); background: var(--navy-lt);
          border: 1px solid rgba(15,31,92,0.15); border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .btn-edit-card:hover { background: var(--navy); color: #fff; }
        .btn-delete-card {
          flex: 1; padding: 9px; font-family: var(--font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--red); background: transparent;
          border: 1px solid rgba(192,57,43,0.25); border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .btn-delete-card:hover:not(:disabled) { background: var(--red-lt); }
        .btn-delete-card:disabled { opacity: 0.4; cursor: not-allowed; }

        .empty-state {
          text-align: center; padding: 64px 0;
          border: 1px dashed var(--border); border-radius: 4px; background: var(--surface);
        }
        .empty-icon  { font-size: 36px; opacity: 0.4; margin-bottom: 12px; }
        .empty-title { font-family: var(--font-s); font-size: 20px; color: var(--ink); margin-bottom: 6px; }
        .empty-sub   { font-size: 13px; color: var(--muted); }

        .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--navy); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 40px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* MODAL */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(10,15,30,0.45);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeOverlay 0.2s ease;
        }
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: var(--surface); border-radius: 4px; width: 100%; max-width: 440px;
          box-shadow: 0 24px 80px rgba(10,15,30,0.2);
          position: relative; overflow: hidden;
          animation: modalUp 0.3s cubic-bezier(.22,1,.36,1);
        }
        @keyframes modalUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .modal-bar { position: absolute; left:0; top:0; right:0; height:4px; background: var(--navy); }
        .modal-bar.editing { background: #d97706; }
        .modal-header { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); }
        .modal-title  { font-family: var(--font-s); font-size: 22px; color: var(--ink); }
        .modal-body   { padding: 24px 28px; }
        .modal-footer { padding: 0 28px 24px; display: flex; flex-direction: column; gap: 8px; }

        .form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .form-label span { color: var(--red); margin-left: 2px; }
        .form-input {
          padding: 11px 13px; font-family: var(--font-b); font-size: 14px;
          border: 1px solid var(--border); border-radius: 2px; width: 100%;
          transition: border-color 0.2s; background: #fff;
        }
        .form-input:focus   { outline: none; border-color: var(--navy); }
        .form-input:disabled { background: #f8f9fd; color: var(--muted); cursor: not-allowed; }
        .form-hint { font-size: 11px; color: var(--muted); }

        .btn-submit {
          width: 100%; padding: 13px; font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #fff; background: var(--navy); border: none; border-radius: 2px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-submit:hover:not(:disabled) { background: var(--navy-dk); transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-submit.editing { background: #d97706; }
        .btn-submit.editing:hover:not(:disabled) { background: #b45309; }
        .btn-cancel {
          width: 100%; padding: 10px; font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--border); border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { border-color: var(--muted); color: var(--ink); }

        /* ANALYTICS */
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .chart-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 4px; position: relative; overflow: hidden;
          box-shadow: 0 8px 24px rgba(10,15,30,0.04);
        }
        .chart-card-bar    { position: absolute; left:0; top:0; right:0; height:3px; background: var(--navy); }
        .chart-card-header { padding: 18px 20px 14px; border-bottom: 1px solid var(--border); }
        .chart-card-title  { font-family: var(--font-s); font-size: 16px; color: var(--ink); }
        .chart-card-sub    { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .chart-card-body   { padding: 18px 20px 20px; }

        .analytics-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
        }
        .analytics-stat       { background: var(--surface); padding: 20px; }
        .analytics-stat-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .analytics-stat-val   { font-family: var(--font-s); font-size: 28px; color: var(--ink); line-height: 1; }
        .analytics-stat-val.sm { font-size: 16px; padding-top: 4px; }
        .analytics-stat-sub   { font-size: 11px; color: var(--muted); margin-top: 4px; }

        .btn-refresh {
          font-family: var(--font-b); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent; border: 1px solid var(--border);
          padding: 6px 14px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .btn-refresh:hover:not(:disabled) { border-color: var(--navy); color: var(--navy); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        .page-footer {
          margin-top: 64px; padding-top: 28px; border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .footer-logo { font-family: var(--font-s); font-size: 15px; color: var(--muted); }
        .footer-logo span { color: var(--navy); font-style: italic; }
        .footer-copy { font-size: 11px; color: var(--border); letter-spacing: 0.08em; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 1024px) { .analytics-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
          .nav   { padding: 0 24px; }
          .shell { padding: 32px 24px 60px; }
          .stats-row        { grid-template-columns: repeat(2,1fr); }
          .analytics-stats  { grid-template-columns: 1fr; }
          .resource-grid    { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-left">
          <a href="/dashboard" className="nav-logo">
            <div className="nav-logo-icon">🏛</div>
            <div className="nav-logo-text">Smart<span>Campus</span></div>
          </a>
          <span className="nav-badge">⚙ Admin</span>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <button className="nav-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="shell">
        <p className="page-eyebrow">Administration</p>
        <h1 className="page-title">Manage <em>Campus.</em></h1>

        {error && !showForm && <div className="alert error">⚠ {error}</div>}

        {/* STATS ROW */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Resources</div>
            <div className="stat-val">{loading ? "—" : resources.length}</div>
            <div className="stat-sub">Registered resources</div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-label">Total Capacity</div>
            <div className="stat-val">{loading ? "—" : totalCapacity.toLocaleString()}</div>
            <div className="stat-sub">Seats across campus</div>
          </div>
          <div className="stat-card accent-amber">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-val">{analyticsLoad ? "—" : analyticsErr ? "—" : analytics?.totalBookings ?? "—"}</div>
            <div className="stat-sub">Via analytics service</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-label">Locations</div>
            <div className="stat-val">{loading ? "—" : uniqueLocations}</div>
            <div className="stat-sub">Unique locations</div>
          </div>
        </div>

        {/* RESOURCES */}
        <div className="section-head">
          <div className="section-title-wrap">
            <span className="section-eyebrow">Resources</span>
            {!loading && <span className="section-count">— {resources.length} registered</span>}
          </div>
          <button
            className="btn-add-resource"
            onClick={() => { setEditId(null); setForm(EMPTY_FORM); setError(""); setShowForm(true); }}
          >
            + Add Resource
          </button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No resources yet</div>
            <div className="empty-sub">Click "Add Resource" to get started.</div>
          </div>
        ) : (
          <div className="resource-grid">
            {resources.map((r, i) => (
              <div
                className={`resource-card${editId === r._id ? " is-editing" : ""}`}
                key={r._id}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="resource-card-bar" />
                <div className="rc-top">
                  <div className="rc-icon">{getIcon(r.resourceName)}</div>
                  <span className="rc-id">{r.resourceId}</span>
                </div>
                <div className="rc-name">{r.resourceName}</div>
                <div className="rc-meta">
                  {r.capacity && (
                    <div className="rc-meta-item">
                      <span className="rc-meta-label">Capacity</span>
                      <span className="rc-meta-val">{r.capacity} people</span>
                    </div>
                  )}
                  {r.location && (
                    <div className="rc-meta-item">
                      <span className="rc-meta-label">Location</span>
                      <span className="rc-meta-val">{r.location}</span>
                    </div>
                  )}
                </div>
                <div className="rc-actions">
                  <button className="btn-edit-card" onClick={() => handleEdit(r)}>
                    {editId === r._id ? "Editing…" : "Edit"}
                  </button>
                  <button
                    className="btn-delete-card"
                    onClick={() => handleDelete(r._id)}
                    disabled={deletingId === r._id}
                  >
                    {deletingId === r._id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANALYTICS */}
        <div className="section-head" style={{ marginTop: 56 }}>
          <div className="section-title-wrap">
            <span className="section-eyebrow">Analytics</span>
            {analyticsTime && <span className="section-count">— updated {analyticsTime}</span>}
          </div>
          <button className="btn-refresh" onClick={loadAnalytics} disabled={analyticsLoad}>
            {analyticsLoad ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        <div className="analytics-stats">
          <div className="analytics-stat">
            <div className="analytics-stat-label">Peak Hour</div>
            <div className={`analytics-stat-val${analyticsPeak?.timeSlot?.length > 8 ? " sm" : ""}`}>
              {analyticsLoad ? "—" : analyticsErr ? "—" : analyticsPeak?.timeSlot ?? "—"}
            </div>
            {analyticsPeak && <div className="analytics-stat-sub">{analyticsPeak.bookingCount} bookings</div>}
          </div>
          <div className="analytics-stat">
            <div className="analytics-stat-label">Top Resource</div>
            <div className={`analytics-stat-val${analyticsTop?.resourceName?.length > 10 ? " sm" : ""}`}>
              {analyticsLoad ? "—" : analyticsErr ? "—" : analyticsTop?.resourceName ?? "—"}
            </div>
            {analyticsTop && <div className="analytics-stat-sub">{analyticsTop.bookingCount} bookings</div>}
          </div>
          <div className="analytics-stat">
            <div className="analytics-stat-label">Total Bookings</div>
            <div className="analytics-stat-val">
              {analyticsLoad ? "—" : analyticsErr ? "—" : analytics?.totalBookings ?? "—"}
            </div>
            <div className="analytics-stat-sub">All time</div>
          </div>
        </div>

        {analyticsErr && <div className="alert error" style={{ marginTop: 16 }}>⚠ {analyticsErr}</div>}

        {!analyticsErr && (
          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-bar" />
              <div className="chart-card-header">
                <div className="chart-card-title">Peak Hours</div>
                <div className="chart-card-sub">Bookings by time slot</div>
              </div>
              <div className="chart-card-body">
                {analyticsLoad ? <div className="spinner" style={{ margin: "24px auto" }} /> : <PeakHoursChart peakHours={analytics?.peakHours} />}
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-card-bar" />
              <div className="chart-card-header">
                <div className="chart-card-title">Popular Resources</div>
                <div className="chart-card-sub">Ranked by booking count</div>
              </div>
              <div className="chart-card-body">
                {analyticsLoad ? <div className="spinner" style={{ margin: "24px auto" }} /> : <PopularResourcesChart resources={analytics?.popularResources} />}
              </div>
            </div>
          </div>
        )}

        <div className="page-footer">
          <div className="footer-logo">Smart<span>Campus</span></div>
          <div className="footer-copy">© 2025 SmartCampus — Admin</div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelEdit()}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={`modal-bar${editId ? " editing" : ""}`} />
            <div className="modal-header">
              <div className="modal-title" id="modal-title">
                {editId ? "✏ Edit Resource" : "+ Add Resource"}
              </div>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                {error && <div className="alert error" style={{ marginBottom: 16 }}>⚠ {error}</div>}
                <div className="form-group">
                  <label className="form-label">Resource ID <span>*</span></label>
                  <input
                    className="form-input"
                    name="resourceId"
                    value={form.resourceId}
                    onChange={handleChange}
                    placeholder="e.g. LAB-001"
                    disabled={!!editId}
                    autoFocus={!editId}
                  />
                  {editId
                    ? <span className="form-hint">Resource ID cannot be changed after creation.</span>
                    : <span className="form-hint">Must be unique across all resources.</span>
                  }
                </div>
                <div className="form-group">
                  <label className="form-label">Resource Name <span>*</span></label>
                  <input
                    className="form-input"
                    name="resourceName"
                    value={form.resourceName}
                    onChange={handleChange}
                    placeholder="e.g. Physics Laboratory"
                    autoFocus={!!editId}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity <span>*</span></label>
                  <input
                    className="form-input"
                    name="capacity"
                    type="number"
                    min="1"
                    max="10000"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Block A, Floor 2"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="submit"
                  className={`btn-submit${editId ? " editing" : ""}`}
                  disabled={submitting}
                >
                  {submitting
                    ? (editId ? "Updating…" : "Adding…")
                    : (editId ? "Update Resource →" : "Add Resource →")}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.msg && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
        </div>
      )}
    </>
  );
}