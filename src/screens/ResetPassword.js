// ResetPassword.js — step 3 of password reset. Same rules and API flow as before, new tdc design.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthShell, CardTitle } from "../web/site";

const STRENGTH = {
  Weak: { label: "weak", color: "#B42318", bars: 1 },
  Medium: { label: "okay", color: "#C77700", bars: 2 },
  Strong: { label: "strong", color: "#1E6B3A", bars: 3 },
};

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  // From the code screen, or from sessionStorage after a page refresh
  const session = (() => {
    if (location.state?.resetToken) return location.state;
    try { return JSON.parse(sessionStorage.getItem("tdc_reset") || "null") || {}; } catch (e) { return {}; }
  })();
  const resetToken = session.resetToken;
  const userId = session.userId;
  const [done, setDone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  useEffect(() => {
    document.title = "new password · tdc.";
  }, []);

  useEffect(() => {
    if (!resetToken) navigate("/forgot-password", { replace: true });
  }, [resetToken, navigate]);

  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) return "";
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[a-z]/)) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^a-zA-Z0-9]/)) score++;
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    if (error) setError("");
  };

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push("at least 8 characters");
    if (!/[a-z]/.test(pass)) errors.push("a lowercase letter");
    if (!/[A-Z]/.test(pass)) errors.push("an uppercase letter");
    if (!/[0-9]/.test(pass)) errors.push("a number");
    if (!/[^a-zA-Z0-9]/.test(pass)) errors.push("a special character");
    return errors;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || password.trim() === "") {
      setError("please enter a new password.");
      return;
    }
    if (!confirmPassword || confirmPassword.trim() === "") {
      setError("please confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("passwords don't match.");
      return;
    }
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError(`your password needs ${errors.join(", ")}.`);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/reset-password",
        { resetToken, newPassword: password, userId }
      );

      if (res.status >= 200 && res.status < 300) {
        try { sessionStorage.removeItem("tdc_reset"); } catch (e) {}
        setDone(true);
        setTimeout(() => navigate("/login", { replace: true }), 1800);
      } else {
        setError(res.data.message || "couldn't reset your password.");
      }
    } catch (err) {
      console.error("Reset Password Error:", err);
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || "couldn't reset your password. please try again.");
      } else if (err.request) {
        setError("network error. please check your connection.");
      } else {
        setError("something went wrong. please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const s = STRENGTH[passwordStrength];

  return (
    <AuthShell headerAction={<Link to="/login" className="btn btn-secondary btn-sm" style={{ borderWidth: 1, borderColor: "#ECE7DB" }}>back to log in</Link>}>
      <form className="auth-card" onSubmit={handleResetPassword} noValidate>
        <CardTitle title="new password" sub="pick something you'll remember." />

        {done && <div className="alert alert-success" role="status">password changed. sorted. taking you to log in...</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="new-password">new password</label>
          <div className="pw-wrap">
            <input
              id="new-password"
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading || done}
              autoComplete="new-password"
              autoFocus
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "hide password" : "show password"}>
              {showPassword ? "hide" : "show"}
            </button>
          </div>
          {s && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <div style={{ display: "flex", gap: 4, flex: 1 }} aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} style={{ flex: 1, height: 5, borderRadius: 3, background: n <= s.bars ? s.color : "#ECE7DB" }} />
                ))}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.label}</span>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirm-password">confirm password</label>
          <input
            id="confirm-password"
            className="input"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
            disabled={loading || done}
            autoComplete="new-password"
          />
        </div>

        <p className="muted" style={{ fontSize: 13 }}>8+ characters with an uppercase letter, a lowercase letter, a number and a special character.</p>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading || done || !password || !confirmPassword}>
          {loading ? (<><span className="spinner" aria-hidden="true" /> saving</>) : "save new password"}
        </button>

        <p className="muted" style={{ textAlign: "center", fontSize: 15 }}>
          code expired? <Link to="/forgot-password" style={{ fontWeight: 700 }}>start again</Link>
        </p>
      </form>
    </AuthShell>
  );
}
