// VerifyOTP.js — step 2 of password reset. Same API flow as before, new tdc design.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthShell, CardTitle, pageTitle } from "../web/site";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [info, setInfo] = useState("");

  // From the previous screen, or from sessionStorage after a page refresh
  const session = (() => {
    if (location.state?.userId) return location.state;
    try { return JSON.parse(sessionStorage.getItem("tdc_reset") || "null") || {}; } catch (e) { return {}; }
  })();
  const userId = session.userId;
  const emailOrPhone = session.emailOrPhone;
  const maskedEmail = session.maskedEmail;

  const [countdown, setCountdown] = useState(session.retryAfter || 60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    document.title = pageTitle("enter code");
  }, []);

  // No session at all → back to the email screen
  useEffect(() => {
    if (!userId) navigate("/forgot-password", { replace: true });
  }, [userId, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [countdown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.trim() === "") {
      setError("please enter the code.");
      return;
    }

    if (otp.length < 4 || otp.length > 6) {
      setError("the code is 4 to 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/verify-otp",
        { userId, otp: otp.trim() }
      );

      if (res.data?.resetToken) {
        const next = { resetToken: res.data.resetToken, userId };
        try { sessionStorage.setItem("tdc_reset", JSON.stringify({ ...session, ...next })); } catch (e) {}
        navigate("/reset-password", { state: next, replace: true });
      } else {
        setError(res.data.message || "wrong code. please try again.");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || "wrong code. please check and try again.");
      } else if (err.request) {
        setError("network error. please check your connection.");
      } else {
        setError("something went wrong. please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/resend-otp",
        { emailOrPhone: emailOrPhone || undefined, userId }
      );

      if (res.data?.userId) {
        setOtp("");
        setInfo(res.data.message || "new code sent.");
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(res.data?.message || "couldn't resend the code.");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err);
      if (err.response?.status === 429) {
        setCountdown(err.response.data?.retryAfter || 60);
        setCanResend(false);
      }
      setError(err.response?.data?.message || "couldn't resend the code. please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell headerAction={<Link to="/login" className="btn btn-secondary btn-sm" style={{ borderWidth: 1, borderColor: "#ECE7DB" }}>back to log in</Link>}>
      <form className="auth-card" onSubmit={handleVerifyOTP} noValidate>
        <CardTitle title="check your inbox" sub={null} />
        <p className="muted" style={{ textAlign: "center", fontSize: 15, marginTop: -8 }}>
          we sent a code to <b style={{ color: "#111111" }}>{maskedEmail || emailOrPhone || "your email or phone"}</b>. it expires in 10 minutes.
        </p>

        {info && !error && <div className="alert alert-success" role="status">{info}</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="otp">code</label>
          <input
            id="otp"
            className="input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="······"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setOtp(value);
              if (error) setError("");
              if (info) setInfo("");
            }}
            disabled={loading}
            maxLength={6}
            autoFocus
            style={{ textAlign: "center", fontSize: 24, fontWeight: 700, letterSpacing: 10, height: 60 }}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !otp}>
          {loading ? (<><span className="spinner" aria-hidden="true" /> checking</>) : "verify"}
        </button>

        <div className="row-between">
          <button type="button" className="link-btn" onClick={handleResendOTP} disabled={!canResend || resendLoading} style={{ opacity: canResend ? 1 : 0.6, cursor: canResend ? "pointer" : "default" }}>
            {resendLoading ? "sending" : canResend ? "resend code" : `resend in ${countdown}s`}
          </button>
          <button type="button" className="link-btn" onClick={() => navigate("/forgot-password")}>use a different email</button>
        </div>

        <p className="muted" style={{ textAlign: "center", fontSize: 13.5 }}>didn't get it? check your spam folder.</p>
      </form>
    </AuthShell>
  );
}
