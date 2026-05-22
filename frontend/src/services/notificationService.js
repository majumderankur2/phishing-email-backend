// notificationService.js

// ── Notification types ─────────────────────────────────────────────────────
const TYPES = {
  SUCCESS: "success",
  WARNING: "warning",
  ERROR:   "error",
  INFO:    "info",
};

// ── Color map for each type ────────────────────────────────────────────────
const TYPE_STYLES = {
  success: { bg: "#16a34a", icon: "✅" },
  warning: { bg: "#d97706", icon: "⚠️" },
  error:   { bg: "#dc2626", icon: "❌" },
  info:    { bg: "#2563eb", icon: "ℹ️" },
};

// ── Core: show a toast popup ───────────────────────────────────────────────
const showToast = (message, type = TYPES.INFO, duration = 4000) => {
  // Remove existing toast if any
  const existing = document.getElementById("app-toast");
  if (existing) existing.remove();

  const { bg, icon } = TYPE_STYLES[type] || TYPE_STYLES.info;

  const toast = document.createElement("div");
  toast.id = "app-toast";
  toast.innerText = `${icon}  ${message}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${bg};
    color: white;
    padding: 14px 22px;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease;
    max-width: 380px;
    line-height: 1.5;
  `;

  // Add slide-in animation
  const style = document.createElement("style");
  style.innerText = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duration);
};

// ── Public API ─────────────────────────────────────────────────────────────

// Call this when a phishing email is detected
export const sendThreatAlert = (userEmail, threatText) => {
  const preview = threatText?.slice(0, 60) || "Unknown email";
  showToast(
    `🎣 Phishing detected for ${userEmail}:\n"${preview}..."`,
    TYPES.WARNING,
    6000
  );
};

// Generic notifications you can call from anywhere
export const notifySuccess = (message) => showToast(message, TYPES.SUCCESS);
export const notifyWarning = (message) => showToast(message, TYPES.WARNING);
export const notifyError   = (message) => showToast(message, TYPES.ERROR);
export const notifyInfo    = (message) => showToast(message, TYPES.INFO);