// Dashboard.jsx
import { useState, useEffect } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ScanResult from "../components/ScanResult";
import StatsCard from "../components/dashboard/StatsCard";
import ThreatChart from "../components/dashboard/ThreatChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import ThreatPieChart from "../components/dashboard/ThreatPieChart";
import DailyScanChart from "../components/dashboard/DailyScanChart";
import RiskMeter from "../components/dashboard/RiskMeter";
import { analyzeEmailWithGemini } from "../services/geminiService";
import { saveScanHistory, getUserScanHistory } from "../services/historyService";

const Dashboard = () => {
  const [emailText,  setEmailText]  = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [history,    setHistory]    = useState([]);
  const [stats,      setStats]      = useState({ total: 0, phishing: 0, safe: 0 });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const scans = await getUserScanHistory();
      setHistory(scans);

      // ✅ FIX: backend returns lowercase labels — "phishing", "suspicious", "safe"
      const phishingCount = scans.filter(
        (s) => s.label === "phishing" || s.label === "suspicious"
      ).length;

      const safeCount = scans.filter(
        (s) => s.label === "safe"
      ).length;

      setStats({
        total:    scans.length,
        phishing: phishingCount,
        safe:     safeCount,
      });
    } catch (error) {
      console.error("History Load Error:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!emailText.trim()) {
      alert("Please enter email content");
      return;
    }

    try {
      setLoading(true);
      setScanResult(null);

      const result = await analyzeEmailWithGemini(emailText);
      setScanResult(result);

      await saveScanHistory({
        emailText,
        label:            result.label,
        score:            result.score,
        confidence:       result.confidence,
        explanation:      result.explanation,
        indicators:       result.indicators,
        votes:            result.votes,
        engine_breakdown: result.engine_breakdown,
        createdAt:        new Date(),
      });

      await loadHistory();
      setEmailText("");

    } catch (error) {
      console.error("Analyze Error:", error);
      alert("Failed to analyze email. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020b24] text-white flex">

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-[320px] p-10">

        {/* HEADER */}
        <h1 className="text-5xl md:text-7xl font-bold mb-10">
          AI Phishing Dashboard
        </h1>

        {/* EMAIL SCANNER */}
        <div className="bg-[#07153d] p-10 rounded-3xl mb-10">
          <h2 className="text-4xl font-bold mb-8">Scan Suspicious Email</h2>

          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Paste suspicious email content here..."
            className="w-full h-[300px] bg-black border border-gray-700 rounded-3xl p-6 text-xl md:text-2xl outline-none resize-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 transition-all px-12 py-6 rounded-2xl text-2xl font-bold flex items-center gap-4"
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Analyzing with 5 AI Engines...
              </>
            ) : (
              "Analyze Email"
            )}
          </button>
        </div>

        {/* SCAN RESULT — engine breakdown lives inside ScanResult.jsx */}
        {scanResult && (
          <div className="mb-10">
            <ScanResult result={scanResult} />
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <StatsCard title="Total Scans"      value={stats.total}    />
          <StatsCard title="Threats Detected" value={stats.phishing} />
          <StatsCard title="Safe Emails"      value={stats.safe}     />
        </div>

        {/* PIE + DAILY CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <ThreatPieChart phishing={stats.phishing} safe={stats.safe} />
          <DailyScanChart history={history} />
        </div>

        {/* RISK METER */}
        <div className="mb-10">
          <RiskMeter phishing={stats.phishing} />
        </div>

        {/* THREAT CHART */}
        <div className="mb-10">
          <ThreatChart history={history} />
        </div>

        {/* RECENT ACTIVITY */}
        <RecentActivity history={history} />

      </div>
    </div>
  );
};

export default Dashboard;