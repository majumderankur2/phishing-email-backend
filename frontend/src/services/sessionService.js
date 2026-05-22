// sessionService.js
import { auth } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

// ── Get current logged-in user ──────────────────────────────────────────────
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ── Check if user is logged in ─────────────────────────────────────────────
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// ── Logout user + clear session ────────────────────────────────────────────
export const logoutUser = async () => {
  try {
    clearSession();
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout Error:", error);
    return false;
  }
};

// ── Listen to Firebase auth state changes ─────────────────────────────────
export const listenToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        loggedIn:     true,
        uid:          user.uid,
        email:        user.email,
        displayName:  user.displayName || "",
        photoURL:     user.photoURL    || "",
      });
    } else {
      callback({ loggedIn: false });
    }
  });
};

// ── Get user data as plain object ──────────────────────────────────────────
export const getUserData = () => {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid:           user.uid,
    email:         user.email,
    displayName:   user.displayName    || "",
    photoURL:      user.photoURL       || "",
    emailVerified: user.emailVerified,
  };
};

// ── Save login timestamp to localStorage ───────────────────────────────────
export const saveLoginTime = () => {
  localStorage.setItem("loginTime", Date.now().toString());
};

// ── Get login timestamp ────────────────────────────────────────────────────
export const getLoginTime = () => {
  return localStorage.getItem("loginTime");
};

// ── Clear session data from localStorage ───────────────────────────────────
export const clearSession = () => {
  localStorage.removeItem("loginTime");
};

// ── Check if session is still valid ───────────────────────────────────────
export const checkSession = () => {
  return !!auth.currentUser;
};

// ── Auto logout after inactivity (default: 60 mins) ───────────────────────
export const startSessionMonitor = (timeoutMinutes = 60) => {
  const loginTime = getLoginTime();
  if (!loginTime) return false;

  const minutesElapsed = (Date.now() - parseInt(loginTime)) / 1000 / 60;

  if (minutesElapsed > timeoutMinutes) {
    logoutUser();   // clears session + signs out
    return false;   // session expired
  }

  return true;      // session still valid
};