import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

import Login    from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Scan     from "../pages/Scan";
import History from "../pages/History";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";


// Placeholder pages until you build them
const ComingSoon = ({ page }) => (
  <div style={{
    minHeight: "100vh",
    background: "#080c10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Share Tech Mono', monospace",
    color: "#3a8a9a",
    fontSize: "12px",
    letterSpacing: "3px",
  }}>
    // {page.toUpperCase()} — COMING SOON
  </div>
);

// Protects routes — redirects to / if not logged in
const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed,   setAuthed]   = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthed(!!user);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) return null; // or a loading spinner
  return authed ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/"       element={<Login />} />
    <Route path="/login"  element={<Login />} />

    {/* Protected */}
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />
    <Route path="/scan" element={
      <ProtectedRoute><Scan /></ProtectedRoute>
    } />
    <Route path="/history" element={
      <ProtectedRoute><History /></ProtectedRoute>
    } />
    <Route path="/reports" element={
  <ProtectedRoute><Reports /></ProtectedRoute>
} />
    <Route path="/settings" element={
  <ProtectedRoute><Settings /></ProtectedRoute>
} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;