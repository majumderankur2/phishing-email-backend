// Settings.jsx
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

// ── Toggle Switch Component ─────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-800">
    <div>
      <p className="text-lg font-semibold">{label}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
        checked ? "bg-blue-600" : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

// ── Toast Notification ──────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl text-white font-semibold shadow-xl transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {type === "success" ? "✅ " : "❌ "}{message}
    </div>
  );
};

// ── Engine Status Badge ─────────────────────────────────────────────────────
const EngineBadge = ({ name, status }) => (
  <div className="bg-black/40 p-5 rounded-2xl flex flex-col gap-2">
    <p className="text-gray-400 text-sm font-semibold uppercase">{name}</p>
    {status === "loading" ? (
      <div className="h-5 w-16 bg-gray-700 animate-pulse rounded" />
    ) : (
      <p className={`font-bold text-lg ${
        status === "ok" ? "text-green-400" : "text-red-400"
      }`}>
        {status === "ok" ? "● Online" : "● Offline"}
      </p>
    )}
  </div>
);

// ── Delete Confirm Modal ────────────────────────────────────────────────────
const DeleteModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div className="bg-[#0d1835] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-800">
      <p className="text-3xl font-bold mb-4 text-red-400">⚠️ Delete Account</p>
      <p className="text-gray-300 mb-6 leading-relaxed">
        This will <span className="text-white font-bold">permanently delete</span> your
        account and all scan history. This action <span className="text-red-400 font-bold">cannot be undone</span>.
      </p>
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 transition px-6 py-3 rounded-2xl font-bold"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 hover:bg-red-700 transition px-6 py-3 rounded-2xl font-bold"
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Settings = () => {
  const user = auth.currentUser;

  // Profile
  const [fullName,     setFullName]     = useState("");
  const [saving,       setSaving]       = useState(false);

  // Preferences
  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [autoScan,     setAutoScan]     = useState(false);
  const [sensitivity,  setSensitivity]  = useState("Medium");

  // UI State
  const [toast,        setToast]        = useState(null); // { message, type }
  const [showDelete,   setShowDelete]   = useState(false);
  const [engineStatus, setEngineStatus] = useState({
    groq: "loading", bert: "loading",
    ml:   "loading", rules: "loading", url: "loading",
  });

  // ── Load saved settings from localStorage (lightweight, no extra service) ──
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
      if (saved.fullName)    setFullName(saved.fullName);
      if (saved.emailAlerts !== undefined) setEmailAlerts(saved.emailAlerts);
      if (saved.autoScan    !== undefined) setAutoScan(saved.autoScan);
      if (saved.sensitivity) setSensitivity(saved.sensitivity);
    } catch {}
    fetchEngineStatus();
  }, []);

  // ── Fetch real engine status from backend ──────────────────────────────
  const fetchEngineStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const res = await fetch(`${API_URL}/api/engines/status`);
      const data = await res.json();

      // Backend returns: { engines: { groq: {status:"ok"}, bert: {...}, ... } }
      const engines = data.engines || {};
      setEngineStatus({
        groq:  engines.groq?.status  || "error",
        bert:  engines.bert?.status  || "error",
        ml:    engines.ml?.status    || "error",
        rules: engines.rules?.status || "error",
        url:   engines.url?.status   || "error",
      });
    } catch {
      // If backend is down, mark all as offline
      setEngineStatus({
        groq: "error", bert: "error",
        ml:   "error", rules: "error", url: "error",
      });
    }
  };

  // ── Show toast ─────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // ── Save settings ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = { fullName, emailAlerts, autoScan, sensitivity };
      localStorage.setItem("userSettings", JSON.stringify(settings));
      showToast("Settings saved successfully!");
    } catch {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Password reset ─────────────────────────────────────────────────────
  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast("Password reset email sent!");
    } catch {
      showToast("Failed to send reset email.", "error");
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setShowDelete(false);
    try {
      await deleteUser(user);
      window.location.href = "/";
    } catch {
      showToast("Please log out and log back in before deleting account.", "error");
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020b24] text-white flex">

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN */}
      <div className="flex-1 ml-[320px] p-10">

        {/* HEADER */}
        <h1 className="text-5xl md:text-7xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400 text-lg mb-10">
          Manage your profile, preferences, and account.
        </p>

        {/* ── PROFILE SECTION ── */}
        <section className="bg-[#07153d] p-8 rounded-3xl mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            👤 Profile Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black border border-gray-700 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Email Address <span className="text-gray-600">(cannot be changed)</span>
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full p-4 rounded-2xl bg-black/50 border border-gray-800 text-gray-500 cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 transition px-8 py-4 rounded-2xl w-full text-lg font-bold mt-2"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>

        {/* ── PREFERENCES SECTION ── */}
        <section className="bg-[#07153d] p-8 rounded-3xl mb-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            ⚙️ Scan Preferences
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            These settings are saved locally on your device.
          </p>

          <Toggle
            checked={emailAlerts}
            onChange={setEmailAlerts}
            label="Email Threat Alerts"
            description="Get notified when a phishing email is detected"
          />
          <Toggle
            checked={autoScan}
            onChange={setAutoScan}
            label="Auto Scan Mode"
            description="Automatically scan emails as they are pasted"
          />

          <div className="pt-4">
            <label className="text-lg font-semibold block mb-3">
              Threat Sensitivity
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Controls how aggressively emails are flagged as threats
            </p>
            <div className="flex gap-4">
              {["Low", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  onClick={() => setSensitivity(level)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition border ${
                    sensitivity === level
                      ? level === "Low"
                        ? "bg-green-700 border-green-500 text-white"
                        : level === "Medium"
                        ? "bg-yellow-700 border-yellow-500 text-white"
                        : "bg-red-700 border-red-500 text-white"
                      : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECURITY SECTION ── */}
        <section className="bg-[#07153d] p-8 rounded-3xl mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            🔒 Security
          </h2>

          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-black/30 rounded-2xl">
              <div>
                <p className="font-semibold">Password</p>
                <p className="text-sm text-gray-400">
                  Send a password reset link to {user?.email}
                </p>
              </div>
              <button
                onClick={handlePasswordReset}
                className="bg-yellow-600 hover:bg-yellow-700 transition px-6 py-3 rounded-2xl font-bold text-sm"
              >
                Reset Password
              </button>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-red-950/30 border border-red-900 rounded-2xl">
              <div>
                <p className="font-semibold text-red-400">Delete Account</p>
                <p className="text-sm text-gray-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => setShowDelete(true)}
                className="bg-red-600 hover:bg-red-700 transition px-6 py-3 rounded-2xl font-bold text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* ── SYSTEM STATUS SECTION ── */}
        <section className="bg-[#07153d] p-8 rounded-3xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🖥️ System Status
            </h2>
            <button
              onClick={fetchEngineStatus}
              className="text-sm text-blue-400 hover:text-blue-300 transition font-semibold"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <EngineBadge name="Groq AI"      status={engineStatus.groq}  />
            <EngineBadge name="BERT"          status={engineStatus.bert}  />
            <EngineBadge name="ML Engine"     status={engineStatus.ml}    />
            <EngineBadge name="Rule Engine"   status={engineStatus.rules} />
            <EngineBadge name="URL Scanner"   status={engineStatus.url}   />
          </div>

          <div className="mt-4 p-4 bg-black/30 rounded-2xl">
            <p className="text-sm text-gray-400">
              Backend URL:{" "}
              <span className="text-blue-400 font-mono">
                http://127.0.0.1:5000
              </span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Firebase:{" "}
              <span className="text-green-400 font-semibold">
                {user ? "● Connected" : "● Disconnected"}
              </span>
            </p>
          </div>
        </section>

      </div>

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDelete(false)}
        />
      )}

    </div>
  );
};

export default Settings;