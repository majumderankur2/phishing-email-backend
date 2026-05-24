import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

const History = () => {
  const navigate = useNavigate();
  const [scans, setScans]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all"); // all | phishing | safe | cached

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [scans, filter]);

  const fetchHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, "scans"),
        where("uid", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setScans(data);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (f) => {
    if (f === "all")      return setFiltered(scans);
    if (f === "phishing") return setFiltered(scans.filter((s) => s.label === "phishing" || s.label === "suspicious"));
    if (f === "safe")     return setFiltered(scans.filter((s) => s.label === "safe"));
    if (f === "cached")   return setFiltered(scans.filter((s) => s.cache_hit === true));
  };

  const formatDate = (ts) => {
    if (!ts?.toDate) return "—";
    const d = ts.toDate();
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      + "  " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const threats = scans.filter((s) => s.label === "phishing" || s.label === "suspicious").length;
  const cached  = scans.filter((s) => s.cache_hit).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        .hist-root {
          min-height: 100vh;
          background: #080c10;
          font-family: 'Rajdhani', sans-serif;
          color: #e0f0ff;
        }

        /* ── HEADER ── */
        .hist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,245,255,0.1);
          background: #060a0e;
        }
        .hist-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .hist-brand em { font-style: normal; color: #ff4d6d; }
        .hist-brand-shield {
          width: 32px; height: 32px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.45);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .hist-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hist-status {
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
          animation: hist-pulse 2s ease-in-out infinite;
        }
        @keyframes hist-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .hist-signout {
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
        .hist-signout:hover {
          background: rgba(255,77,109,0.08);
          border-color: rgba(255,77,109,0.6);
        }

        /* ── NAV ── */
        .hist-nav {
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
        .hist-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px;
        }
        .hist-page-title {
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
          padding: 14px 16px;
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
          margin-bottom: 6px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #00f5ff;
          font-family: 'Rajdhani', sans-serif;
          line-height: 1;
        }
        .summary-value.red   { color: #ff4d6d; }
        .summary-value.green { color: #2dc56a; }
        .summary-value.amber { color: #f5a623; }

        /* ── FILTER + SEARCH ROW ── */
        .controls-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .filter-btn {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.12);
          border-radius: 4px;
          color: #3a6a8a;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          padding: 6px 14px;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: rgba(0,245,255,0.3); color: #6aaabb; }
        .filter-btn.active {
          background: rgba(0,245,255,0.1);
          border-color: rgba(0,245,255,0.4);
          color: #00f5ff;
        }
        .filter-btn.red.active {
          background: rgba(255,77,109,0.1);
          border-color: rgba(255,77,109,0.4);
          color: #ff4d6d;
        }
        .filter-btn.green.active {
          background: rgba(45,197,106,0.1);
          border-color: rgba(45,197,106,0.4);
          color: #2dc56a;
        }
        .filter-btn.amber.active {
          background: rgba(245,166,35,0.1);
          border-color: rgba(245,166,35,0.4);
          color: #f5a623;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.12);
          border-radius: 4px;
          color: #a0dff0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          padding: 7px 14px;
          outline: none;
          transition: border-color 0.2s;
          letter-spacing: 0.06em;
        }
        .search-input:focus { border-color: rgba(0,245,255,0.35); }
        .search-input::placeholder { color: #1e4a5a; }
        .result-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #2a5a6a;
          margin-left: auto;
          letter-spacing: 1px;
        }

        /* ── TABLE PANEL ── */
        .table-panel {
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.1);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .table-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent);
        }

        /* ── TABLE ── */
        .hist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .hist-table th {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a5a6a;
          letter-spacing: 2px;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(0,245,255,0.08);
          background: #060e18;
          white-space: nowrap;
        }
        .hist-table td {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(0,245,255,0.04);
          vertical-align: middle;
        }
        .hist-table tr:last-child td { border-bottom: none; }
        .hist-table tr:hover td {
          background: rgba(0,245,255,0.02);
        }

        .td-date {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a6a80;
          white-space: nowrap;
        }
        .td-preview {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #6a9ab0;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .td-score {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .td-engines {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #2a5a6a;
          white-space: nowrap;
        }

        /* badges */
        .verdict-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          padding: 3px 8px;
          border-radius: 3px;
          font-weight: 700;
          letter-spacing: 1px;
          white-space: nowrap;
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
          padding: 3px 7px;
          border-radius: 3px;
          background: rgba(0,245,255,0.08);
          color: #00f5ff;
          border: 1px solid rgba(0,245,255,0.2);
          white-space: nowrap;
        }

        /* ── EMPTY / LOADING ── */
        .empty-state {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #1e3a4a;
          text-align: center;
          padding: 40px 20px;
          letter-spacing: 2px;
        }
        .loading-row {
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
          animation: hist-spin 0.8s linear infinite;
        }
        @keyframes hist-spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
          .hist-table th:nth-child(4),
          .hist-table td:nth-child(4) { display: none; }
        }
      `}</style>

      <div className="hist-root">

        {/* ── HEADER ── */}
        <div className="hist-header">
          <div className="hist-brand">
            <div className="hist-brand-shield">🛡</div>
            PhishMe<em>Not</em> AI
          </div>
          <div className="hist-header-right">
            <div className="hist-status">
              <div className="status-dot" />
              4 ENGINES ACTIVE
            </div>
            <button className="hist-signout" onClick={handleSignOut}>
              SIGN OUT
            </button>
          </div>
        </div>

        {/* ── NAV ── */}
        <div className="hist-nav">
          <a href="/dashboard" className="nav-item">DASHBOARD</a>
          <a href="/scan"      className="nav-item">SCAN</a>
          <span className="nav-item active">HISTORY</span>
          <a href="/reports"   className="nav-item">REPORTS</a>
          <a href="/settings"  className="nav-item">SETTINGS</a>
        </div>

        {/* ── BODY ── */}
        <div className="hist-body">
          <div className="hist-page-title">// FULL SCAN HISTORY — ALL RECORDS</div>

          {/* ── SUMMARY CARDS ── */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Scans</div>
              <div className="summary-value">{scans.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Threats Found</div>
              <div className="summary-value red">{threats}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Safe Emails</div>
              <div className="summary-value green">{scans.length - threats}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Cache Hits</div>
              <div className="summary-value amber">{cached}</div>
            </div>
          </div>

          {/* ── FILTER + SEARCH ── */}
          <div className="controls-row">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >ALL</button>
            <button
              className={`filter-btn red ${filter === "phishing" ? "active" : ""}`}
              onClick={() => setFilter("phishing")}
            >PHISHING</button>
            <button
              className={`filter-btn green ${filter === "safe" ? "active" : ""}`}
              onClick={() => setFilter("safe")}
            >SAFE</button>
            <button
              className={`filter-btn amber ${filter === "cached" ? "active" : ""}`}
              onClick={() => setFilter("cached")}
            >⚡ CACHED</button>
            <input
              className="search-input"
              placeholder="SEARCH EMAIL PREVIEW..."
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setFiltered(
                  scans.filter((s) =>
                    (s.email_preview || "").toLowerCase().includes(q)
                  )
                );
              }}
            />
            <div className="result-count">{filtered.length} RECORDS</div>
          </div>

          {/* ── TABLE ── */}
          <div className="table-panel">
            {loading ? (
              <div className="loading-row">
                <div className="mini-spinner" />
                LOADING SCAN HISTORY...
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {scans.length === 0
                  ? "NO SCANS YET — RUN YOUR FIRST SCAN AT /SCAN"
                  : "NO RECORDS MATCH YOUR FILTER"}
              </div>
            ) : (
              <table className="hist-table">
                <thead>
                  <tr>
                    <th>DATE / TIME</th>
                    <th>EMAIL PREVIEW</th>
                    <th>VERDICT</th>
                    <th>SCORE</th>
                    <th>CACHE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((scan) => {
                    const isPhish = scan.label === "phishing" || scan.label === "suspicious";
                    return (
                      <tr key={scan.id}>
                        <td className="td-date">{formatDate(scan.timestamp)}</td>
                        <td className="td-preview">{scan.email_preview || "—"}</td>
                        <td>
                          <span className={`verdict-badge ${isPhish ? "phish" : "safe"}`}>
                            {isPhish ? "PHISHING" : "SAFE"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="td-score"
                            style={{ color: isPhish ? "#ff4d6d" : "#2dc56a" }}
                          >
                            {Math.round(scan.score ?? 0)}%
                          </span>
                        </td>
                        <td>
                          {scan.cache_hit
                            ? <span className="cached-badge">⚡ HIT</span>
                            : <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#1e3a4a" }}>—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default History;