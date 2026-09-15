// SignIn.jsx — Same Design as Signup + Mobile Collapsible Steps
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./styles/SignIn.css";
import loginImage from "../assets/login.jpeg";

export default function SignIn() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState("");
  const [stepsOpen, setStepsOpen] = useState(false); // Mobile accordion

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Auto-close steps accordion on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setStepsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
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
        setError("Access Denied");
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
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      {/* Background layers */}
      <div className="bg-image-layer">
        <img src={loginImage} alt="" className="bg-image" />
      </div>
      <div className="bg-gradient-layer"></div>
      <div className="bg-noise-layer"></div>

      {/* Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      {/* Layout: FORM LEFT, STEPS RIGHT */}
      <div className="signin-layout">
        {/* LEFT: Form Card */}
        <div className="form-side">
          <div className="form-card">
            <div className="form-head">
              <div className="brand-mark">
                <span>tdc<span className="dot">.</span></span>
              </div>
              <div className="head-text">
                <h2>Welcome Back</h2>
                <p>Sign in to continue your journey</p>
              </div>
            </div>

            {error && (
              <div className="alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form className="signin-form" onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div className={`field floating ${focusedField === "email" || email ? "has-value" : ""}`}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="email"
                />
                <label>Email Address</label>
                <i className="field-icon fas fa-envelope"></i>
              </div>

              {/* Password */}
              <div className={`field floating ${focusedField === "password" || password ? "has-value" : ""}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="current-password"
                />
                <label>Password</label>
                <i className="field-icon fas fa-lock"></i>
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button className="submit-btn" type="submit" disabled={loading}>
                <span className="btn-glow"></span>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>

              <p className="bottom-link">
                New account?{" "}
                <a onClick={() => navigate("/signup")}>Create one</a>
              </p>
            </form>

            <div className="trust-row">
              <i className="fas fa-shield-alt"></i>
              <span>Secure & Encrypted</span>
              <span className="dot">•</span>
              <i className="fas fa-clock"></i>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Modern Steps (Collapsible on Mobile) */}
        <div className={`steps-side ${stepsOpen ? "steps-open" : ""}`}>
          {/* Mobile accordion toggle — only visible on mobile */}
          <button
            type="button"
            className="steps-toggle"
            onClick={() => setStepsOpen(!stepsOpen)}
            aria-expanded={stepsOpen}
          >
            <span className="toggle-left">
              <span className="toggle-icon">
                <i className="fas fa-list-ol"></i>
              </span>
              <span className="toggle-text">
                <strong>What you get</strong>
                <small>Welcome to The Crew</small>
              </span>
            </span>
            <span className={`toggle-chevron ${stepsOpen ? "open" : ""}`}>
              <i className="fas fa-chevron-down"></i>
            </span>
          </button>

          {/* Steps content — collapsible wrapper */}
          <div className="steps-content">
            <h1 className="steps-title">
              Welcome to <br />
              <span className="steps-accent">The Crew</span>
            </h1>

            <p className="steps-subtitle">
              Sign in to access your dashboard, exclusive offers, and network connections.
            </p>

            <div className="steps-list">
              <div className="step-item" data-step="1">
                <div className="step-number">
                  <span>01</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                  <h3>Sign in securely</h3>
                  <p>Your data is encrypted end-to-end with modern security.</p>
                </div>
              </div>

              <div className="step-divider"></div>

              <div className="step-item" data-step="2">
                <div className="step-number">
                  <span>02</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                  <h3>Access your dashboard</h3>
                  <p>Track offers, deals and analytics — all in one place.</p>
                </div>
              </div>

              <div className="step-divider"></div>

              <div className="step-item" data-step="3">
                <div className="step-number">
                  <span>03</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                  <h3>Grow your network</h3>
                  <p>Connect with brands and unlock member-only perks.</p>
                </div>
              </div>
            </div>

            <div className="steps-features">
              <div className="mini-feature">
                <i className="fas fa-bolt"></i>
                <span>Fast access</span>
              </div>
              <div className="mini-feature">
                <i className="fas fa-shield-alt"></i>
                <span>Fully secured</span>
              </div>
              <div className="mini-feature">
                <i className="fas fa-gift"></i>
                <span>Member perks</span>
              </div>
            </div>

            <div className="steps-footer">
              <div className="avatar-stack">
                <span className="av av-1">A</span>
                <span className="av av-2">S</span>
                <span className="av av-3">M</span>
                <span className="av av-4">+9k</span>
              </div>
              <div>
                <p className="footer-text">Trusted by thousands</p>
                <div className="footer-stars">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <span>4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}