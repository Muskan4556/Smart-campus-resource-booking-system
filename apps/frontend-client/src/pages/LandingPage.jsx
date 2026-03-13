import { useState, useEffect } from "react";

const NAV_LINKS = ["Features", "How It Works"];

const FEATURES = [
  { icon: "🔬", title: "Lab Booking",        desc: "Reserve chemistry, physics, and computer labs with live availability." },
  { icon: "📚", title: "Library Rooms",       desc: "Book private study rooms and group collaboration spaces." },
  { icon: "🏟️", title: "Sports Facilities",   desc: "Schedule courts, fields, and gym slots for any group size." },
  { icon: "🎭", title: "Auditorium & Halls",  desc: "Reserve seminar halls and conference rooms for events." },
  { icon: "💻", title: "Equipment Rental",    desc: "Request projectors, cameras, and campus gear in advance." },
  { icon: "📅", title: "Conflict Detection",  desc: "Automatic clash checking stops double-bookings instantly." },
];

const STEPS = [
  { num: "01", title: "Create Account",    desc: "Register with your campus email as a student or faculty member." },
  { num: "02", title: "Browse Resources",  desc: "Explore every facility with its live availability calendar." },
  { num: "03", title: "Pick a Slot",       desc: "Choose your date and time, confirm your booking in one click." },
  { num: "04", title: "Get Confirmation",  desc: "Receive an email confirmation and reminder before your session." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #f2f4f8;
          --bg2:      #e8ecf4;
          --surface:  #ffffff;
          --border:   #cdd4e4;
          --ink:      #0a0f1e;
          --ink2:     #1a2340;
          --muted:    #5c6b8a;
          --navy:     #0f1f5c;
          --navy-dk:  #0a1540;
          --navy-lt:  #e8ecf8;
          --navy-xs:  #f0f3fc;
          --font-s:   'DM Serif Display', Georgia, serif;
          --font-b:   'DM Sans', sans-serif;
        }

        body { background: var(--bg); color: var(--ink); font-family: var(--font-b); overflow-x: hidden; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: var(--navy); }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 60px; transition: all 0.4s ease;
        }
        .nav.scrolled {
          background: rgba(242,244,248,0.96); backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border); padding: 14px 60px;
          box-shadow: 0 2px 16px rgba(10,15,30,0.07);
        }
        .logo { display: flex; align-items: center; gap: 12px; cursor: default; }
        .logo-icon {
          width: 36px; height: 36px; background: var(--navy);
          display: grid; place-items: center; font-size: 16px;
          transform: rotate(-3deg); transition: transform 0.3s; border-radius: 2px;
        }
        .logo:hover .logo-icon { transform: rotate(3deg); }
        .logo-text { font-family: var(--font-s); font-size: 20px; color: var(--ink); line-height: 1; }
        .logo-text span { color: var(--navy); font-style: italic; }
        .nav-links { display: flex; gap: 32px; list-style: none; }
        .nav-links a { font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .nav-links a:hover { color: var(--ink); }
        .nav-actions { display: flex; gap: 10px; }
        .btn-nav-ghost {
          font-family: var(--font-b); font-size: 13px; font-weight: 600;
          color: var(--navy); background: transparent; border: 1.5px solid var(--navy);
          padding: 9px 20px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .btn-nav-ghost:hover { background: var(--navy-lt); }
        .btn-nav-solid {
          font-family: var(--font-b); font-size: 13px; font-weight: 600;
          color: #fff; background: var(--navy); border: none;
          padding: 10px 22px; cursor: pointer; border-radius: 2px; transition: all 0.2s;
        }
        .btn-nav-solid:hover { background: var(--navy-dk); transform: translateY(-1px); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          position: relative; overflow: hidden;
          background: var(--surface);
          padding: 140px 40px 100px;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px; opacity: 0.45;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .hero::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 50% 40%, rgba(15,31,92,0.05) 0%, transparent 70%);
        }
        .hero-content {
          position: relative; z-index: 1;
          max-width: 760px;
          display: flex; flex-direction: column; align-items: center;
        }
        .hero-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--navy); margin-bottom: 28px;
          display: flex; align-items: center; gap: 12px;
        }
        .hero-eyebrow::before,
        .hero-eyebrow::after { content: ''; display: block; width: 24px; height: 1px; background: var(--navy); }

        .hero-title {
          font-family: var(--font-s);
          font-size: clamp(52px, 7vw, 96px);
          line-height: 0.97; color: var(--ink);
          margin-bottom: 28px;
        }
        .hero-title em { color: var(--navy); font-style: italic; }

        .hero-body {
          font-size: 17px; line-height: 1.8; color: var(--muted);
          max-width: 520px; margin-bottom: 48px;
        }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

        .btn-navy {
          font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
          color: #fff; background: var(--navy); border: none;
          padding: 15px 36px; cursor: pointer; border-radius: 2px;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .btn-navy::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .btn-navy:hover::after { transform: translateX(100%); }
        .btn-navy:hover { background: var(--navy-dk); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,31,92,0.32); }

        .btn-outline-ink {
          font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
          color: var(--ink2); background: transparent; border: 1.5px solid var(--border);
          padding: 15px 36px; cursor: pointer; border-radius: 2px; transition: all 0.25s;
        }
        .btn-outline-ink:hover { border-color: var(--navy); color: var(--navy); background: var(--navy-lt); }

        /* ── DIVIDER ── */
        .divider { border: none; border-top: 1px solid var(--border); margin: 0 60px; }

        /* ── FEATURES ── */
        .features-section { padding: 100px 60px; background: var(--bg); }
        .section-header { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: end; margin-bottom: 64px; }
        .label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--navy); margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
        }
        .label::after { content: ''; width: 24px; height: 1px; background: var(--navy); }
        .sec-title { font-family: var(--font-s); font-size: clamp(36px, 4vw, 52px); line-height: 1.08; letter-spacing: -0.01em; color: var(--ink); }
        .sec-desc { font-size: 15px; color: var(--muted); line-height: 1.8; max-width: 400px; align-self: end; }

        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
        }
        .feat-card {
          background: var(--surface); padding: 40px 36px;
          position: relative; overflow: hidden; cursor: default; transition: background 0.25s;
        }
        .feat-card:hover { background: var(--navy-xs); }
        .feat-card-line {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--navy); transform: scaleY(0); transform-origin: top; transition: transform 0.35s ease;
        }
        .feat-card:hover .feat-card-line { transform: scaleY(1); }
        .feat-num { font-family: var(--font-s); font-size: 13px; color: var(--border); margin-bottom: 20px; display: block; font-style: italic; }
        .feat-icon { font-size: 30px; margin-bottom: 16px; display: block; }
        .feat-title { font-family: var(--font-s); font-size: 20px; margin-bottom: 10px; color: var(--ink); }
        .feat-desc  { font-size: 14px; line-height: 1.75; color: var(--muted); }

        /* ── HOW IT WORKS ── */
        .steps-section { padding: 100px 60px; background: var(--bg2); }
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 64px; position: relative; }
        .steps-grid::before {
          content: ''; position: absolute;
          top: 28px; left: calc(12.5% + 28px); right: calc(12.5% + 28px);
          height: 1px; background: var(--border);
        }
        .step-card { padding: 0 32px 0 0; position: relative; z-index: 1; }
        .step-circle {
          width: 56px; height: 56px; border: 1.5px solid var(--border); border-radius: 50%;
          display: grid; place-items: center; margin-bottom: 28px; background: var(--surface);
          box-shadow: 0 2px 8px rgba(10,15,30,0.06);
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .step-card:hover .step-circle { border-color: var(--navy); background: var(--navy-lt); box-shadow: 0 4px 20px rgba(15,31,92,0.15); }
        .step-n { font-family: var(--font-s); font-size: 15px; color: var(--navy); font-style: italic; }
        .step-title { font-family: var(--font-s); font-size: 20px; color: var(--ink); margin-bottom: 12px; }
        .step-desc  { font-size: 14px; line-height: 1.75; color: var(--muted); }

        /* ── CTA ── */
        .cta-section {
          padding: 120px 60px; background: var(--surface);
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between;
          gap: 60px; flex-wrap: wrap; border-top: 1px solid var(--border);
        }
        .cta-section::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
          background-size: 28px 28px; opacity: 0.45;
        }
        .cta-left { position: relative; z-index: 1; max-width: 560px; }
        .cta-title { font-family: var(--font-s); font-size: clamp(36px, 4.5vw, 60px); line-height: 1.05; margin-bottom: 20px; color: var(--ink); }
        .cta-title em { color: var(--navy); font-style: italic; }
        .cta-body { font-size: 16px; color: var(--muted); line-height: 1.8; }
        .cta-right { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; flex-shrink: 0; }
        .btn-big-navy {
          font-size: 14px; font-weight: 600; letter-spacing: 0.05em;
          color: #fff; background: var(--navy); border: none;
          padding: 18px 56px; cursor: pointer; border-radius: 2px; transition: all 0.25s; text-align: center;
        }
        .btn-big-navy:hover { background: var(--navy-dk); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(15,31,92,0.28); }
        .btn-big-outline {
          font-size: 14px; font-weight: 600; letter-spacing: 0.05em;
          color: var(--ink2); background: transparent; border: 1.5px solid var(--border);
          padding: 18px 56px; cursor: pointer; border-radius: 2px; transition: all 0.25s; text-align: center;
        }
        .btn-big-outline:hover { border-color: var(--navy); color: var(--navy); background: var(--navy-lt); }

        /* ── FOOTER ── */
        footer { background: var(--navy); padding: 36px 60px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .foot-logo { font-family: var(--font-s); font-size: 18px; color: #fff; }
        .foot-logo span { color: #a5b4fc; font-style: italic; }
        .foot-links { display: flex; gap: 28px; list-style: none; }
        .foot-links a { font-size: 12px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; letter-spacing: 0.06em; }
        .foot-links a:hover { color: #fff; }
        .foot-copy { font-size: 11px; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; }

        /* ── ANIMATIONS ── */
        @keyframes heroIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .h1 { animation: heroIn 0.8s 0.08s ease both; }
        .h2 { animation: heroIn 0.8s 0.22s ease both; }
        .h3 { animation: heroIn 0.8s 0.38s ease both; }
        .h4 { animation: heroIn 0.8s 0.52s ease both; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .nav, .nav.scrolled { padding-left: 24px; padding-right: 24px; }
          .nav-links { display: none; }
          .features-section, .steps-section, .cta-section, footer { padding-left: 24px; padding-right: 24px; }
          .features-grid { grid-template-columns: repeat(2,1fr); }
          .steps-grid { grid-template-columns: repeat(2,1fr); gap: 48px; }
          .steps-grid::before { display: none; }
          .section-header { grid-template-columns: 1fr; }
          .divider { margin: 0 24px; }
          .cta-inner { flex-direction: column; }
        }
        @media (max-width: 640px) {
          .hero { padding: 120px 24px 80px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
          .cta-section { flex-direction: column; }
          .btn-big-navy, .btn-big-outline { width: 100%; }
          .nav-actions .btn-nav-ghost { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="logo">
          <div className="logo-icon">🏛</div>
          <div className="logo-text">Smart<span>Campus</span></div>
        </div>
        <ul className="nav-links">
          {NAV_LINKS.map(l => <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g,"-")}`}>{l}</a></li>)}
        </ul>
        <div className="nav-actions">
          <button className="btn-nav-ghost" onClick={() => window.location.href = "/login"}>Log In</button>
          <button className="btn-nav-solid" onClick={() => window.location.href = "/signup"}>Sign Up</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow h1">Campus Resource Booking</p>
          <h1 className="hero-title h2">
            Every space.<br />
            One <em>simple</em><br />
            booking.
          </h1>
          <p className="hero-body h3">
            Reserve labs, study rooms, courts, halls, and equipment — all from one place. No emails back and forth, no manual sign-up sheets.
          </p>
          <div className="hero-ctas h4">
            <button className="btn-navy"        onClick={() => window.location.href = "/signup"}>Get Started Free</button>
            <button className="btn-outline-ink" onClick={() => window.location.href = "/login"}>Log In →</button>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* FEATURES */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div>
            <div className="label">Capabilities</div>
            <h2 className="sec-title">What you<br />can book.</h2>
          </div>
          <p className="sec-desc">
            SmartCampus brings every bookable resource on your campus into one clean, conflict-free system.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              className="feat-card" key={f.title}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="feat-card-line" />
              <span className="feat-num">0{i + 1}</span>
              <span className="feat-icon">{f.icon}</span>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="steps-section">
        <div className="section-header">
          <div>
            <div className="label">Process</div>
            <h2 className="sec-title">Four steps.<br />Done.</h2>
          </div>
          <p className="sec-desc">
            Simple enough to use without a tutorial. Powerful enough to handle every room on campus.
          </p>
        </div>
        <div className="steps-grid">
          {STEPS.map(s => (
            <div className="step-card" key={s.num}>
              <div className="step-circle"><span className="step-n">{s.num}</span></div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-left">
          <div className="label">Get Access</div>
          <h2 className="cta-title">
            Your campus.<br />Your <em>schedule.</em>
          </h2>
          <p className="cta-body">
            Sign up with your campus email and start booking resources right away. No paperwork, no waiting, no confusion.
          </p>
        </div>
        <div className="cta-right">
          <button className="btn-big-navy"    onClick={() => window.location.href = "/signup"}>Create Account</button>
          <button className="btn-big-outline" onClick={() => window.location.href = "/login"}>Log In</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-logo">Smart<span>Campus</span></div>
        <ul className="foot-links">
          {["Privacy", "Terms", "Support", "Contact"].map(l => (
            <li key={l}><a href="#">{l}</a></li>
          ))}
        </ul>
        <div className="foot-copy">© 2025 SmartCampus</div>
      </footer>
    </>
  );
}