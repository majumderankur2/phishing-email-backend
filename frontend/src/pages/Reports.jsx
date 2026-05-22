// Reports.jsx
import { useState, useEffect } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { getUserScanHistory } from "../services/historyService";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ── Constants ───────────────────────────────────────────────────────────────
const PIE_COLORS = {
  phishing:   "#ef4444",
  suspicious: "#f59e0b",
  safe:       "#22c55e",
};

// ── Helper: format Firestore timestamp ─────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "Unknown";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ── Helper: group scans by date for bar chart ───────────────────────────────
const groupByDate = (scans) => {
  const map = {};
  scans.forEach((s) => {
    const date = formatDate(s.createdAt);
    if (!map[date]) map[date] = { date, phishing: 0, suspicious: 0, safe: 0 };
    const label = s.label?.toLowerCase();
    if (label === "phishing")   map[date].phishing++;
    else if (label === "suspicious") map[date].suspicious++;
    else if (label === "safe")  map[date].safe++;
  });
  return Object.values(map).slice(-7); // last 7 days
};

// ── Loading Skeleton ────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-700 rounded-xl ${className}`} />
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Reports = () => {
  const [scans,   setScans]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getUserScanHistory();
        setScans(data);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────
  const stats = {
    total:      scans.length,
    phishing:   scans.filter((s) => s.label?.toLowerCase() === "phishing").length,
    suspicious: scans.filter((s) => s.label?.toLowerCase() === "suspicious").length,
    safe:       scans.filter((s) => s.label?.toLowerCase() === "safe").length,
  };

  const pieData = [
    { name: "Phishing",   value: stats.phishing,   color: PIE_COLORS.phishing   },
    { name: "Suspicious", value: stats.suspicious, color: PIE_COLORS.suspicious },
    { name: "Safe",       value: stats.safe,        color: PIE_COLORS.safe       },
  ].filter((d) => d.value > 0);

  const barData = groupByDate(scans);

  const threatRate = stats.total > 0
    ? (((stats.phishing + stats.suspicious) / stats.total) * 100).toFixed(1)
    : 0;

  // ── Export to PDF ──────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text("Phishing Detection Report", 14, 20);

    // Meta
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 28);

    // Summary box
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Scans: ${stats.total}`, 14, 40);
    doc.text(`Phishing: ${stats.phishing}`, 14, 48);
    doc.text(`Suspicious: ${stats.suspicious}`, 14, 56);
    doc.text(`Safe: ${stats.safe}`, 14, 64);
    doc.text(`Threat Rate: ${threatRate}%`, 14, 72);

    // Table
    const rows = scans.map((s) => [
      formatDate(s.createdAt),
      s.label?.toUpperCase() || "—",
      s.score?.toFixed(1) + "%" || "—",
      s.votes || "—",
      (s.emailText || "").slice(0, 60) + "...",
    ]);

    autoTable(doc, {
      startY: 82,
      head: [["Date", "Label", "Risk Score", "Votes", "Email Preview"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
    });

    doc.save("phishing-report.pdf");
  };

  // ── Export to Excel ────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = scans.map((s) => ({
      Date:          formatDate(s.createdAt),
      Label:         s.label || "—",
      "Risk Score":  s.score?.toFixed(1) + "%" || "—",
      Confidence:    s.confidence ? (s.confidence * 100).toFixed(0) + "%" : "—",
      Votes:         s.votes || "—",
      Indicators:    s.indicators?.join(", ") || "None",
      "Email Preview": (s.emailText || "").slice(0, 100),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scan History");
    XLSX.writeFile(wb, "phishing-report.xlsx");
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020b24] text-white flex">

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN */}
      <div className="flex-1 ml-[320px] p-10">

        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold">Threat Reports</h1>
            <p className="text-gray-400 text-lg mt-2">
              Analytics and exportable reports of all your scans.
            </p>
          </div>

          {/* EXPORT BUTTONS */}
          {!loading && scans.length > 0 && (
            <div className="flex gap-4">
              <button
                onClick={exportPDF}
                className="bg-red-600 hover:bg-red-700 transition px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              >
                📄 Export PDF
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              >
                📊 Export Excel
              </button>
            </div>
          )}
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 mt-8">
          {loading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            [
              { label: "Total Scans",  value: stats.total,      color: "text-blue-400"   },
              { label: "Phishing",     value: stats.phishing,   color: "text-red-400"    },
              { label: "Suspicious",   value: stats.suspicious, color: "text-yellow-400" },
              { label: "Safe",         value: stats.safe,        color: "text-green-400"  },
            ].map((s) => (
              <div key={s.label} className="bg-[#0d1835] rounded-2xl p-6 text-center">
                <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))
          )}
        </div>

        {/* ── THREAT RATE BANNER ── */}
        {!loading && (
          <div className="bg-[#0d1835] rounded-2xl p-6 mb-10 flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-gray-400 text-sm">Overall Threat Rate</p>
              <p className="text-5xl font-bold text-red-400 mt-1">{threatRate}%</p>
            </div>
            <div className="w-full md:w-2/3 bg-gray-800 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                style={{ width: `${threatRate}%` }}
              />
            </div>
          </div>
        )}

        {/* ── CHARTS ROW ── */}
        {!loading && scans.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

            {/* PIE CHART */}
            <div className="bg-[#0d1835] rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-6">Label Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0d1835", border: "none", borderRadius: 12 }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* BAR CHART */}
            <div className="bg-[#0d1835] rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-6">Daily Scan Breakdown (Last 7 Days)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                  <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0d1835", border: "none", borderRadius: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="phishing"   fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="suspicious" fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="safe"       fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* ── SCAN TABLE ── */}
        <div className="bg-[#0d1835] rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-6">All Scans</h2>

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          )}

          {!loading && scans.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-xl font-bold text-gray-300">No scan data yet</p>
              <p className="text-gray-500 mt-2">
                Go to the Dashboard and scan some emails first.
              </p>
            </div>
          )}

          {!loading && scans.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700 text-left">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Label</th>
                    <th className="pb-3 pr-4">Risk Score</th>
                    <th className="pb-3 pr-4">Votes</th>
                    <th className="pb-3">Email Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {scans.map((scan, i) => (
                    <tr key={scan.id || i} className="hover:bg-white/5 transition">
                      <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                        {formatDate(scan.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          scan.label?.toLowerCase() === "phishing"
                            ? "bg-red-600 text-white"
                            : scan.label?.toLowerCase() === "suspicious"
                            ? "bg-yellow-500 text-black"
                            : "bg-green-600 text-white"
                        }`}>
                          {scan.label || "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold">
                        <span className={
                          scan.score >= 70 ? "text-red-400"
                          : scan.score >= 40 ? "text-yellow-400"
                          : "text-green-400"
                        }>
                          {scan.score?.toFixed(1) ?? "—"}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-blue-400">
                        {scan.votes || "—"}
                      </td>
                      <td className="py-3 text-gray-400 max-w-xs truncate">
                        {scan.emailText?.slice(0, 80) || "—"}
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
  );
};

export default Reports;