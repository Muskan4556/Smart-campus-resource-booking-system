import { useState } from "react";
import { login } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email.trim())    return setError("Please enter your email.");
    if (!password.trim()) return setError("Please enter your password.");
    setLoading(true);
    try {
      const res = await login({ email, password });
      localStorage.setItem("token",  res.data.token);
      localStorage.setItem("userId", res.data.userId || res.data.user?._id || "");
      localStorage.setItem("role",   res.data.role   || res.data.user?.role || "user");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
        :root {
          --bg: #f2f4f8; --surface: #ffffff; --border: #cdd4e4;
          --ink: #0a0f1e; --ink2: #1a2340; --muted: #5c6b8a;
          --navy: #0f1f5c; --navy-dk: #0a1540; --navy-lt: #e8ecf8;
          --error: #c0392b; --error-lt: #fdf0ef;
          --font-s: 'DM Serif Display', Georgia, serif;
          --font-b: 'DM Sans', sans-serif;
        }
        body { background: var(--bg); font-family: var(--font-b); color: var(--ink); }
        .login-page { min-height: 100vh; width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
        .login-brand {
          background: var(--navy); display: flex; flex-direction: column;
          justify-content: space-between; padding: 48px 56px;
          position: relative; overflow: hidden; min-height: 100vh;
        }
        .login-brand::before {
          content: ''; position: absolute; top: -160px; right: -160px;
          width: 480px; height: 480px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06); pointer-events: none;
        }
        .login-brand::after {
          content: ''; position: absolute; bottom: -100px; left: -100px;
          width: 340px; height: 340px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.04); pointer-events: none;
        }
        .login-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; position: relative; z-index: 1; }
        .login-logo-icon {
          width: 36px; height: 36px; background: rgba(255,255,255,0.12);
          display: grid; place-items: center; font-size: 16px;
          border-radius: 2px; border: 1px solid rgba(255,255,255,0.15);
        }
        .login-logo-text { font-family: var(--font-s); font-size: 20px; color: #fff; line-height: 1; }
        .login-logo-text span { color: #a5b4fc; font-style: italic; }
        .login-brand-main { position: relative; z-index: 1; }
        .login-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: #a5b4fc; display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .login-eyebrow::before { content: ''; display: block; width: 20px; height: 1px; background: #a5b4fc; }
        .login-brand-title {
          font-family: var(--font-s); font-size: clamp(36px, 3.5vw, 52px);
          line-height: 1.05; color: #fff; margin-bottom: 20px;
        }
        .login-brand-title em { color: #a5b4fc; font-style: italic; }
        .login-brand-desc { font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.5); max-width: 360px; }
        .login-features { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .login-feature { display: flex; align-items: center; gap: 12px; font-size: 13px; color: rgba(255,255,255,0.6); }
        .login-feature-dot { width: 6px; height: 6px; border-radius: 50%; background: #a5b4fc; flex-shrink: 0; }
        .login-form-panel {
          background: var(--surface); display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; position: relative; overflow: hidden; min-height: 100vh;
        }
        .login-form-panel::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px; opacity: 0.3;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }
        .login-form-box { width: 100%; max-width: 400px; position: relative; z-index: 1; animation: loginFadeUp 0.6s ease both; }
        .login-form-heading { margin-bottom: 36px; }
        .login-form-label-top {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--navy); display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .login-form-label-top::after { content: ''; width: 20px; height: 1px; background: var(--navy); }
        .login-form-title { font-family: var(--font-s); font-size: clamp(30px, 3vw, 42px); line-height: 1.05; color: var(--ink); margin-bottom: 8px; }
        .login-form-title em { color: var(--navy); font-style: italic; }
        .login-form-subtitle { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .login-field { margin-bottom: 20px; }
        .login-field-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink2); margin-bottom: 8px; }
        .login-field-input {
          width: 100%; padding: 12px 16px; font-family: var(--font-b); font-size: 14px; color: var(--ink);
          background: var(--bg); border: 1.5px solid var(--border); border-radius: 2px; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .login-field-input::placeholder { color: var(--muted); }
        .login-field-input:focus { border-color: var(--navy); background: var(--surface); box-shadow: 0 0 0 3px rgba(15,31,92,0.08); }
        .login-field-input.err { border-color: var(--error); }
        .login-error-box {
          background: var(--error-lt); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 2px; padding: 12px 16px; font-size: 13px; color: var(--error);
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }
        .login-btn-submit {
          width: 100%; padding: 14px; font-family: var(--font-b); font-size: 14px; font-weight: 600;
          letter-spacing: 0.05em; color: #fff; background: var(--navy);
          border: none; border-radius: 2px; cursor: pointer;
          transition: all 0.25s; position: relative; overflow: hidden; margin-top: 4px;
        }
        .login-btn-submit::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .login-btn-submit:hover:not(:disabled)::after { transform: translateX(100%); }
        .login-btn-submit:hover:not(:disabled) { background: var(--navy-dk); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,31,92,0.28); }
        .login-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-divider { display: flex; align-items: center; gap: 14px; margin: 24px 0; color: var(--muted); font-size: 12px; }
        .login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .login-footer { text-align: center; font-size: 13px; color: var(--muted); }
        .login-footer a { color: var(--navy); font-weight: 600; text-decoration: none; transition: color 0.2s; }
        .login-footer a:hover { color: var(--navy-dk); text-decoration: underline; }
        @keyframes loginFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          .login-page { grid-template-columns: 1fr; }
          .login-brand { min-height: auto; padding: 36px 24px 48px; }
          .login-features { display: none; }
          .login-form-panel { min-height: auto; padding: 48px 24px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-brand">
          <Link to="/" className="login-logo">
            <div className="login-logo-icon">🏛</div>
            <div className="login-logo-text">Smart<span>Campus</span></div>
          </Link>
          <div className="login-brand-main">
            <p className="login-eyebrow">Welcome back</p>
            <h2 className="login-brand-title">Your campus.<br />Your <em>schedule.</em></h2>
            <p className="login-brand-desc">
              Log in to manage your bookings, check availability, and reserve campus resources in seconds.
            </p>
          </div>
          <div className="login-features">
            {["Book labs, rooms & sports courts", "Real-time availability", "Instant confirmation"].map(f => (
              <div className="login-feature" key={f}>
                <div className="login-feature-dot" />{f}
              </div>
            ))}
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-box">
            <div className="login-form-heading">
              <p className="login-form-label-top">Sign In</p>
              <h1 className="login-form-title">Welcome <em>back.</em></h1>
              <p className="login-form-subtitle">Enter your campus credentials to continue.</p>
            </div>

            {error && <div className="login-error-box">⚠ {error}</div>}

            <div className="login-field">
              <label className="login-field-label">Email</label>
              <input
                className={`login-field-input${error ? " err" : ""}`}
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="login-field">
              <label className="login-field-label">Password</label>
              <input
                className={`login-field-input${error ? " err" : ""}`}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button className="login-btn-submit" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>

            <div className="login-divider">or</div>

            <p className="login-footer">
              Don't have an account? <Link to="/signup">Create one →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}