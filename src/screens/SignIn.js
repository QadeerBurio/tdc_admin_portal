// SignIn.js — partner log in (brands, employers, admin, travel). Same login logic as before, new tdc design.
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Logo, LINKS, pageTitle } from "../web/site";

export default function SignIn() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    document.title = pageTitle("partner log in");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("please fill in your email and password.");
      return;
    }

    if (!validateEmail(email)) {
      setError("please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/login",
        { email, password }
      );

      const { token, user } = res.data;

      const allowedRoles = ["brand", "admin", "employee", "traveler"];

      if (!allowedRoles.includes(user.role)) {
        setError("this login is for brand and employer partners. students, please use the tdc app.");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "brand") navigate("/discount");
      else if (user.role === "employee") navigate("/employee-dashboard");
      else if (user.role === "traveler") navigate("/traveler-dashboard");
      else navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "login failed. please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tdcw">
      <div className="center-shell">
        <header className="wrap row-between" style={{ width: "100%", paddingTop: 20, paddingBottom: 20 }}>
          <Logo />
          <Link to="/signup" className="btn btn-secondary btn-sm" style={{ borderWidth: 1, borderColor: "#ECE7DB" }}>become a partner</Link>
        </header>

        <main>
          <form className="auth-card" onSubmit={handleLogin} noValidate>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontWeight: 800, fontSize: 36, letterSpacing: -1 }}>welcome back<span className="dot">.</span></h1>
              <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>log in to your brand or employer portal.</p>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="field">
              <label htmlFor="email">email</label>
              <input
                id="email"
                className="input"
                type="email"
                name="email"
                placeholder="you@yourbrand.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">password</label>
              <div className="pw-wrap">
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "hide password" : "show password"}
                >
                  {showPassword ? "hide" : "show"}
                </button>
              </div>
            </div>

            <div className="row-between">
              <label className="check">
                <input type="checkbox" />
                remember me
              </label>
              <button type="button" className="link-btn" onClick={() => navigate("/forgot-password")}>
                forgot password?
              </button>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? (<><span className="spinner" aria-hidden="true" /> logging in</>) : "log in"}
            </button>

            <p className="muted" style={{ textAlign: "center", fontSize: 15 }}>
              new here? <Link to="/signup" style={{ fontWeight: 700 }}>create a partner account</Link>
            </p>

            <div className="alert alert-info">
              student? tdc lives in the app. <a href={LINKS.getApp} style={{ fontWeight: 700 }}>get it here</a>
            </div>
          </form>
        </main>

        <footer style={{ padding: "0 24px 28px", textAlign: "center", fontSize: 13.5 }} className="muted">
          need help? <a href={`mailto:${LINKS.hello}`} style={{ color: "#6B675E" }}>{LINKS.hello}</a>
        </footer>
      </div>
    </div>
  );
}
