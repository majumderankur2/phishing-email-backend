import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const BACKEND_URL = "https://phishing-email-backend-7a45.onrender.com";

const Scan = () => {
  const [emailText, setEmailText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!emailText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText }),
      });

      if (!response.ok) throw new Error("Scan failed. Try again.");
      const data = await response.json();
      setResult(data);

      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "scans"), {
          uid: user.uid,
          email_preview: emailText.slice(0, 80),
          score: data.score,
          label: data.label,
          cache_hit: data.cache_hit || false,
          timestamp: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setEmailText("");
    setResult(null);
    setError(null);
  };

  const isPhishing = result?.label === "phishing";
  const score = result?.score ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        .scan-root {
          min-height: 100vh;
          background: #080c10;
          font-family: 'Rajdhani', sans-serif;
          color: #e0f0ff;
          padding: 0;
        }

        /* ── HEADER ── */
        .scan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .scan-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .scan-brand em {
          font-style: normal;
          color: #ff4d6d;
        }
        .scan-brand-shield {
          width: 32px;
          height: 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.45);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .scan-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #2dc56a;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2dc56a;
          animation: pmn-pulse 2s ease-in-out infinite;
        }
        @keyframes pmn-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── NAV ── */
        .scan-nav {
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
        .nav-item.active {
          color: #00f5ff;
          border-bottom-color: #00f5ff;
        }
        .nav-item:hover:not(.active) { color: #5a9ab5; }

        /* ── BODY ── */
        .scan-body {
          max-width: 860px;
          margin: 0 auto;
          padding: 28px 24px;
        }

        .scan-page-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a8a9a;
          letter-spacing: 0.14em;
          margin-bottom: 16px;
        }

        /* ── INPUT PANEL ── */
        .input-panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.12);
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 16px;
          position: relative;
        }
        .input-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent);
        }

        .panel-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a8a9a;
          letter-spacing: 0.12em;
          margin-bottom: 10px;
        }

        .email-textarea {
          width: 100%;
          min-height: 200px;
          background: #030810;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 4px;
          color: #a0dff0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          padding: 14px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .email-textarea:focus {
          border-color: rgba(0,245,255,0.4);
          box-shadow: 0 0 0 2px rgba(0,245,255,0.06);
        }
        .email-textarea::placeholder { color: #1e4a5a; }

        .char-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2a5a6a;
          text-align: right;
          margin-top: 6px;
        }

        /* ── BUTTONS ── */
        .btn-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .btn-scan {
          flex: 1;
          background: linear-gradient(135deg, #00b8cc, #0077aa);
          border: none;
          border-radius: 4px;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.16em;
          padding: 13px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, opacity 0.2s;
        }
        .btn-scan:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-scan:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-scan::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
          animation: pmn-shimmer 2.5s infinite;
        }
        @keyframes pmn-shimmer { to { transform: translateX(100%); } }

        .btn-clear {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 4px;
          color: #4a8aaa;
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.1em;
          padding: 13px 22px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-clear:hover {
          border-color: rgba(0,245,255,0.35);
          color: #7ab8cc;
        }

        /* ── LOADING ── */
        .loading-panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.12);
          border-radius: 6px;
          padding: 32px;
          text-align: center;
        }
        .loading-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(0,245,255,0.15);
          border-top-color: #00f5ff;
          border-radius: 50%;
          animation: pmn-spin 0.8s linear infinite;
          margin: 0 auto 14px;
        }
        @keyframes pmn-spin { to { transform: rotate(360deg); } }
        .loading-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #3a8a9a;
          letter-spacing: 0.1em;
          animation: pmn-blink 1.2s ease-in-out infinite;
        }
        @keyframes pmn-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .loading-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #1e4a5a;
          margin-top: 6px;
          letter-spacing: 0.08em;
        }

        /* ── ERROR ── */
        .error-panel {
          background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.3);
          border-radius: 6px;
          padding: 16px 20px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #ff4d6d;
          letter-spacing: 0.06em;
        }

        /* ── RESULT PANEL ── */
        .result-panel {
          background: #0a1520;
          border-radius: 6px;
          overflow: hidden;
          animation: pmn-fadeUp 0.4s ease both;
        }
        @keyframes pmn-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(0,245,255,0.08);
        }
        .result-header.phishing {
          background: rgba(255,77,109,0.08);
          border-left: 3px solid #ff4d6d;
        }
        .result-header.safe {
          background: rgba(45,197,106,0.08);
          border-left: 3px solid #2dc56a;
        }

        .result-verdict {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .verdict-icon { font-size: 28px; line-height: 1; }
        .verdict-label {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .verdict-label.phishing { color: #ff4d6d; }
        .verdict-label.safe { color: #2dc56a; }
        .verdict-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #3a6a8a;
          margin-top: 2px;
          letter-spacing: 0.08em;
        }

        .result-badges {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 3px;
          letter-spacing: 0.07em;
        }
        .badge-phish {
          background: rgba(255,77,109,0.15);
          color: #ff4d6d;
          border: 1px solid rgba(255,77,109,0.35);
        }
        .badge-safe {
          background: rgba(45,197,106,0.15);
          color: #2dc56a;
          border: 1px solid rgba(45,197,106,0.35);
        }
        .badge-cache {
          background: rgba(0,245,255,0.1);
          color: #00f5ff;
          border: 1px solid rgba(0,245,255,0.3);
        }
        .badge-votes {
          background: rgba(0,245,255,0.06);
          color: #4a8aaa;
          border: 1px solid rgba(0,245,255,0.15);
        }

        /* ── SCORE RING ── */
        .score-ring-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 0 8px;
        }
        .score-ring {
          position: relative;
          width: 100px; height: 100px;
        }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring-label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .score-num {
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
        }
        .score-num.phishing { color: #ff4d6d; }
        .score-num.safe { color: #2dc56a; }
        .score-word {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a5a6a;
          letter-spacing: 0.1em;
          margin-top: 2px;
        }

        /* ── RESULT BODY ── */
        .result-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .result-section {
          padding: 18px 20px;
          border-right: 1px solid rgba(0,245,255,0.07);
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .result-section:nth-child(even) { border-right: none; }
        .section-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a8a9a;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }

        /* ── ENGINE BARS ── */
        .engine-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
        }
        .engine-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a6a8a;
          width: 44px;
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
          transition: width 0.6s ease;
        }
        .bar-fill.danger {
          background: linear-gradient(90deg, #992233, #ff4d6d);
        }
        .engine-pct {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          width: 32px;
          text-align: right;
          flex-shrink: 0;
        }
        .engine-flag {
          font-size: 9px;
          width: 14px;
          text-align: center;
          flex-shrink: 0;
        }

        /* ── INDICATORS ── */
        .indicator-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #7ab8cc;
          line-height: 1.5;
        }
        .indicator-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #ff4d6d;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .indicator-dot.safe { background: #2dc56a; }
        .no-indicators {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #2a5a6a;
        }

        /* ── EXPLANATION ── */
        .explanation-text {
          font-size: 13px;
          color: #7ab8cc;
          line-height: 1.6;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 400;
        }

        @media (max-width: 600px) {
          .result-body { grid-template-columns: 1fr; }
          .result-section { border-right: none; }
        }
      `}</style>

      <div className="scan-root">

        {/* ── HEADER ── */}
        <div className="scan-header">
          <div className="scan-brand">
            <div className="scan-brand-shield">🛡</div>
            PhishMe<em>Not</em> AI
          </div>
          <div className="scan-status">
            <div className="status-dot" />
            4 ENGINES ACTIVE
          </div>
        </div>

        {/* ── NAV ── */}
        <div className="scan-nav">
          <a href="/dashboard" className="nav-item">DASHBOARD</a>
          <span className="nav-item active">SCAN</span>
          <a href="/history" className="nav-item">HISTORY</a>
          <a href="/reports" className="nav-item">REPORTS</a>
          <a href="/settings" className="nav-item">SETTINGS</a>
        </div>

        {/* ── BODY ── */}
        <div className="scan-body">
          <div className="scan-page-title">// PASTE EMAIL CONTENT BELOW FOR ANALYSIS</div>

          {/* Input Panel */}
          <div className="input-panel">
            <div className="panel-label">EMAIL_CONTENT</div>
            <textarea
              className="email-textarea"
              placeholder="Paste the full email text here — subject, body, links, headers..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
            />
            <div className="char-count">{emailText.length} chars</div>
            <div className="btn-row">
              <button
                className="btn-scan"
                onClick={handleScan}
                disabled={loading || !emailText.trim()}
              >
                {loading ? "SCANNING..." : "⚡ RUN SCAN"}
              </button>
              <button className="btn-clear" onClick={handleClear}>
                CLEAR
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-panel">
              <div className="loading-spinner" />
              <div className="loading-text">RUNNING ENGINES...</div>
              <div className="loading-sub">GROQ · ML · RULES · URL SCANNER</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-panel">
              ⚠ ERROR: {error}
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="result-panel">

              {/* Result Header */}
              <div className={`result-header ${isPhishing ? "phishing" : "safe"}`}>
                <div className="result-verdict">
                  <div className="verdict-icon">{isPhishing ? "🚨" : "✅"}</div>
                  <div>
                    <div className={`verdict-label ${isPhishing ? "phishing" : "safe"}`}>
                      {isPhishing ? "PHISHING DETECTED" : "EMAIL IS SAFE"}
                    </div>
                    <div className="verdict-sub">
                      {result.votes || "—"} &nbsp;·&nbsp; CONFIDENCE {Math.round((result.confidence ?? 0) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="result-badges">
                  {result.cache_hit && (
                    <span className="badge badge-cache">⚡ CACHED</span>
                  )}
                  <span className={`badge ${isPhishing ? "badge-phish" : "badge-safe"}`}>
                    {isPhishing ? "PHISHING" : "SAFE"}
                  </span>
                  <span className="badge badge-votes">
                    SCORE: {Math.round(score)}%
                  </span>
                </div>
              </div>

              {/* Score Ring */}
              <div className="score-ring-wrap">
                <div className="score-ring">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#0d1e2c" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={isPhishing ? "#ff4d6d" : "#2dc56a"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.8s ease" }}
                    />
                  </svg>
                  <div className="score-ring-label">
                    <span className={`score-num ${isPhishing ? "phishing" : "safe"}`}>
                      {Math.round(score)}
                    </span>
                    <span className="score-word">RISK</span>
                  </div>
                </div>
              </div>

              {/* Result Body */}
              <div className="result-body">

                {/* Engine Breakdown */}
                <div className="result-section">
                  <div className="section-title">ENGINE BREAKDOWN</div>
                  {result.engine_breakdown &&
                    Object.entries(result.engine_breakdown).map(([engine, data]) => {
                      const conf = Math.round((data.confidence ?? 0) * 100);
                      const flagged = data.is_phishing;
                      return (
                        <div className="engine-row" key={engine}>
                          <div className="engine-name">{engine.toUpperCase()}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${flagged ? "danger" : ""}`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <div
                            className="engine-pct"
                            style={{ color: flagged ? "#ff4d6d" : "#2dc56a" }}
                          >
                            {conf}%
                          </div>
                          <div className="engine-flag">
                            {flagged ? "🚩" : "✓"}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Threat Indicators */}
                <div className="result-section">
                  <div className="section-title">THREAT INDICATORS</div>
                  {result.indicators && result.indicators.length > 0 ? (
                    result.indicators.map((ind, i) => (
                      <div className="indicator-item" key={i}>
                        <div className={`indicator-dot ${isPhishing ? "" : "safe"}`} />
                        {ind}
                      </div>
                    ))
                  ) : (
                    <div className="no-indicators">No indicators found</div>
                  )}
                </div>

                {/* AI Analysis */}
                <div className="result-section" style={{ gridColumn: "1 / -1" }}>
                  <div className="section-title">AI ANALYSIS</div>
                  <div className="explanation-text">
                    {result.explanation || "No explanation provided."}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Scan;