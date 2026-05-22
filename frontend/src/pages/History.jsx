// History.jsx
import { useState, useEffect } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { getUserScanHistory } from "../services/historyService";

// ── helper: label → color classes ──────────────────────────────────────────
const getLabelStyle = (label) => {
  switch (label?.toLowerCase()) {
    case "phishing":   return "bg-red-600 text-white";
    case "suspicious": return "bg-yellow-500 text-black";
    case "safe":       return "bg-green-600 text-white";
    default:           return "bg-gray-600 text-white";
  }
};

// ── helper: score → color ───────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-yellow-400";
  return "text-green-400";
};

// ── helper: format Firestore timestamp ─────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "Unknown date";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
};

// ── Loading Skeleton ────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#0d1835] rounded-3xl p-6 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 w-24 bg-gray-700 rounded-full" />
      <div className="h-4 w-32 bg-gray-700 rounded" />
    </div>
    <div className="h-4 w-full bg-gray-700 rounded mb-2" />
    <div className="h-4 w-3/4 bg-gray-700 rounded mb-4" />
    <div className="h-3 w-1/3 bg-gray-700 rounded" />
  </div>
);

// ── Single Scan Card ────────────────────────────────────────────────────────
const ScanCard = ({ scan }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#0d1835] rounded-3xl p-6 border border-gray-800 hover:border-blue-700 transition-all">

      {/* TOP ROW */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">

        {/* Label badge + score */}
        <div className="flex items-center gap-4">
          <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase ${getLabelStyle(scan.label)}`}>
            {scan.label || "Unknown"}
          </span>
          <span className={`text-2xl font-bold ${getScoreColor(scan.score)}`}>
            {scan.score?.toFixed(1) ?? "—"}% risk
          </span>
        </div>

        {/* Date + votes */}
        <div className="text-right text-sm text-gray-400">
          <p>{formatDate(scan.createdAt)}</p>
          {scan.votes && (
            <p className="mt-1 text-blue-400 font-semibold">{scan.votes}</p>
          )}
        </div>
      </div>

      {/* EMAIL PREVIEW */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2 bg-black/30 rounded-xl p-3">
        {scan.emailText || "No email content saved."}
      </p>

      {/* INDICATORS */}
      {scan.indicators?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {scan.indicators.slice(0, 4).map((ind, i) => (
            <span
              key={i}
              className="bg-red-900/40 text-red-300 text-xs px-3 py-1 rounded-full border border-red-800"
            >
              {ind}
            </span>
          ))}
          {scan.indicators.length > 4 && (
            <span className="text-gray-400 text-xs px-2 py-1">
              +{scan.indicators.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* EXPAND BUTTON */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
      >
        {expanded ? "▲ Hide Details" : "▼ Show Full Details"}
      </button>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">

          {/* GROQ EXPLANATION */}
          {scan.explanation && (
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                🤖 AI Explanation
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed bg-black/30 rounded-xl p-4">
                {scan.explanation}
              </p>
            </div>
          )}

          {/* ENGINE BREAKDOWN */}
          {scan.engine_breakdown && (
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-3">
                ⚙️ Engine Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(scan.engine_breakdown).map(([engine, data]) => (
                  <div
                    key={engine}
                    className={`rounded-2xl p-3 text-center border ${
                      data.is_phishing
                        ? "bg-red-900/30 border-red-700"
                        : "bg-green-900/30 border-green-700"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                      {engine}
                    </p>
                    <p className={`text-lg font-bold ${data.is_phishing ? "text-red-400" : "text-green-400"}`}>
                      {data.is_phishing ? "⚠ Phish" : "✓ Safe"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(data.confidence * 100).toFixed(0)}% conf.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL INDICATORS */}
          {scan.indicators?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                🚩 All Indicators
              </h3>
              <ul className="space-y-1">
                {scan.indicators.map((ind, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                    <span className="mt-1">•</span> {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
const History = () => {
  const [allScans,  setAllScans]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");   // all | phishing | suspicious | safe
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest

  // Load from Firestore on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const scans = await getUserScanHistory();
        setAllScans(scans);
        setFiltered(scans);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Re-filter whenever search / filter / sort changes
  useEffect(() => {
    let result = [...allScans];

    // 1. Label filter
    if (filter !== "all") {
      result = result.filter((s) => s.label?.toLowerCase() === filter);
    }

    // 2. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.emailText?.toLowerCase().includes(q) ||
          s.label?.toLowerCase().includes(q) ||
          s.indicators?.some((ind) => ind.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFiltered(result);
  }, [search, filter, sortOrder, allScans]);

  // Stats from allScans
  const stats = {
    total:      allScans.length,
    phishing:   allScans.filter((s) => s.label?.toLowerCase() === "phishing").length,
    suspicious: allScans.filter((s) => s.label?.toLowerCase() === "suspicious").length,
    safe:       allScans.filter((s) => s.label?.toLowerCase() === "safe").length,
  };

  return (
    <div className="min-h-screen bg-[#020b24] text-white flex">

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN */}
      <div className="flex-1 ml-[320px] p-10">

        {/* HEADER */}
        <h1 className="text-5xl md:text-7xl font-bold mb-4">Scan History</h1>
        <p className="text-gray-400 text-lg mb-10">
          All your past email scans in one place.
        </p>

        {/* MINI STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total",      value: stats.total,      color: "text-blue-400"   },
            { label: "Phishing",   value: stats.phishing,   color: "text-red-400"    },
            { label: "Suspicious", value: stats.suspicious, color: "text-yellow-400" },
            { label: "Safe",       value: stats.safe,       color: "text-green-400"  },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1835] rounded-2xl p-5 text-center">
              <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER + SORT */}
        <div className="flex flex-wrap gap-4 mb-8">

          {/* Search */}
          <input
            type="text"
            placeholder="Search emails, labels, indicators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-[#0d1835] border border-gray-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
          />

          {/* Label Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#0d1835] border border-gray-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Labels</option>
            <option value="phishing">Phishing</option>
            <option value="suspicious">Suspicious</option>
            <option value="safe">Safe</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#0d1835] border border-gray-700 rounded-2xl px-5 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p className="text-gray-400 text-sm mb-6">
            Showing <span className="text-white font-bold">{filtered.length}</span> of{" "}
            <span className="text-white font-bold">{allScans.length}</span> scans
          </p>
        )}

        {/* SCAN CARDS */}
        <div className="space-y-6">

          {/* Loading skeletons */}
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="bg-[#0d1835] rounded-3xl p-16 text-center">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-2xl font-bold text-gray-300 mb-2">No scans found</p>
              <p className="text-gray-500">
                {allScans.length === 0
                  ? "You haven't scanned any emails yet. Go to Dashboard to start."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          )}

          {/* Scan list */}
          {!loading &&
            filtered.map((scan, index) => (
              <ScanCard key={scan.id || index} scan={scan} />
            ))}

        </div>
      </div>
    </div>
  );
};

export default History;