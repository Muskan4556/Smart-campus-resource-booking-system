import { useState } from "react";
import { signup } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

const PASSWORD_RULES = [
  { label: "At least 8 characters",          test: (p) => p.length >= 8 },
  { label: "One uppercase letter",            test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",            test: (p) => /[a-z]/.test(p) },
  { label: "One number",                      test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Signup() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [touched,  setTouched]  = useState(false);
  const navigate = useNavigate();

  const passResults  = PASSWORD_RULES.map(r => ({ ...r, ok: r.test(password) }));
  const passValid    = passResults.every(r => r.ok);
  const passStrength = passResults.filter(r => r.ok).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][passStrength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][passStrength];

  const handleSignup = async () => {
    setError("");
    if (!name.trim())  return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!passValid)    return setError("Please meet all password requirements.");
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate("/login", { state: { success: "Account created! Please sign in." } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSignup(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
        :root {
          --su-bg: #f2f4f8; --su-surface: #ffffff; --su-border: #cdd4e4;
          --su-ink: #0a0f1e; --su-ink2: #1a2340; --su-muted: #5c6b8a;
          --su-navy: #0f1f5c; --su-navy-dk: #0a1540; --su-navy-lt: #e8ecf8;
          --su-error: #c0392b; --su-error-lt: #fdf0ef;
          --su-font-s: 'DM Serif Display', Georgia, serif;
          --su-font-b: 'DM Sans', sans-serif;
        }
        body { background: var(--su-bg); font-family: var(--su-font-b); color: var(--su-ink); }
        .su-page { min-height: 100vh; width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
        .su-brand {
          background: var(--su-navy); display: flex; flex-direction: column;
          justify-content: space-between; padding: 48px 56px;
          position: relative; overflow: hidden; min-height: 100vh;
        }
        .su-brand::before {
          content: ''; position: absolute; top: -160px; right: -160px;
          width: 480px; height: 480px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06); pointer-events: none;
        }
        .su-brand::after {
          content: ''; position: absolute; bottom: -100px; left: -100px;
          width: 340px; height: 340px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.04); pointer-events: none;
        }
        .su-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; position: relative; z-index: 1; }
        .su-logo-icon {
          width: 36px; height: 36px; background: rgba(255,255,255,0.12);
          display: grid; place-items: center; font-size: 16px;
          border-radius: 2px; border: 1px solid rgba(255,255,255,0.15);
        }
        .su-logo-text { font-family: var(--su-font-s); font-size: 20px; color: #fff; line-height: 1; }
        .su-logo-text span { color: #a5b4fc; font-style: italic; }
        .su-brand-main { position: relative; z-index: 1; }
        .su-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: #a5b4fc; display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .su-eyebrow::before { content: ''; display: block; width: 20px; height: 1px; background: #a5b4fc; }
        .su-brand-title { font-family: var(--su-font-s); font-size: clamp(34px, 3.2vw, 48px); line-height: 1.05; color: #fff; margin-bottom: 20px; }
        .su-brand-title em { color: #a5b4fc; font-style: italic; }
        .su-brand-desc { font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.5); max-width: 360px; }
        .su-features { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .su-feature { display: flex; align-items: center; gap: 12px; font-size: 13px; color: rgba(255,255,255,0.6); }
        .su-feature-dot { width: 6px; height: 6px; border-radius: 50%; background: #a5b4fc; flex-shrink: 0; }
        .su-form-panel {
          background: var(--su-surface); display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; position: relative; overflow: hidden; min-height: 100vh;
        }
        .su-form-panel::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(var(--su-border) 1px, transparent 1px), linear-gradient(90deg, var(--su-border) 1px, transparent 1px);
          background-size: 40px 40px; opacity: 0.3;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }
        .su-form-box { width: 100%; max-width: 420px; position: relative; z-index: 1; animation: suFadeUp 0.6s ease both; }
        .su-form-heading { margin-bottom: 32px; }
        .su-form-label-top {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--su-navy); display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .su-form-label-top::after { content: ''; width: 20px; height: 1px; background: var(--su-navy); }
        .su-form-title { font-family: var(--su-font-s); font-size: clamp(28px, 3vw, 40px); line-height: 1.05; color: var(--su-ink); margin-bottom: 8px; }
        .su-form-title em { color: var(--su-navy); font-style: italic; }
        .su-form-subtitle { font-size: 14px; color: var(--su-muted); line-height: 1.6; }
        .su-field { margin-bottom: 18px; }
        .su-field-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--su-ink2); margin-bottom: 8px; }
        .su-field-input {
          width: 100%; padding: 12px 16px; font-family: var(--su-font-b); font-size: 14px; color: var(--su-ink);
          background: var(--su-bg); border: 1.5px solid var(--su-border); border-radius: 2px; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .su-field-input::placeholder { color: var(--su-muted); }
        .su-field-input:focus { border-color: var(--su-navy); background: var(--su-surface); box-shadow: 0 0 0 3px rgba(15,31,92,0.08); }
        .su-field-input.su-err { border-color: var(--su-error); }
        .su-strength-bar-wrap { height: 3px; background: var(--su-border); border-radius: 999px; margin-top: 10px; overflow: hidden; }
        .su-strength-bar { height: 100%; border-radius: 999px; transition: width 0.4s ease, background 0.4s ease; }
        .su-strength-meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; }
        .su-strength-text { font-weight: 600; }
        .su-pw-rules { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
        .su-rule { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--su-muted); transition: color 0.2s; }
        .su-rule.su-ok { color: #16a34a; }
        .su-rule-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--su-border); flex-shrink: 0; transition: background 0.2s; }
        .su-rule.su-ok .su-rule-dot { background: #16a34a; }
        .su-error-box {
          background: var(--su-error-lt); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 2px; padding: 12px 16px; font-size: 13px; color: var(--su-error);
          margin-bottom: 18px; display: flex; align-items: center; gap: 8px;
        }
        .su-btn-submit {
          width: 100%; padding: 14px; font-family: var(--su-font-b); font-size: 14px; font-weight: 600;
          letter-spacing: 0.05em; color: #fff; background: var(--su-navy);
          border: none; border-radius: 2px; cursor: pointer;
          transition: all 0.25s; position: relative; overflow: hidden; margin-top: 20px;
        }
        .su-btn-submit::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .su-btn-submit:hover:not(:disabled)::after { transform: translateX(100%); }
        .su-btn-submit:hover:not(:disabled) { background: var(--su-navy-dk); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,31,92,0.28); }
        .su-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .su-divider { display: flex; align-items: center; gap: 14px; margin: 24px 0; color: var(--su-muted); font-size: 12px; }
        .su-divider::before, .su-divider::after { content: ''; flex: 1; height: 1px; background: var(--su-border); }
        .su-footer { text-align: center; font-size: 13px; color: var(--su-muted); }
        .su-footer a { color: var(--su-navy); font-weight: 600; text-decoration: none; transition: color 0.2s; }
        .su-footer a:hover { color: var(--su-navy-dk); text-decoration: underline; }
        @keyframes suFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          .su-page { grid-template-columns: 1fr; }
          .su-brand { min-height: auto; padding: 36px 24px 48px; }
          .su-features { display: none; }
          .su-form-panel { min-height: auto; padding: 48px 24px; }
          .su-pw-rules { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="su-page">
        <div className="su-brand">
          <Link to="/" className="su-logo">
            <div className="su-logo-icon">🏛</div>
            <div className="su-logo-text">Smart<span>Campus</span></div>
          </Link>
          <div className="su-brand-main">
            <p className="su-eyebrow">Get started</p>
            <h2 className="su-brand-title">Join your<br />campus <em>community.</em></h2>
            <p className="su-brand-desc">
              Create your account and start booking labs, rooms, courts, and equipment — all in one place.
            </p>
          </div>
          <div className="su-features">
            {["Free to use for all students & staff", "Instant booking confirmation", "No double-bookings, ever"].map(f => (
              <div className="su-feature" key={f}><div className="su-feature-dot" />{f}</div>
            ))}
          </div>
        </div>

        <div className="su-form-panel">
          <div className="su-form-box">
            <div className="su-form-heading">
              <p className="su-form-label-top">Create Account</p>
              <h1 className="su-form-title">Sign up <em>free.</em></h1>
              <p className="su-form-subtitle">Register with your campus email to get started.</p>
            </div>

            {error && <div className="su-error-box">⚠ {error}</div>}

            <div className="su-field">
              <label className="su-field-label">Full Name</label>
              <input
                className="su-field-input"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="su-field">
              <label className="su-field-label">Email</label>
              <input
                className="su-field-input"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="su-field">
              <label className="su-field-label">Password</label>
              <input
                className="su-field-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                onKeyDown={handleKeyDown}
              />
              {touched && password.length > 0 && (
                <>
                  <div className="su-strength-bar-wrap">
                    <div className="su-strength-bar" style={{ width: `${(passStrength / 5) * 100}%`, background: strengthColor }} />
                  </div>
                  <div className="su-strength-meta">
                    <span className="su-strength-text" style={{ color: strengthColor }}>{strengthLabel}</span>
                    <span style={{ color: "var(--su-muted)", fontSize: 11 }}>{passStrength}/5</span>
                  </div>
                  <div className="su-pw-rules">
                    {passResults.map(r => (
                      <div key={r.label} className={`su-rule${r.ok ? " su-ok" : ""}`}>
                        <div className="su-rule-dot" />{r.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="su-btn-submit" onClick={handleSignup} disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>

            <div className="su-divider">or</div>

            <p className="su-footer">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}