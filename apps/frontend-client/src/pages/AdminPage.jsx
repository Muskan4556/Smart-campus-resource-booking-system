import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── API helpers (adjust base URL to match your setup) ──────────────────────
const API = "http://localhost:5000/resources";

const apiFetch = (path, opts = {}, token) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      role: "admin",                          // matches isAdmin middleware
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Request failed");
    return data;
  });

const getResources  = (token)          => apiFetch("/", {}, token);
const addResource   = (body, token)    => apiFetch("/add", { method: "POST", body: JSON.stringify(body) }, token);
const deleteResource = (id, token)     => apiFetch(`/${id}`, { method: "DELETE" }, token);
// NOTE: your backend has no PUT route yet — we include it here ready to plug in
const updateResource = (id, body, token) =>
  apiFetch(`/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);

// ── Helpers ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { resourceId: "", resourceName: "", capacity: "", location: "" };

export default function AdminPage() {
  const [resources,  setResources]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);   // _id of resource being edited
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  // Guard: only admins allowed
  useEffect(() => {
    if (role !== "admin") navigate("/dashboard");
  }, [role, navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getResources(token);
      setResources(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { resourceId, resourceName, capacity, location } = form;
    if (!resourceId || !resourceName || !capacity) {
      setError("Resource ID, Name, and Capacity are required.");
      return;
    }
    if (Number(capacity) <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        // UPDATE (PUT) — wire up when backend route is added
        await updateResource(editId, { resourceName, capacity: Number(capacity), location }, token);
        showToast("Resource updated successfully.");
      } else {
        // ADD
        await addResource({ resourceId, resourceName, capacity: Number(capacity), location }, token);
        showToast("Resource added successfully.");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchResources();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (r) => {
    setEditId(r._id);
    setForm({
      resourceId:   r.resourceId,
      resourceName: r.resourceName,
      capacity:     String(r.capacity),
      location:     r.location || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteResource(id, token);
      showToast("Resource deleted.");
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

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

        /* NAV */
        .nav {
          background: var(--navy); padding: 0 60px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 16px rgba(10,15,30,0.15);
        }
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
          padding: 3px 8px; border-radius: 999px;
          border: 1px solid rgba(146,64,14,0.2);
        }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-btn {
          font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.7); background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 7px 16px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .nav-btn:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        /* SHELL */
        .shell { max-width: 1200px; margin: 0 auto; padding: 48px 60px 80px; }

        /* HEADER */
        .header-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--navy); margin-bottom: 10px;
        }
        .header-title {
          font-family: var(--font-s); font-size: clamp(28px, 4vw, 42px);
          line-height: 1.05; margin-bottom: 32px;
        }
        .header-title em { color: var(--navy); font-style: italic; }

        /* ALERTS */
        .alert {
          border-radius: 2px; padding: 12px 16px; font-size: 13px;
          margin-bottom: 24px; display: flex; align-items: center; gap: 8px;
        }
        .alert.error   { background: var(--red-lt);   border: 1px solid rgba(192,57,43,0.2);  color: var(--red);   }
        .alert.success { background: var(--green-lt);  border: 1px solid rgba(21,128,61,0.15); color: var(--green); }

        /* TOAST */
        .toast {
          position: fixed; bottom: 32px; right: 32px; z-index: 999;
          background: var(--ink); color: #fff;
          font-size: 13px; font-weight: 500;
          padding: 12px 20px; border-radius: 4px;
          box-shadow: 0 8px 32px rgba(10,15,30,0.25);
          animation: toastIn 0.3s ease;
        }
        @keyframes toastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        /* GRID LAYOUT */
        .admin-layout { display: grid; grid-template-columns: 380px 1fr; gap: 32px; align-items: start; }

        /* FORM CARD */
        .form-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 4px; padding: 36px 32px;
          box-shadow: 0 12px 40px rgba(10,15,30,0.06);
          position: relative; overflow: hidden;
        }
        .form-card-bar {
          position: absolute; left: 0; top: 0; right: 0; height: 4px;
          background: var(--navy); transition: background 0.3s;
        }
        .form-card-bar.editing { background: #d97706; }
        .form-card-title {
          font-family: var(--font-s); font-size: 20px;
          color: var(--ink); margin-bottom: 24px;
        }
        .form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 6px; }
        .form-label {
          font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--muted);
        }
        .form-label span { color: var(--red); margin-left: 2px; }
        .form-input {
          padding: 11px 13px; font-family: var(--font-b); font-size: 14px;
          border: 1px solid var(--border); border-radius: 2px; width: 100%;
          transition: border-color 0.2s; background: #fff;
        }
        .form-input:focus { outline: none; border-color: var(--navy); }
        .form-input:disabled { background: #f8f9fd; color: var(--muted); }
        .form-hint { font-size: 11px; color: var(--muted); margin-top: 2px; }

        .btn-submit {
          width: 100%; padding: 14px; margin-top: 8px;
          font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #fff; background: var(--navy);
          border: none; border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .btn-submit:hover:not(:disabled) { background: var(--navy-dk); transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-submit.editing { background: #d97706; }
        .btn-submit.editing:hover:not(:disabled) { background: #b45309; }

        .btn-cancel-edit {
          width: 100%; padding: 10px; margin-top: 8px;
          font-family: var(--font-b); font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--border); border-radius: 2px; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel-edit:hover { border-color: var(--muted); color: var(--ink); }

        /* RESOURCES TABLE CARD */
        .table-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 4px; box-shadow: 0 12px 40px rgba(10,15,30,0.06);
          position: relative; overflow: hidden;
        }
        .table-card-bar { position: absolute; left: 0; top: 0; right: 0; height: 4px; background: var(--navy); }
        .table-card-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .table-card-title { font-family: var(--font-s); font-size: 20px; color: var(--ink); }
        .resource-count {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted);
        }

        /* TABLE */
        .res-table { width: 100%; border-collapse: collapse; }
        .res-table th {
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--muted); padding: 12px 20px;
          text-align: left; border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .res-table td {
          padding: 16px 20px; font-size: 13px; color: var(--ink2);
          border-bottom: 1px solid var(--border); vertical-align: middle;
        }
        .res-table tr:last-child td { border-bottom: none; }
        .res-table tbody tr { transition: background 0.18s; }
        .res-table tbody tr:hover { background: var(--navy-xs); }
        .res-table tbody tr.is-editing { background: #fffbeb; }

        .cell-name { font-family: var(--font-s); font-size: 15px; color: var(--ink); }
        .cell-id {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          color: var(--navy); background: var(--navy-lt);
          padding: 3px 8px; border-radius: 2px; display: inline-block;
        }
        .cell-cap { font-weight: 600; }
        .cell-loc { color: var(--muted); }

        .actions { display: flex; gap: 8px; }
        .btn-edit {
          font-family: var(--font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--navy); background: var(--navy-lt);
          border: 1px solid rgba(15,31,92,0.15);
          padding: 6px 12px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .btn-edit:hover { background: var(--navy); color: #fff; }
        .btn-delete {
          font-family: var(--font-b); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--red); background: transparent;
          border: 1px solid rgba(192,57,43,0.25);
          padding: 6px 12px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .btn-delete:hover:not(:disabled) { background: var(--red-lt); }
        .btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }

        /* EMPTY / LOADING */
        .table-placeholder {
          padding: 56px 28px; text-align: center; color: var(--muted);
        }
        .table-placeholder-icon { font-size: 36px; opacity: 0.4; margin-bottom: 10px; }
        .table-placeholder-text { font-size: 14px; }

        .spinner {
          width: 28px; height: 28px; border: 2px solid var(--border);
          border-top-color: var(--navy); border-radius: 50%;
          animation: spin 0.7s linear infinite; margin: 40px auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .res-table tbody tr { animation: fadeUp 0.35s ease both; }

        /* STATS ROW */
        .stats-row { display: flex; gap: 1px; background: var(--border); border-bottom: 1px solid var(--border); }
        .stat-box {
          flex: 1; padding: 20px 24px; background: var(--surface);
        }
        .stat-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 6px;
        }
        .stat-val { font-family: var(--font-s); font-size: 28px; color: var(--ink); }

        @media (max-width: 1024px) {
          .admin-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .nav { padding: 0 24px; }
          .shell { padding: 32px 24px 60px; }
          .res-table th, .res-table td { padding: 12px 14px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
        <div>
          <p className="header-eyebrow">Administration</p>
          <h1 className="header-title">Manage <em>Resources.</em></h1>
        </div>

        {error && <div className="alert error">⚠ {error}</div>}

        <div className="admin-layout">
          {/* ── FORM ── */}
          <div className="form-card">
            <div className={`form-card-bar ${editId ? "editing" : ""}`} />
            <div className="form-card-title">
              {editId ? "✏ Edit Resource" : "+ Add Resource"}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Resource ID <span>*</span>
                </label>
                <input
                  className="form-input"
                  name="resourceId"
                  value={form.resourceId}
                  onChange={handleChange}
                  placeholder="e.g. LAB-001"
                  disabled={!!editId}   // can't change ID when editing
                />
                {editId && <span className="form-hint">Resource ID cannot be changed.</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Resource Name <span>*</span>
                </label>
                <input
                  className="form-input"
                  name="resourceName"
                  value={form.resourceName}
                  onChange={handleChange}
                  placeholder="e.g. Physics Laboratory"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Capacity <span>*</span>
                </label>
                <input
                  className="form-input"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Block A, Floor 2"
                />
              </div>

              <button
                type="submit"
                className={`btn-submit ${editId ? "editing" : ""}`}
                disabled={submitting}
              >
                {submitting
                  ? editId ? "Updating…" : "Adding…"
                  : editId ? "Update Resource →" : "Add Resource →"}
              </button>

              {editId && (
                <button type="button" className="btn-cancel-edit" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* ── TABLE ── */}
          <div className="table-card">
            <div className="table-card-bar" />

            {/* STATS */}
            {!loading && resources.length > 0 && (
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-label">Total Resources</div>
                  <div className="stat-val">{resources.length}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Total Capacity</div>
                  <div className="stat-val">
                    {resources.reduce((s, r) => s + (r.capacity || 0), 0)}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Locations</div>
                  <div className="stat-val">
                    {new Set(resources.map((r) => r.location).filter(Boolean)).size}
                  </div>
                </div>
              </div>
            )}

            <div className="table-card-header">
              <div className="table-card-title">All Resources</div>
              {!loading && (
                <span className="resource-count">{resources.length} entries</span>
              )}
            </div>

            {loading ? (
              <div className="spinner" />
            ) : resources.length === 0 ? (
              <div className="table-placeholder">
                <div className="table-placeholder-icon">📦</div>
                <div className="table-placeholder-text">
                  No resources yet. Add one using the form.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="res-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>ID</th>
                      <th>Capacity</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r._id} className={editId === r._id ? "is-editing" : ""}>
                        <td className="cell-name">{r.resourceName}</td>
                        <td><span className="cell-id">{r.resourceId}</span></td>
                        <td className="cell-cap">{r.capacity}</td>
                        <td className="cell-loc">{r.location || "—"}</td>
                        <td>
                          <div className="actions">
                            <button className="btn-edit" onClick={() => handleEdit(r)}>
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(r._id)}
                              disabled={deletingId === r._id}
                            >
                              {deletingId === r._id ? "…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}