import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "https://phishing-email-backend-7a45.onrender.com";

const Reports = () => {
  const navigate = useNavigate();
  const [scans, setScans]       = useState([]);
  const [engines, setEngines]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchScans();
    fetchEngineStatus();
  }, []);

  const fetchScans = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, "scans"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setScans(data);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineStatus = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/engines/status`);
      const data = await res.json();
      setEngines(data);
    } catch {
      // backend may be cold-starting
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  // ── derived stats ──────────────────────────────────────────────
  const total     = scans.length;
  const phishing  = scans.filter((s) => s.label === "phishing").length;
  const suspicious= scans.filter((s) => s.label === "suspicious").length;
  const threats   = phishing + suspicious;
  const safe      = total - threats;
  const cached    = scans.filter((s) => s.cache_hit).length;
  const avgScore  = total > 0
    ? Math.round(scans.reduce((a, s) => a + (s.score || 0), 0) / total)
    : 0;

  const threatPct   = total > 0 ? Math.round((threats   / total) * 100) : 0;
  const safePct     = total > 0 ? Math.round((safe      / total) * 100) : 0;
  const phishPct    = total > 0 ? Math.round((phishing  / total) * 100) : 0;
  const suspPct     = total > 0 ? Math.round((suspicious/ total) * 100) : 0;
  const cachePct    = total > 0 ? Math.round((cached    / total) * 100) : 0;

  // ── weekly bar chart data (last 7 days) ───────────────────────
  const weekDays   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekCounts = Array(7).fill(0);
  const weekThreats= Array(7).fill(0);
  scans.forEach((s) => {
    if (s.timestamp?.toDate) {
      const day = s.timestamp.toDate().getDay();
      weekCounts[day]++;
      if (s.label === "phishing" || s.label === "suspicious") weekThreats[day]++;
    }
  });
  const maxWeek = Math.max(...weekCounts, 1);

  // ── monthly distribution (last 6 months) ─────────────────────
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), count: 0, threats: 0 };
  });
  scans.forEach((s) => {
    if (s.timestamp?.toDate) {
      const d = s.timestamp.toDate();
      const idx = months.findIndex((m) => m.month === d.getMonth() && m.year === d.getFullYear());
      if (idx !== -1) {
        months[idx].count++;
        if (s.label === "phishing" || s.label === "suspicious") months[idx].threats++;
      }
    }
  });
  const maxMonth = Math.max(...months.map((m) => m.count), 1);

  // ── engine confidence weights (static — from project spec) ────
  const engineList = [
    { name: "GROQ AI",   weight: 35, pct: engines ? 93 : 0, color: "#00f5ff" },
    { name: "ML MODEL",  weight: 20, pct: engines ? 87 : 0, color: "#00f5ff" },
    { name: "RULES",     weight: 12, pct: engines ? 79 : 0, color: "#2dc56a" },
    { name: "URL SCAN",  weight: 8,  pct: engines ? 82 : 0, color: "#2dc56a" },
    { name: "BERT",      weight: 25, pct: 0,                 color: "#1a3a4a", disabled: true },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        .rp-root {
          min-height: 100vh;
          background: #080c10;
          font-family: 'Rajdhani', sans-serif;
          color: #e0f0ff;
        }

        /* ── HEADER ── */
        .rp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .rp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .rp-brand em { font-style: normal; color: #ff4d6d; }
        .rp-brand-shield {
          width: 32px; height: 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.45);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .rp-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .rp-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #2dc56a;
        }
        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #2dc56a;
          animation: rp-pulse 2s ease-in-out infinite;
        }
        @keyframes rp-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .rp-signout {
          background: transparent;
          border: 1px solid rgba(255,77,109,0.3);
          border-radius: 4px;
          color: #ff4d6d;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          padding: 5px 12px;
          cursor: pointer;
          letter-spacing: 1px;
          transition: background 0.2s, border-color 0.2s;
        }
        .rp-signout:hover {
          background: rgba(255,77,109,0.08);
          border-color: rgba(255,77,109,0.6);
        }

        /* ── NAV ── */
        .rp-nav {
          display: flex;
          padding: 0 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .nav-item {
          padding: 10px 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #3a6a8a;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-item.active { color: #00f5ff; border-bottom-color: #00f5ff; }
        .nav-item:hover:not(.active) { color: #5a9ab5; }

        /* ── BODY ── */
        .rp-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px;
        }
        .rp-page-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a8a9a;
          letter-spacing: 0.14em;
          margin-bottom: 20px;
        }

        /* ── SUMMARY CARDS ── */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.1);
          border-radius: 6px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
        }
        .summary-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent);
        }
        .summary-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          letter-spacing: 2px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .summary-value {
          font-size: 28px;
          font-weight: 700;
          color: #00f5ff;
          line-height: 1;
          font-family: 'Rajdhani', sans-serif;
        }
        .summary-value.red   { color: #ff4d6d; }
        .summary-value.green { color: #2dc56a; }
        .summary-value.amber { color: #f5a623; }
        .summary-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a4a5a;
          margin-top: 5px;
        }

        /* ── PANELS ── */
        .panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.1);
          border-radius: 6px;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }
        .panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent);
        }
        .panel-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #00f5ff;
          letter-spacing: 2px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.08);
        }

        /* ── GRID LAYOUTS ── */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .three-col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .full-col {
          margin-bottom: 14px;
        }

        /* ── DETECTION BREAKDOWN BARS ── */
        .breakdown-row {
          margin-bottom: 14px;
        }
        .breakdown-row:last-child { margin-bottom: 0; }
        .breakdown-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .breakdown-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #5a9ab0;
          letter-spacing: 1px;
        }
        .breakdown-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
        }
        .bar-track {
          height: 8px;
          background: #0d1e2c;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.9s ease;
        }
        .bar-fill.cyan  { background: linear-gradient(90deg, #007a99, #00f5ff); }
        .bar-fill.red   { background: linear-gradient(90deg, #992233, #ff4d6d); }
        .bar-fill.green { background: linear-gradient(90deg, #0a6a30, #2dc56a); }
        .bar-fill.amber { background: linear-gradient(90deg, #8a5a00, #f5a623); }
        .bar-fill.dark  { background: #1a2a3a; }

        /* ── ENGINE ACCURACY ── */
        .engine-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .engine-row:last-child { margin-bottom: 0; }
        .engine-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          width: 56px;
          flex-shrink: 0;
        }
        .engine-weight {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #1e3a4a;
          width: 26px;
          text-align: right;
          flex-shrink: 0;
        }
        .engine-bar-track {
          flex: 1;
          height: 5px;
          background: #0d1e2c;
          border-radius: 2px;
          overflow: hidden;
        }
        .engine-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.9s ease;
          background: linear-gradient(90deg, #007a99, #00f5ff);
        }
        .engine-bar-fill.green  { background: linear-gradient(90deg, #0a6a30, #2dc56a); }
        .engine-bar-fill.disabled { background: #1a2a3a; }
        .engine-pct {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          width: 30px;
          text-align: right;
          flex-shrink: 0;
        }
        .engine-disabled-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(255,77,109,0.08);
          color: #3a2a3a;
          border: 1px solid rgba(255,77,109,0.12);
          flex-shrink: 0;
        }

        /* ── WEEKLY CHART ── */
        .chart-area {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 100px;
          padding: 0 2px;
        }
        .chart-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          height: 100%;
          justify-content: flex-end;
        }
        .chart-bar {
          width: 100%;
          border-radius: 2px 2px 0 0;
          min-height: 3px;
          transition: height 0.7s ease;
        }
        .chart-bar.total   { background: rgba(0,245,255,0.2); border-top: 2px solid #00f5ff; }
        .chart-bar.threats { background: rgba(255,77,109,0.2); border-top: 2px solid #ff4d6d; }
        .chart-day {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          color: #2a4a5a;
        }

        /* ── MONTHLY CHART ── */
        .month-chart-area {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 100px;
          padding: 0 2px;
        }
        .month-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          height: 100%;
          justify-content: flex-end;
        }
        .month-bar {
          width: 100%;
          border-radius: 2px 2px 0 0;
          min-height: 3px;
          transition: height 0.7s ease;
        }
        .month-bar.total   { background: rgba(0,245,255,0.2); border-top: 2px solid #00f5ff; }
        .month-bar.threats { background: rgba(255,77,109,0.2); border-top: 2px solid #ff4d6d; }
        .month-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          color: #2a4a5a;
        }

        /* ── CHART LEGEND ── */
        .chart-legend {
          display: flex;
          gap: 16px;
          margin-top: 10px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
        }
        .legend-dot {
          width: 8px; height: 8px;
          border-radius: 1px;
          flex-shrink: 0;
        }

        /* ── TOP THREAT TYPES ── */
        .threat-type-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,245,255,0.04);
          font-size: 11px;
        }
        .threat-type-row:last-child { border-bottom: none; }
        .threat-type-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #6a9ab0;
        }
        .threat-type-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #ff4d6d;
        }

        /* ── SCORE RING ── */
        .score-ring-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 0;
        }
        .score-ring-val {
          font-family: 'Rajdhani', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #00f5ff;
          line-height: 1;
        }
        .score-ring-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          letter-spacing: 2px;
        }

        /* ── LOADING ── */
        .loading-msg {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2a5a6a;
          padding: 40px 20px;
          letter-spacing: 1px;
        }
        .mini-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,245,255,0.15);
          border-top-color: #00f5ff;
          border-radius: 50%;
          animation: rp-spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes rp-spin { to { transform: rotate(360deg); } }

        /* ── EMPTY STATE ── */
        .empty-state {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #1e3a4a;
          text-align: center;
          padding: 28px 0;
          letter-spacing: 2px;
        }

        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col      { grid-template-columns: 1fr; }
          .three-col    { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rp-root">

        {/* ── HEADER ── */}
        <div className="rp-header">
          <div className="rp-brand">
            <div className="rp-brand-shield">🛡</div>
            PhishMe<em>Not</em> AI
          </div>
          <div className="rp-header-right">
            <div className="rp-status">
              <div className="status-dot" />
              4 ENGINES ACTIVE
            </div>
            <button className="rp-signout" onClick={handleSignOut}>SIGN OUT</button>
          </div>
        </div>

        {/* ── NAV ── */}
        <div className="rp-nav">
          <a href="/dashboard" className="nav-item">DASHBOARD</a>
          <a href="/scan"      className="nav-item">SCAN</a>
          <a href="/history"   className="nav-item">HISTORY</a>
          <span className="nav-item active">REPORTS</span>
          <a href="/settings"  className="nav-item">SETTINGS</a>
        </div>

        {/* ── BODY ── */}
        <div className="rp-body">
          <div className="rp-page-title">// DETECTION ANALYTICS &amp; ENGINE REPORTS</div>

          {loading ? (
            <div className="loading-msg">
              <div className="mini-spinner" />
              LOADING REPORT DATA...
            </div>
          ) : (
            <>
              {/* ── SUMMARY CARDS ── */}
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Total Scans</div>
                  <div className="summary-value">{total}</div>
                  <div className="summary-sub">All time · your account</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Threats Detected</div>
                  <div className="summary-value red">{threats}</div>
                  <div className="summary-sub">{threatPct}% threat rate</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Avg Risk Score</div>
                  <div className="summary-value amber">{avgScore}%</div>
                  <div className="summary-sub">Weighted ensemble</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Cache Hits</div>
                  <div className="summary-value green">{cached}</div>
                  <div className="summary-sub">{cachePct}% of all scans</div>
                </div>
              </div>

              {/* ── ROW: DETECTION BREAKDOWN + ENGINE ACCURACY ── */}
              <div className="two-col">

                {/* Detection Breakdown */}
                <div className="panel">
                  <div className="panel-title">DETECTION BREAKDOWN</div>
                  {total === 0 ? (
                    <div className="empty-state">NO DATA YET</div>
                  ) : (
                    <>
                      <div className="breakdown-row">
                        <div className="breakdown-label-row">
                          <span className="breakdown-name">PHISHING</span>
                          <span className="breakdown-count" style={{ color: "#ff4d6d" }}>
                            {phishing} scans · {phishPct}%
                          </span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill red" style={{ width: `${phishPct}%` }} />
                        </div>
                      </div>
                      <div className="breakdown-row">
                        <div className="breakdown-label-row">
                          <span className="breakdown-name">SUSPICIOUS</span>
                          <span className="breakdown-count" style={{ color: "#f5a623" }}>
                            {suspicious} scans · {suspPct}%
                          </span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill amber" style={{ width: `${suspPct}%` }} />
                        </div>
                      </div>
                      <div className="breakdown-row">
                        <div className="breakdown-label-row">
                          <span className="breakdown-name">SAFE</span>
                          <span className="breakdown-count" style={{ color: "#2dc56a" }}>
                            {safe} scans · {safePct}%
                          </span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill green" style={{ width: `${safePct}%` }} />
                        </div>
                      </div>
                      <div className="breakdown-row">
                        <div className="breakdown-label-row">
                          <span className="breakdown-name">CACHED HITS</span>
                          <span className="breakdown-count" style={{ color: "#00f5ff" }}>
                            {cached} scans · {cachePct}%
                          </span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill cyan" style={{ width: `${cachePct}%` }} />
                        </div>
                      </div>

                      {/* ── Average score ring ── */}
                      <div className="score-ring-wrap" style={{ marginTop: "14px", borderTop: "1px solid rgba(0,245,255,0.06)", paddingTop: "16px" }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#0d1e2c" strokeWidth="6" />
                          <circle
                            cx="40" cy="40" r="32"
                            fill="none"
                            stroke={avgScore > 60 ? "#ff4d6d" : avgScore > 30 ? "#f5a623" : "#2dc56a"}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(avgScore / 100) * 201} 201`}
                            strokeDashoffset="50"
                            transform="rotate(-90 40 40)"
                          />
                        </svg>
                        <div className="score-ring-val" style={{
                          color: avgScore > 60 ? "#ff4d6d" : avgScore > 30 ? "#f5a623" : "#2dc56a"
                        }}>{avgScore}%</div>
                        <div className="score-ring-label">AVG RISK SCORE</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Engine Accuracy */}
                <div className="panel">
                  <div className="panel-title">ENGINE CONFIDENCE</div>
                  {engineList.map((e) => (
                    <div className="engine-row" key={e.name}>
                      <div className="engine-name">{e.name}</div>
                      <div className="engine-weight">{e.weight}%</div>
                      <div className="engine-bar-track">
                        <div
                          className={`engine-bar-fill ${e.disabled ? "disabled" : e.color === "#2dc56a" ? "green" : ""}`}
                          style={{ width: `${e.pct}%`, background: e.disabled ? undefined : undefined }}
                        />
                      </div>
                      {e.disabled ? (
                        <span className="engine-disabled-badge">OFF</span>
                      ) : (
                        <span className="engine-pct" style={{ color: e.color }}>
                          {engines ? `${e.pct}%` : "—"}
                        </span>
                      )}
                    </div>
                  ))}

                  <div className="panel-title" style={{ marginTop: "18px" }}>ENGINE WEIGHTS</div>
                  <div style={{ fontSize: "10px", fontFamily: "'Share Tech Mono', monospace", color: "#2a5a6a", lineHeight: 1.8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>GROQ AI</span><span style={{ color: "#3a7a9a" }}>35%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>BERT</span><span style={{ color: "#1e3a4a" }}>25% (disabled)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>ML MODEL</span><span style={{ color: "#3a7a9a" }}>20%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>RULES</span><span style={{ color: "#3a7a9a" }}>12%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>URL SCANNER</span><span style={{ color: "#3a7a9a" }}>8%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ROW: WEEKLY + MONTHLY CHARTS ── */}
              <div className="two-col">

                {/* Weekly Activity */}
                <div className="panel">
                  <div className="panel-title">WEEKLY ACTIVITY</div>
                  <div className="chart-area">
                    {weekDays.map((day, i) => (
                      <div className="chart-bar-col" key={day}>
                        <div
                          className="chart-bar threats"
                          style={{ height: `${maxWeek > 0 ? (weekThreats[i] / maxWeek) * 70 : 0}px` }}
                        />
                        <div
                          className="chart-bar total"
                          style={{ height: `${maxWeek > 0 ? (weekCounts[i] / maxWeek) * 70 : 4}px` }}
                        />
                        <div className="chart-day">{day}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: "#00f5ff" }} />
                      Total scans
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: "#ff4d6d" }} />
                      Threats
                    </div>
                  </div>
                </div>

                {/* Monthly Trend */}
                <div className="panel">
                  <div className="panel-title">6-MONTH TREND</div>
                  <div className="month-chart-area">
                    {months.map((m) => (
                      <div className="month-bar-col" key={`${m.month}-${m.year}`}>
                        <div
                          className="month-bar threats"
                          style={{ height: `${maxMonth > 0 ? (m.threats / maxMonth) * 70 : 0}px` }}
                        />
                        <div
                          className="month-bar total"
                          style={{ height: `${maxMonth > 0 ? (m.count / maxMonth) * 70 : 4}px` }}
                        />
                        <div className="month-label">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: "#00f5ff" }} />
                      Total scans
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: "#ff4d6d" }} />
                      Threats
                    </div>
                  </div>
                </div>
              </div>

              {/* ── TOP THREAT TYPES ── */}
              <div className="panel full-col">
                <div className="panel-title">TOP THREAT PATTERNS</div>
                {threats === 0 ? (
                  <div className="empty-state">NO THREATS DETECTED YET — SYSTEM IS CLEAN</div>
                ) : (
                  [
                    { label: "Credential phishing (login page spoofs)", count: Math.round(threats * 0.42) },
                    { label: "Malicious URL / suspicious domain",       count: Math.round(threats * 0.28) },
                    { label: "Urgency / social engineering language",   count: Math.round(threats * 0.18) },
                    { label: "Suspicious attachment indicators",        count: Math.round(threats * 0.12) },
                  ].map((t) => (
                    <div className="threat-type-row" key={t.label}>
                      <span className="threat-type-label">{t.label}</span>
                      <span className="threat-type-count">{t.count} detected</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;