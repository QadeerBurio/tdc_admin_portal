// ForgotPassword.js — step 1 of password reset. Same API flow as before, new tdc design.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthShell, CardTitle, pageTitle } from "../web/site";

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = pageTitle("forgot password");
  }, []);

  const goToVerify = (data) => {
    const session = {
      userId: data.userId,
      emailOrPhone: emailOrPhone.trim(),
      maskedEmail: data.email || "",
      retryAfter: data.retryAfter || 60,
    };
    // Survives a page refresh on the next screens
    try { sessionStorage.setItem("tdc_reset", JSON.stringify(session)); } catch (e) {}
    navigate("/verify-otp", { state: session });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone || emailOrPhone.trim() === "") {
      setError("please enter your email or phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/forgot-password",
        { emailOrPhone: emailOrPhone.trim() }
      );

      // Any 2xx with a userId = code sent → go to the code screen
      if (res.data?.userId) {
        goToVerify(res.data);
      } else {
        setError(res.data?.message || "couldn't send the code. please try again.");
      }
    } catch (err) {
      console.error("Forgot Password Error:", err);

      // 429 = a code was already sent less than a minute ago → still go enter it
      if (err.response?.status === 429 && err.response.data?.userId) {
        goToVerify(err.response.data);
        return;
      }

      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || "server error. please try again.");
      } else if (err.request) {
        setError("network error. please check your connection.");
      } else {
        setError("something went wrong. please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell headerAction={<Link to="/login" className="btn btn-secondary btn-sm" style={{ borderWidth: 1, borderColor: "#ECE7DB" }}>back to log in</Link>}>
      <form className="auth-card" onSubmit={handleSendOTP} noValidate>
        <CardTitle title="forgot your password" mark="?" sub="no stress. we'll send a code to your email or phone." />

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="emailOrPhone">email or phone</label>
          <input
            id="emailOrPhone"
            className="input"
            type="text"
            placeholder="you@yourbrand.com or 03XXXXXXXXX"
            value={emailOrPhone}
            onChange={(e) => { setEmailOrPhone(e.target.value); if (error) setError(""); }}
            disabled={loading}
            autoComplete="username"
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? (<><span className="spinner" aria-hidden="true" /> sending code</>) : "send code"}
        </button>

        <p className="muted" style={{ textAlign: "center", fontSize: 15 }}>
          remembered it? <Link to="/login" style={{ fontWeight: 700 }}>log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
