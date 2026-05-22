// analyticsService.js
import { getUserScanHistory } from "./historyService";

// ── Get full analytics from current user's scan history ─────────────────────
export const getAnalytics = async () => {
  try {
    const scans = await getUserScanHistory();

    const totalScans      = scans.length;

    // ✅ FIX: use lowercase labels to match backend output
    const phishingCount   = scans.filter(
      (s) => s.label?.toLowerCase() === "phishing"
    ).length;

    const suspiciousCount = scans.filter(
      (s) => s.label?.toLowerCase() === "suspicious"
    ).length;

    const safeCount       = scans.filter(
      (s) => s.label?.toLowerCase() === "safe"
    ).length;

    const threatCount     = phishingCount + suspiciousCount;

    const threatRate      = totalScans > 0
      ? ((threatCount / totalScans) * 100).toFixed(1)
      : 0;

    const safeRate        = totalScans > 0
      ? ((safeCount / totalScans) * 100).toFixed(1)
      : 0;

    // Average risk score across all scans
    const avgScore        = totalScans > 0
      ? (
          scans.reduce((sum, s) => sum + (s.score || 0), 0) / totalScans
        ).toFixed(1)
      : 0;

    // Most recent scan
    const latestScan      = scans.length > 0 ? scans[0] : null;

    return {
      totalScans,
      phishingCount,
      suspiciousCount,
      safeCount,
      threatCount,
      threatRate,     // e.g. "72.5" (% of scans that were threats)
      safeRate,       // e.g. "27.5"
      avgScore,       // e.g. "68.3" (average risk score)
      latestScan,
    };

  } catch (error) {
    console.error("Analytics Error:", error);
    return {
      totalScans:     0,
      phishingCount:  0,
      suspiciousCount:0,
      safeCount:      0,
      threatCount:    0,
      threatRate:     0,
      safeRate:       0,
      avgScore:       0,
      latestScan:     null,
    };
  }
};