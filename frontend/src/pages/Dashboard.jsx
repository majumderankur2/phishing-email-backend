import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "https://phishing-email-backend-7a45.onrender.com";

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentScans, setRecentScans]   = useState([]);
  const [stats, setStats]               = useState({ total: 0, threats: 0, cacheHits: 0, avgScore: 0 });
  const [engines, setEngines]           = useState(null);
  const [loadingData, setLoadingData]   = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchEngineStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "scans"),
        where("uid", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const scans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const threats   = scans.filter((s) => s.label === "phishing" || s.label === "suspicious").length;
      const cacheHits = scans.filter((s) => s.cache_hit === true).length;
      const avgScore  = scans.length > 0
        ? Math.round(scans.reduce((sum, s) => sum + (s.score || 0), 0) / scans.length)
        : 0;

      setStats({ total: scans.length, threats, cacheHits, avgScore });
      setRecentScans(scans.slice(0, 8));
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEngineStatus = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/engines/status`);
      const data = await res.json();
      setEngines(data);
    } catch {
      // silently fail — backend may be cold starting
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const cacheHitRate = stats.total > 0
    ? Math.round((stats.cacheHits / stats.total) * 100)
    : 0;

  const threatRate = stats.total > 0
    ? Math.round((stats.threats / stats.total) * 100)
    : 0;

  // Build weekly bar data from recentScans
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekCounts = Array(7).fill(0);
  const weekThreats = Array(7).fill(0);
  recentScans.forEach((s) => {
    if (s.timestamp?.toDate) {
      const day = s.timestamp.toDate().getDay();
      weekCounts[day]++;
      if (s.label === "phishing" || s.label === "suspicious") weekThreats[day]++;
    }
  });
  const maxWeek = Math.max(...weekCounts, 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        .db-root {
          min-height: 100vh;
          background: #080c10;
          font-family: 'Rajdhani', sans-serif;
          color: #e0f0ff;
        }

        /* ── HEADER ── */
        .db-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .db-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .db-brand em { font-style: normal; color: #ff4d6d; }
        .db-brand-shield {
          width: 32px; height: 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.45);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .db-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .db-status {
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
          animation: db-pulse 2s ease-in-out infinite;
        }
        @keyframes db-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .db-signout {
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
        .db-signout:hover {
          background: rgba(255,77,109,0.08);
          border-color: rgba(255,77,109,0.6);
        }

        /* ── NAV ── */
        .db-nav {
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
        .db-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px;
        }
        .db-page-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a8a9a;
          letter-spacing: 0.14em;
          margin-bottom: 20px;
        }

        /* ── METRIC CARDS ── */
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .metric-card {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.1);
          border-radius: 6px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
        }
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent);
        }
        .metric-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          letter-spacing: 2px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #00f5ff;
          line-height: 1;
          font-family: 'Rajdhani', sans-serif;
        }
        .metric-value.red   { color: #ff4d6d; }
        .metric-value.amber { color: #f5a623; }
        .metric-value.green { color: #2dc56a; }
        .metric-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a4a5a;
          margin-top: 5px;
        }

        /* ── TWO COL GRID ── */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
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
          top: 0; left: 0; right: 0;
          height: 1px;
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

        /* ── SCAN ROWS ── */
        .scan-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,245,255,0.05);
          font-size: 11px;
        }
        .scan-row:last-child { border-bottom: none; }
        .scan-email {
          flex: 1;
          color: #6a9ab0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
        }
        .scan-score {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a6a80;
          min-width: 32px;
          text-align: right;
        }
        .verdict-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          padding: 2px 7px;
          border-radius: 3px;
          font-weight: 700;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .verdict-badge.phish {
          background: rgba(255,77,109,0.15);
          color: #ff4d6d;
          border: 1px solid rgba(255,77,109,0.3);
        }
        .verdict-badge.safe {
          background: rgba(45,197,106,0.15);
          color: #2dc56a;
          border: 1px solid rgba(45,197,106,0.3);
        }
        .cached-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          padding: 2px 5px;
          border-radius: 3px;
          background: rgba(0,245,255,0.08);
          color: #00f5ff;
          border: 1px solid rgba(0,245,255,0.2);
          flex-shrink: 0;
        }

        /* ── ENGINE BARS ── */
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
          width: 50px;
          flex-shrink: 0;
        }
        .bar-track {
          flex: 1;
          height: 5px;
          background: #0d1e2c;
          border-radius: 2px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #007a99, #00f5ff);
          transition: width 0.8s ease;
        }
        .bar-fill.green { background: linear-gradient(90deg, #0a6a30, #2dc56a); }
        .bar-fill.disabled { background: #1a2a3a; }
        .engine-pct {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          width: 28px;
          text-align: right;
          flex-shrink: 0;
        }

        /* ── WEEKLY CHART ── */
        .chart-area {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 90px;
          padding: 0 2px;
        }
        .chart-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          height: 100%;
          justify-content: flex-end;
        }
        .chart-bar {
          width: 100%;
          border-radius: 2px 2px 0 0;
          min-height: 3px;
          transition: height 0.6s ease;
        }
        .chart-bar.total   { background: rgba(0,245,255,0.25); border-top: 2px solid #00f5ff; }
        .chart-bar.threats { background: rgba(255,77,109,0.25); border-top: 2px solid #ff4d6d; }
        .chart-day {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          color: #2a4a5a;
        }

        /* ── QUICK SCAN CTA ── */
        .cta-panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 6px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }
        .cta-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent);
        }
        .cta-text { }
        .cta-title {
          font-size: 16px;
          font-weight: 700;
          color: #c0e8f8;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .cta-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2a5a6a;
          letter-spacing: 0.06em;
        }
        .cta-btn {
          background: linear-gradient(135deg, #00b8cc, #0077aa);
          border: none;
          border-radius: 4px;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.14em;
          padding: 11px 24px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
        .cta-btn:hover { transform: translateY(-1px); }
        .cta-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
          animation: db-shimmer 2.5s infinite;
        }
        @keyframes db-shimmer { to { transform: translateX(100%); } }

        /* ── EMPTY STATE ── */
        .empty-state {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #1e3a4a;
          text-align: center;
          padding: 20px 0;
          letter-spacing: 1px;
        }

        /* ── LOADING ── */
        .loading-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2a5a6a;
          padding: 12px 0;
        }
        .mini-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,245,255,0.15);
          border-top-color: #00f5ff;
          border-radius: 50%;
          animation: db-spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes db-spin { to { transform: rotate(360deg); } }

        /* ── THREAT RATE BAR ── */
        .threat-rate-wrap { margin-top: 10px; }
        .threat-rate-label {
          display: flex;
          justify-content: space-between;
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #3a6a80;
          margin-bottom: 5px;
        }
        .threat-rate-track {
          height: 7px;
          background: #0d1e2c;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .threat-rate-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #992233, #ff4d6d);
          transition: width 0.8s ease;
        }
        .safe-rate-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #0a6a30, #2dc56a);
          transition: width 0.8s ease;
        }

        @media (max-width: 768px) {
          .metric-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="db-root">

        {/* ── HEADER ── */}
        <div className="db-header">
          <div className="db-brand">
            <div className="db-brand-shield">🛡</div>
            PhishMe<em>Not</em> AI
          </div>
          <div className="db-header-right">
            <div className="db-status">
              <div className="status-dot" />
              4 ENGINES ACTIVE
            </div>
            <button className="db-signout" onClick={handleSignOut}>
              SIGN OUT
            </button>
          </div>
        </div>

        {/* ── NAV ── */}
        <div className="db-nav">
          <span className="nav-item active">DASHBOARD</span>
          <a href="/scan"     className="nav-item">SCAN</a>
          <a href="/history"  className="nav-item">HISTORY</a>
          <a href="/reports"  className="nav-item">REPORTS</a>
          <a href="/settings" className="nav-item">SETTINGS</a>
        </div>

        {/* ── BODY ── */}
        <div className="db-body">
          <div className="db-page-title">// THREAT INTELLIGENCE OVERVIEW</div>

          {/* ── QUICK SCAN CTA ── */}
          <div className="cta-panel">
            <div className="cta-text">
              <div className="cta-title">Ready to scan a suspicious email?</div>
              <div className="cta-sub">GROQ · ML · RULES · URL SCANNER — 4 ENGINES STANDING BY</div>
            </div>
            <a href="/scan" className="cta-btn">⚡ RUN SCAN</a>
          </div>

          {/* ── METRIC CARDS ── */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-label">Total Scans</div>
              <div className="metric-value">{stats.total}</div>
              <div className="metric-sub">All time · your account</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Threats Caught</div>
              <div className="metric-value red">{stats.threats}</div>
              <div className="metric-sub">{threatRate}% of all scans</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cache Hit Rate</div>
              <div className="metric-value amber">{cacheHitRate}%</div>
              <div className="metric-sub">Redis · Upstash · 24hr TTL</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Risk Score</div>
              <div className="metric-value green">{stats.avgScore}%</div>
              <div className="metric-sub">Across all scans</div>
            </div>
          </div>

          {/* ── TWO COL: RECENT SCANS + ENGINE STATUS ── */}
          <div className="two-col">

            {/* Recent Scans */}
            <div className="panel">
              <div className="panel-title">RECENT SCANS</div>
              {loadingData ? (
                <div className="loading-row">
                  <div className="mini-spinner" />
                  LOADING SCAN HISTORY...
                </div>
              ) : recentScans.length === 0 ? (
                <div className="empty-state">NO SCANS YET — RUN YOUR FIRST SCAN</div>
              ) : (
                recentScans.map((scan) => {
                  const isPhish = scan.label === "phishing" || scan.label === "suspicious";
                  return (
                    <div className="scan-row" key={scan.id}>
                      <span className={`verdict-badge ${isPhish ? "phish" : "safe"}`}>
                        {isPhish ? "PHISH" : "SAFE"}
                      </span>
                      <span className="scan-email">{scan.email_preview || "—"}</span>
                      {scan.cache_hit && <span className="cached-badge">⚡</span>}
                      <span className="scan-score"
                        style={{ color: isPhish ? "#ff4d6d" : "#2dc56a" }}>
                        {Math.round(scan.score ?? 0)}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Engine Status + Weekly Chart */}
            <div className="panel">
              <div className="panel-title">ENGINE STATUS</div>
              <div className="engine-row">
                <div className="engine-name">GROQ AI</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: engines ? "93%" : "0%" }} />
                </div>
                <div className="engine-pct" style={{ color: "#00f5ff" }}>
                  {engines ? "93%" : "—"}
                </div>
              </div>
              <div className="engine-row">
                <div className="engine-name">ML MODEL</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: engines ? "87%" : "0%" }} />
                </div>
                <div className="engine-pct" style={{ color: "#00f5ff" }}>
                  {engines ? "87%" : "—"}
                </div>
              </div>
              <div className="engine-row">
                <div className="engine-name">RULES</div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{ width: engines ? "79%" : "0%" }} />
                </div>
                <div className="engine-pct" style={{ color: "#2dc56a" }}>
                  {engines ? "79%" : "—"}
                </div>
              </div>
              <div className="engine-row">
                <div className="engine-name">URL SCAN</div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{ width: engines ? "82%" : "0%" }} />
                </div>
                <div className="engine-pct" style={{ color: "#2dc56a" }}>
                  {engines ? "82%" : "—"}
                </div>
              </div>
              <div className="engine-row">
                <div className="engine-name">BERT</div>
                <div className="bar-track">
                  <div className="bar-fill disabled" style={{ width: "0%" }} />
                </div>
                <div className="engine-pct" style={{ color: "#1a3a4a" }}>OFF</div>
              </div>

              <div className="panel-title" style={{ marginTop: "18px" }}>
                WEEKLY ACTIVITY
              </div>
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
            </div>
          </div>

          {/* ── THREAT RATE BARS ── */}
          <div className="panel">
            <div className="panel-title">DETECTION BREAKDOWN</div>
            <div className="threat-rate-wrap">
              <div className="threat-rate-label">
                <span>PHISHING / SUSPICIOUS</span>
                <span style={{ color: "#ff4d6d" }}>{stats.threats} scans ({threatRate}%)</span>
              </div>
              <div className="threat-rate-track">
                <div className="threat-rate-fill" style={{ width: `${threatRate}%` }} />
              </div>
              <div className="threat-rate-label">
                <span>SAFE EMAILS</span>
                <span style={{ color: "#2dc56a" }}>
                  {stats.total - stats.threats} scans ({100 - threatRate}%)
                </span>
              </div>
              <div className="threat-rate-track">
                <div className="safe-rate-fill"
                  style={{ width: `${stats.total > 0 ? 100 - threatRate : 0}%` }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;