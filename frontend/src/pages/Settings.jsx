import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "https://phishing-email-backend-7a45.onrender.com";

const Settings = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [engines, setEngines] = useState(null);
  const [loadingEngines, setLoadingEngines] = useState(true);

  // Engine toggles — display only (backend always runs all active engines)
  const [toggles, setToggles] = useState({
    groq:    true,
    ml:      true,
    rules:   true,
    url:     true,
    bert:    false, // permanently disabled
    gemini:  false, // pending
  });

  // Cache settings — display only
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [ttlHours, setTtlHours]         = useState(24);

  useEffect(() => {
    fetchEngineStatus();
  }, []);

  const fetchEngineStatus = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/engines/status`);
      const data = await res.json();
      setEngines(data);
    } catch {
      // silently fail
    } finally {
      setLoadingEngines(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const engineList = [
    {
      key: "groq",
      name: "Groq AI",
      desc: "LLaMA-3 via Groq API — fastest, highest weight (35%)",
      weight: "35%",
      status: "ACTIVE",
      statusColor: "#2dc56a",
      canToggle: true,
    },
    {
      key: "ml",
      name: "ML Model",
      desc: "TF-IDF + LinearSVC trained on phishing corpus (20%)",
      weight: "20%",
      status: "ACTIVE",
      statusColor: "#2dc56a",
      canToggle: true,
    },
    {
      key: "rules",
      name: "Rule Engine",
      desc: "Pattern-based regex rules for known phishing signals (12%)",
      weight: "12%",
      status: "ACTIVE",
      statusColor: "#2dc56a",
      canToggle: true,
    },
    {
      key: "url",
      name: "URL Scanner",
      desc: "Extracts and evaluates URLs for suspicious domains (8%)",
      weight: "8%",
      status: "ACTIVE",
      statusColor: "#2dc56a",
      canToggle: true,
    },
    {
      key: "bert",
      name: "BERT",
      desc: "Transformer model — disabled (too heavy for 512MB free tier)",
      weight: "25%",
      status: "DISABLED",
      statusColor: "#ff4d6d",
      canToggle: false,
    },
    {
      key: "gemini",
      name: "Gemini AI",
      desc: "Google Gemini engine — API key set, integration pending",
      weight: "—",
      status: "PENDING",
      statusColor: "#f5a623",
      canToggle: false,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        .st-root {
          min-height: 100vh;
          background: #080c10;
          font-family: 'Rajdhani', sans-serif;
          color: #e0f0ff;
        }

        /* ── HEADER ── */
        .st-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .st-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .st-brand em { font-style: normal; color: #ff4d6d; }
        .st-brand-shield {
          width: 32px; height: 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.45);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .st-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .st-status {
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
          animation: st-pulse 2s ease-in-out infinite;
        }
        @keyframes st-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .st-signout {
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
        .st-signout:hover {
          background: rgba(255,77,109,0.08);
          border-color: rgba(255,77,109,0.6);
        }

        /* ── NAV ── */
        .st-nav {
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
        .st-body {
          max-width: 900px;
          margin: 0 auto;
          padding: 28px 24px;
        }
        .st-page-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a8a9a;
          letter-spacing: 0.14em;
          margin-bottom: 20px;
        }

        /* ── PANELS ── */
        .panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.1);
          border-radius: 6px;
          padding: 18px;
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
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

        /* ── ACCOUNT INFO ── */
        .account-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,245,255,0.04);
        }
        .account-row:last-child { border-bottom: none; }
        .account-key {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a6a80;
          letter-spacing: 1px;
        }
        .account-val {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #7abbd0;
        }

        /* ── ENGINE TOGGLE ROWS ── */
        .engine-toggle-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0,245,255,0.04);
        }
        .engine-toggle-row:last-child { border-bottom: none; }
        .engine-info { flex: 1; }
        .engine-name {
          font-size: 14px;
          font-weight: 600;
          color: #c0e8f8;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }
        .engine-desc {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a5a6a;
          letter-spacing: 0.5px;
          line-height: 1.5;
        }
        .engine-weight-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 3px;
          background: rgba(0,245,255,0.06);
          color: #3a8a9a;
          border: 1px solid rgba(0,245,255,0.12);
          flex-shrink: 0;
        }
        .engine-status-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          padding: 3px 8px;
          border-radius: 3px;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: 0.5px;
        }
        .engine-status-badge.active {
          background: rgba(45,197,106,0.12);
          color: #2dc56a;
          border: 1px solid rgba(45,197,106,0.25);
        }
        .engine-status-badge.disabled {
          background: rgba(255,77,109,0.08);
          color: #ff4d6d;
          border: 1px solid rgba(255,77,109,0.2);
        }
        .engine-status-badge.pending {
          background: rgba(245,166,35,0.08);
          color: #f5a623;
          border: 1px solid rgba(245,166,35,0.2);
        }

        /* ── TOGGLE SWITCH ── */
        .toggle-wrap {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .toggle-input { display: none; }
        .toggle-track {
          width: 36px;
          height: 20px;
          background: #0d1e2c;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .toggle-track.on {
          background: rgba(0,245,255,0.15);
          border-color: rgba(0,245,255,0.4);
        }
        .toggle-track.disabled-track {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .toggle-thumb {
          width: 14px;
          height: 14px;
          background: #1a4a5a;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s, background 0.2s;
        }
        .toggle-track.on .toggle-thumb {
          background: #00f5ff;
          transform: translateX(16px);
        }

        /* ── CACHE SETTINGS ── */
        .cache-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0,245,255,0.04);
        }
        .cache-row:last-child { border-bottom: none; }
        .cache-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #5a9ab0;
          letter-spacing: 1px;
        }
        .cache-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a4a5a;
          margin-top: 3px;
        }
        .ttl-select {
          background: #030810;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 4px;
          color: #7abbd0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          padding: 5px 10px;
          cursor: pointer;
          outline: none;
        }

        /* ── SYSTEM STATUS ── */
        .sys-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,245,255,0.04);
        }
        .sys-row:last-child { border-bottom: none; }
        .sys-key {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a6a80;
          letter-spacing: 1px;
        }
        .sys-val {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
        }
        .sys-dot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          margin-right: 6px;
        }

        /* ── SIGN OUT SECTION ── */
        .signout-panel {
          background: #0a1520;
          border: 1px solid rgba(255,77,109,0.12);
          border-radius: 6px;
          padding: 18px;
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .signout-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,77,109,0.3), transparent);
        }
        .signout-text {}
        .signout-title {
          font-size: 14px;
          font-weight: 600;
          color: #c0e8f8;
          margin-bottom: 4px;
        }
        .signout-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a4a5a;
          letter-spacing: 0.5px;
        }
        .signout-btn {
          background: rgba(255,77,109,0.1);
          border: 1px solid rgba(255,77,109,0.35);
          border-radius: 4px;
          color: #ff4d6d;
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 9px 20px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .signout-btn:hover {
          background: rgba(255,77,109,0.18);
          border-color: rgba(255,77,109,0.6);
        }

        /* ── LOADING ── */
        .mini-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(0,245,255,0.15);
          border-top-color: #00f5ff;
          border-radius: 50%;
          animation: st-spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes st-spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .engine-toggle-row { flex-wrap: wrap; }
          .signout-panel { flex-direction: column; gap: 14px; align-items: flex-start; }
        }
      `}</style>

      <div className="st-root">

        {/* ── HEADER ── */}
        <div className="st-header">
          <div className="st-brand">
            <div className="st-brand-shield">🛡</div>
            PhishMe<em>Not</em> AI
          </div>
          <div className="st-header-right">
            <div className="st-status">
              <div className="status-dot" />
              4 ENGINES ACTIVE
            </div>
            <button className="st-signout" onClick={handleSignOut}>SIGN OUT</button>
          </div>
        </div>

        {/* ── NAV ── */}
        <div className="st-nav">
          <a href="/dashboard" className="nav-item">DASHBOARD</a>
          <a href="/scan"      className="nav-item">SCAN</a>
          <a href="/history"   className="nav-item">HISTORY</a>
          <a href="/reports"   className="nav-item">REPORTS</a>
          <span className="nav-item active">SETTINGS</span>
        </div>

        {/* ── BODY ── */}
        <div className="st-body">
          <div className="st-page-title">// SYSTEM CONFIGURATION &amp; ACCOUNT</div>

          {/* ── ACCOUNT INFO ── */}
          <div className="panel">
            <div className="panel-title">ACCOUNT INFO</div>
            <div className="account-row">
              <span className="account-key">EMAIL</span>
              <span className="account-val">{user?.email || "—"}</span>
            </div>
            <div className="account-row">
              <span className="account-key">USER ID</span>
              <span className="account-val">{user?.uid ? user.uid.slice(0, 16) + "…" : "—"}</span>
            </div>
            <div className="account-row">
              <span className="account-key">PROVIDER</span>
              <span className="account-val">
                {user?.providerData?.[0]?.providerId === "google.com" ? "Google OAuth" : "Email / Password"}
              </span>
            </div>
            <div className="account-row">
              <span className="account-key">ACCOUNT CREATED</span>
              <span className="account-val">
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })
                  : "—"}
              </span>
            </div>
            <div className="account-row">
              <span className="account-key">LAST SIGN IN</span>
              <span className="account-val">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })
                  : "—"}
              </span>
            </div>
          </div>

          {/* ── ENGINE TOGGLES ── */}
          <div className="panel">
            <div className="panel-title">ENGINE CONFIGURATION</div>
            {engineList.map((e) => (
              <div className="engine-toggle-row" key={e.key}>
                <div className="engine-info">
                  <div className="engine-name">{e.name}</div>
                  <div className="engine-desc">{e.desc}</div>
                </div>
                <span className="engine-weight-badge">{e.weight}</span>
                <span className={`engine-status-badge ${
                  e.status === "ACTIVE"   ? "active"   :
                  e.status === "DISABLED" ? "disabled" : "pending"
                }`}>{e.status}</span>
                <div className="toggle-wrap">
                  <div
                    className={`toggle-track ${toggles[e.key] ? "on" : ""} ${!e.canToggle ? "disabled-track" : ""}`}
                    onClick={() => {
                      if (!e.canToggle) return;
                      setToggles((prev) => ({ ...prev, [e.key]: !prev[e.key] }));
                    }}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── CACHE SETTINGS ── */}
          <div className="panel">
            <div className="panel-title">CACHE SETTINGS</div>
            <div className="cache-row">
              <div>
                <div className="cache-label">REDIS CACHE</div>
                <div className="cache-sub">Upstash Redis · MD5 hash key · avoids re-scanning identical emails</div>
              </div>
              <div
                className={`toggle-track ${cacheEnabled ? "on" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => setCacheEnabled((v) => !v)}
              >
                <div className="toggle-thumb" />
              </div>
            </div>
            <div className="cache-row">
              <div>
                <div className="cache-label">CACHE TTL</div>
                <div className="cache-sub">How long a cached result stays valid before re-scanning</div>
              </div>
              <select
                className="ttl-select"
                value={ttlHours}
                onChange={(e) => setTtlHours(Number(e.target.value))}
              >
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
              </select>
            </div>
            <div className="cache-row">
              <div>
                <div className="cache-label">CACHE KEY</div>
                <div className="cache-sub">MD5 hash of email body — identical emails share a cache entry</div>
              </div>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#3a7a9a" }}>
                MD5
              </span>
            </div>
          </div>

          {/* ── SYSTEM STATUS ── */}
          <div className="panel">
            <div className="panel-title">SYSTEM STATUS</div>
            <div className="sys-row">
              <span className="sys-key">BACKEND</span>
              <span className="sys-val">
                {loadingEngines ? (
                  <span className="mini-spinner" />
                ) : engines ? (
                  <span style={{ color: "#2dc56a" }}>
                    <span className="sys-dot" style={{ background: "#2dc56a" }} />
                    ONLINE — Render Free Tier
                  </span>
                ) : (
                  <span style={{ color: "#f5a623" }}>
                    <span className="sys-dot" style={{ background: "#f5a623" }} />
                    COLD START — may take 50s
                  </span>
                )}
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">FRONTEND</span>
              <span className="sys-val" style={{ color: "#2dc56a" }}>
                <span className="sys-dot" style={{ background: "#2dc56a" }} />
                LIVE — Vercel
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">DATABASE</span>
              <span className="sys-val" style={{ color: "#2dc56a" }}>
                <span className="sys-dot" style={{ background: "#2dc56a" }} />
                Firebase Firestore
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">CACHE</span>
              <span className="sys-val" style={{ color: "#2dc56a" }}>
                <span className="sys-dot" style={{ background: "#2dc56a" }} />
                Upstash Redis · 24hr TTL
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">BERT ENGINE</span>
              <span className="sys-val" style={{ color: "#ff4d6d" }}>
                <span className="sys-dot" style={{ background: "#ff4d6d" }} />
                DISABLED — 512MB limit exceeded
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">GEMINI ENGINE</span>
              <span className="sys-val" style={{ color: "#f5a623" }}>
                <span className="sys-dot" style={{ background: "#f5a623" }} />
                PENDING — API key configured
              </span>
            </div>
            <div className="sys-row">
              <span className="sys-key">ML MODEL</span>
              <span className="sys-val" style={{ color: "#2dc56a" }}>
                <span className="sys-dot" style={{ background: "#2dc56a" }} />
                sklearn 1.5.2 · TF-IDF + LinearSVC
              </span>
            </div>
          </div>

          {/* ── SIGN OUT ── */}
          <div className="signout-panel">
            <div className="signout-text">
              <div className="signout-title">Sign out of PhishMeNot AI</div>
              <div className="signout-sub">
                You will be redirected to the login screen. Your scan history is saved.
              </div>
            </div>
            <button className="signout-btn" onClick={handleSignOut}>
              SIGN OUT
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Settings;