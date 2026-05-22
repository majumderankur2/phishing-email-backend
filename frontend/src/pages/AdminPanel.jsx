// AdminPanel.jsx
import { useEffect, useState } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { auth } from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const db = getFirestore();

// ── Constants ───────────────────────────────────────────────────────────────
const PIE_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

// ── Helper: format Firestore timestamp ─────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "Unknown";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-700/50 rounded-xl ${className}`} />
);

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-[#0d1835] rounded-2xl p-6 text-center">
    <p className="text-3xl mb-2">{icon}</p>
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

// ── Engine Badge ────────────────────────────────────────────────────────────
const EngineBadge = ({ name, status }) => (
  <div className="bg-black/40 p-4 rounded-2xl text-center">
    <p className="text-xs text-gray-400 uppercase font-semibold mb-2">{name}</p>
    {status === "loading" ? (
      <Skeleton className="h-5 w-16 mx-auto" />
    ) : (
      <p className={`font-bold ${status === "ok" ? "text-green-400" : "text-red-400"}`}>
        {status === "ok" ? "● Online" : "● Offline"}
      </p>
    )}
  </div>
);

// ── ACCESS DENIED ────────────────────────────────────────────────────────────
const AccessDenied = () => (
  <div className="min-h-screen bg-[#020b24] text-white flex">
    <DashboardSidebar />
    <div className="flex-1 ml-[320px] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl mb-6">🚫</p>
        <h1 className="text-4xl font-bold text-red-400 mb-4">Access Denied</h1>
        <p className="text-gray-400 text-lg">
          You don't have admin privileges to view this page.
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Contact your administrator to get access.
        </p>
      </div>
    </div>
  </div>
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [isAdmin,      setIsAdmin]      = useState(null); // null=checking
  const [loading,      setLoading]      = useState(true);
  const [globalStats,  setGlobalStats]  = useState({
    totalUsers: 0, totalScans: 0,
    totalThreats: 0, totalSafe: 0,
  });
  const [allScans,     setAllScans]     = useState([]);  // recent scans across all users
  const [userList,     setUserList]     = useState([]);  // per-user summary
  const [engineStatus, setEngineStatus] = useState({
    groq: "loading", bert: "loading",
    ml:   "loading", rules: "loading", url: "loading",
  });
  const [pieData,      setPieData]      = useState([]);
  const [barData,      setBarData]      = useState([]);

  // ── Check admin role ───────────────────────────────────────────────────
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const uid  = auth.currentUser?.uid;
        if (!uid) { setIsAdmin(false); return; }
        const snap = await getDoc(doc(db, "users", uid));
        setIsAdmin(snap.exists() && snap.data()?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // ── Load data once admin confirmed ─────────────────────────────────────
  useEffect(() => {
    if (isAdmin === true) {
      loadAllData();
      fetchEngineStatus();
    }
  }, [isAdmin]);

  const fetchEngineStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const res = await fetch(`${API_URL}/api/engines/status`);
      const data = await res.json();
      const eng  = data.engines || {};
      setEngineStatus({
        groq:  eng.groq?.status  || "error",
        bert:  eng.bert?.status  || "error",
        ml:    eng.ml?.status    || "error",
        rules: eng.rules?.status || "error",
        url:   eng.url?.status   || "error",
      });
    } catch {
      setEngineStatus({
        groq: "error", bert: "error",
        ml: "error", rules: "error", url: "error",
      });
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);

      // 1. Get all users from scanHistory collection
      const historyRef  = collection(db, "scanHistory");
      const usersSnap   = await getDocs(historyRef);

      let totalScans   = 0;
      let totalThreats = 0;
      let totalSafe    = 0;
      let recentScans  = [];
      let users        = [];
      const dateMap    = {};

      for (const userDoc of usersSnap.docs) {
        const uid       = userDoc.id;
        const scansRef  = collection(db, "scanHistory", uid, "scans");
        const scansSnap = await getDocs(scansRef);

        let userThreats = 0;
        let userSafe    = 0;

        scansSnap.docs.forEach((s) => {
          const data  = s.data();
          const label = data.label?.toLowerCase();
          totalScans++;

          if (label === "phishing" || label === "suspicious") {
            totalThreats++;
            userThreats++;
          } else if (label === "safe") {
            totalSafe++;
            userSafe++;
          }

          // Collect recent scans
          recentScans.push({
            id:        s.id,
            uid,
            label:     data.label,
            score:     data.score,
            votes:     data.votes,
            createdAt: data.createdAt,
            emailText: data.emailText,
          });

          // Group by date for bar chart
          const dateKey = data.createdAt
            ? formatDate(data.createdAt).split(",")[0]
            : "Unknown";
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = { date: dateKey, phishing: 0, suspicious: 0, safe: 0 };
          }
          if (label === "phishing")        dateMap[dateKey].phishing++;
          else if (label === "suspicious") dateMap[dateKey].suspicious++;
          else if (label === "safe")       dateMap[dateKey].safe++;
        });

        users.push({
          uid,
          totalScans:  scansSnap.size,
          threats:     userThreats,
          safe:        userSafe,
        });
      }

      // Sort recent scans by date
      recentScans.sort((a, b) => {
        const dA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dB - dA;
      });

      setGlobalStats({
        totalUsers:   usersSnap.size,
        totalScans,
        totalThreats,
        totalSafe,
      });

      setAllScans(recentScans.slice(0, 20)); // last 20 across all users
      setUserList(users);

      setPieData([
        { name: "Phishing",   value: totalThreats, color: "#ef4444" },
        { name: "Safe",       value: totalSafe,    color: "#22c55e" },
      ].filter((d) => d.value > 0));

      setBarData(Object.values(dateMap).slice(-7));

    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Still checking admin ────────────────────────────────────────────────
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#020b24] text-white flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Checking permissions...</p>
      </div>
    );
  }

  // ── Not admin ───────────────────────────────────────────────────────────
  if (isAdmin === false) return <AccessDenied />;

  // ── ADMIN VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020b24] text-white flex">

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN */}
      <div className="flex-1 ml-[320px] p-10">

        {/* HEADER */}
        <h1 className="text-5xl md:text-7xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400 text-lg mb-10">
          Global analytics across all users and engines.
        </p>

        {/* ── GLOBAL STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {loading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatCard icon="👥" label="Total Users"    value={globalStats.totalUsers}   color="text-blue-400"   />
              <StatCard icon="📧" label="Total Scans"    value={globalStats.totalScans}   color="text-purple-400" />
              <StatCard icon="🎣" label="Total Threats"  value={globalStats.totalThreats} color="text-red-400"    />
              <StatCard icon="✅" label="Safe Emails"    value={globalStats.totalSafe}    color="text-green-400"  />
            </>
          )}
        </div>

        {/* ── ENGINE STATUS ── */}
        <section className="bg-[#07153d] rounded-3xl p-6 mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">🖥️ Engine Status</h2>
            <button
              onClick={fetchEngineStatus}
              className="text-sm text-blue-400 hover:text-blue-300 font-semibold"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <EngineBadge name="Groq AI"    status={engineStatus.groq}  />
            <EngineBadge name="BERT"        status={engineStatus.bert}  />
            <EngineBadge name="ML Engine"   status={engineStatus.ml}    />
            <EngineBadge name="Rule Engine" status={engineStatus.rules} />
            <EngineBadge name="URL Scanner" status={engineStatus.url}   />
          </div>
        </section>

        {/* ── CHARTS ── */}
        {!loading && (pieData.length > 0 || barData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

            {/* PIE */}
            <div className="bg-[#07153d] rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">Global Threat Distribution</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0d1835",
                      border: "none",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* BAR */}
            <div className="bg-[#07153d] rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">Daily Scans (Last 7 Days)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                  <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0d1835",
                      border: "none",
                      borderRadius: 12,
                    }}
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

        {/* ── USER LIST ── */}
        <section className="bg-[#07153d] rounded-3xl p-6 mb-10">
          <h2 className="text-2xl font-bold mb-6">👥 All Users</h2>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : userList.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700 text-left">
                    <th className="pb-3 pr-4">User ID</th>
                    <th className="pb-3 pr-4">Total Scans</th>
                    <th className="pb-3 pr-4">Threats</th>
                    <th className="pb-3">Safe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {userList.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/5 transition">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-300">
                        {u.uid.slice(0, 16)}...
                      </td>
                      <td className="py-3 pr-4 text-blue-400 font-bold">
                        {u.totalScans}
                      </td>
                      <td className="py-3 pr-4 text-red-400 font-bold">
                        {u.threats}
                      </td>
                      <td className="py-3 text-green-400 font-bold">
                        {u.safe}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── RECENT SCANS ACROSS ALL USERS ── */}
        <section className="bg-[#07153d] rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-6">🕒 Recent Scans (All Users)</h2>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : allScans.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No scans found.</p>
          ) : (
            <div className="space-y-3">
              {allScans.map((scan, i) => (
                <div
                  key={scan.id || i}
                  className="flex flex-wrap justify-between items-center gap-4 bg-black/30 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Label badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      scan.label?.toLowerCase() === "phishing"
                        ? "bg-red-600 text-white"
                        : scan.label?.toLowerCase() === "suspicious"
                        ? "bg-yellow-500 text-black"
                        : "bg-green-600 text-white"
                    }`}>
                      {scan.label || "—"}
                    </span>

                    <div>
                      <p className="text-xs text-gray-400 font-mono">
                        User: {scan.uid?.slice(0, 12)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                        {scan.emailText?.slice(0, 60) || "No preview"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      scan.score >= 70 ? "text-red-400"
                      : scan.score >= 40 ? "text-yellow-400"
                      : "text-green-400"
                    }`}>
                      {scan.score?.toFixed(1) ?? "—"}% risk
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(scan.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AdminPanel;