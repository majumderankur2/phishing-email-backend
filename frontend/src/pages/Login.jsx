import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .pmn-login-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080c10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          position: relative;
          overflow: hidden;
          font-family: 'Rajdhani', sans-serif;
        }

        .pmn-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: pmn-gridScroll 12s linear infinite;
          pointer-events: none;
        }
        @keyframes pmn-gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 0 40px; }
        }

        .pmn-scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.33), #00f5ff, rgba(0,245,255,0.33), transparent);
          animation: pmn-scanDown 4s linear infinite;
          pointer-events: none;
        }
        @keyframes pmn-scanDown {
          from { top: -2px; opacity: 1; }
          to   { top: 100%; opacity: 0.3; }
        }

        .pmn-card {
          position: relative;
          background: rgba(8, 18, 28, 0.95);
          border: 1px solid rgba(0,245,255,0.27);
          border-radius: 8px;
          padding: 36px 36px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 0 60px rgba(0,245,255,0.08), inset 0 0 30px rgba(0,245,255,0.04);
          animation: pmn-fadeUp 0.5s ease both;
        }
        @keyframes pmn-fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pmn-corner {
          position: absolute;
          width: 14px; height: 14px;
          border-color: #00f5ff;
          border-style: solid;
        }
        .pmn-corner-tl { top: -1px; left: -1px;  border-width: 2px 0 0 2px; }
        .pmn-corner-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .pmn-corner-bl { bottom: -1px; left: -1px;  border-width: 0 0 2px 2px; }
        .pmn-corner-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        .pmn-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .pmn-shield {
          width: 42px; height: 42px;
          background: rgba(0,245,255,0.12);
          border: 1px solid rgba(0,245,255,0.53);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }
        .pmn-brand-name {
          font-size: 26px;
          font-weight: 700;
          color: #00f5ff;
          letter-spacing: 0.04em;
        }
        .pmn-brand-name em {
          font-style: normal;
          color: #ff4d6d;
        }

        .pmn-tagline {
          text-align: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #2a5a6a;
          letter-spacing: 0.14em;
          margin-bottom: 28px;
        }

        .pmn-label {
          display: block;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #3a8a9a;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        .pmn-input {
          width: 100%;
          background: #030810;
          border: 1px solid rgba(0,245,255,0.2);
          border-radius: 4px;
          color: #a0dff0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 15px;
          padding: 13px 14px;
          margin-bottom: 18px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
          /* prevents iOS zoom on focus */
          -webkit-appearance: none;
        }
        .pmn-input:focus {
          border-color: rgba(0,245,255,0.55);
          box-shadow: 0 0 0 2px rgba(0,245,255,0.08);
        }
        .pmn-input::placeholder { color: #1e4a5a; }

        .pmn-btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #00b8cc, #0077aa);
          border: none;
          border-radius: 4px;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.16em;
          padding: 15px;
          cursor: pointer;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, opacity 0.2s;
          -webkit-appearance: none;
        }
        .pmn-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .pmn-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .pmn-btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
          animation: pmn-shimmer 2.5s infinite;
        }
        @keyframes pmn-shimmer {
          to { transform: translateX(100%); }
        }

        .pmn-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
        }
        .pmn-divider-line {
          flex: 1; height: 1px;
          background: rgba(0,245,255,0.1);
        }
        .pmn-divider-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #2a5a6a;
          letter-spacing: 0.1em;
        }

        .pmn-btn-google {
          width: 100%;
          background: #0a1520;
          border: 1px solid rgba(0,245,255,0.15);
          border-radius: 4px;
          color: #7ab8cc;
          font-family: 'Rajdhani', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.1em;
          padding: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.2s, color 0.2s, opacity 0.2s;
          -webkit-appearance: none;
        }
        .pmn-btn-google:hover:not(:disabled) {
          border-color: rgba(0,245,255,0.35);
          color: #a0d8f0;
        }
        .pmn-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

        .pmn-footer {
          text-align: center;
          margin-top: 22px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: #2a5a6a;
          letter-spacing: 0.06em;
        }
        .pmn-footer a {
          color: #00b8cc;
          text-decoration: none;
          margin-left: 6px;
          transition: color 0.2s;
        }
        .pmn-footer a:hover { color: #00f5ff; }

        .pmn-spinner {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pmn-spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes pmn-spin {
          to { transform: rotate(360deg); }
        }

        /* ── MOBILE STYLES ── */
        @media (max-width: 480px) {
          .pmn-login-root {
            padding: 16px 12px;
            align-items: center;
          }
          .pmn-card {
            padding: 28px 20px;
            max-width: 100%;
            border-radius: 8px;
          }
          .pmn-shield {
            width: 38px; height: 38px;
            font-size: 20px;
          }
          .pmn-brand-name {
            font-size: 22px;
          }
          .pmn-tagline {
            font-size: 11px;
            margin-bottom: 22px;
          }
          .pmn-label {
            font-size: 13px;
            margin-bottom: 6px;
          }
          .pmn-input {
            font-size: 16px;
            padding: 14px 12px;
            margin-bottom: 16px;
          }
          .pmn-btn-primary {
            font-size: 16px;
            padding: 15px;
            letter-spacing: 0.12em;
          }
          .pmn-btn-google {
            font-size: 15px;
            padding: 14px;
          }
          .pmn-footer {
            font-size: 13px;
            margin-top: 18px;
          }
          .pmn-divider {
            margin: 18px 0;
          }
          .pmn-divider-text {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="pmn-login-root">
        <div className="pmn-grid-bg" />
        <div className="pmn-scan-line" />

        <div className="pmn-card">
          <div className="pmn-corner pmn-corner-tl" />
          <div className="pmn-corner pmn-corner-tr" />
          <div className="pmn-corner pmn-corner-bl" />
          <div className="pmn-corner pmn-corner-br" />

          {/* Brand */}
          <div className="pmn-brand">
            <div className="pmn-shield">🛡</div>
            <div className="pmn-brand-name">
              PhishMe<em>Not</em> AI
            </div>
          </div>
          <div className="pmn-tagline">VERSION v1.5x</div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <label className="pmn-label">USER_ID</label>
            <input
              className="pmn-input"
              type="email"
              placeholder="operator@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="pmn-label">ACCESS_KEY</label>
            <input
              className="pmn-input"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="pmn-btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading && <span className="pmn-spinner" />}
              {loading ? "INITIALIZING..." : "START DETECTING"}
            </button>
          </form>

          {/* Divider */}
          <div className="pmn-divider">
            <div className="pmn-divider-line" />
            <span className="pmn-divider-text">OR</span>
            <div className="pmn-divider-line" />
          </div>

          {/* Google */}
          <button
            className="pmn-btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            AUTHENTICATE WITH GOOGLE
          </button>

          {/* Footer */}
          <div className="pmn-footer">
            NO ACCOUNT?
            <Link to="/signup">SIGN UP</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;