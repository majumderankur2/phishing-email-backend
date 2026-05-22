// settingsService.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

// ── Save user settings to Firestore ────────────────────────────────────────
export const saveUserSettings = async (settings) => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    await setDoc(
      doc(db, "userSettings", user.uid),
      {
        ...settings,
        updatedAt: new Date(),
      },
      { merge: true }  // ✅ merge: true means existing fields won't be wiped
    );
    return true;
  } catch (error) {
    console.error("Save Settings Error:", error);
    return false;
  }
};

// ── Get user settings from Firestore ───────────────────────────────────────
export const getUserSettings = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const snap = await getDoc(doc(db, "userSettings", user.uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Get Settings Error:", error);
    return null;
  }
};

// ── Reset settings to defaults ──────────────────────────────────────────────
export const resetUserSettings = async () => {
  const defaults = {
    fullName:     "",
    emailAlerts:  true,
    autoScan:     false,
    sensitivity:  "Medium",
    updatedAt:    new Date(),
  };
  return await saveUserSettings(defaults);
};