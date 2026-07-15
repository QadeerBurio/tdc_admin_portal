// SignIn.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./styles/SignIn.css";
// Import the image from assets
import loginImage from "../assets/login.jpeg";

export default function SignIn() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
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
        alert("Access Denied");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToken(token);
      setUser(user);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "brand") {
        navigate("/home");
      } else if (user.role === "employee") {
        navigate("/employee-dashboard");
      } else if (user.role === "traveler") {
        navigate("/traveler-dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      {/* Background Effects */}
      <div className="signin-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="particle" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`
              }}
            />
          ))}
        </div>
      </div>

      <div className="signin-wrapper">
        {/* Form Side - Left */}
        <div className="signin-card">
          {/* Brand Section - Logo TDC */}
          <div className="brand-section">
            <div className="image-brand-icon">
              <p>tdc<span style={{color:'#f9c349'}}>.</span></p>
            </div>
            <h2 className="brand-title">The Deft <span className="brand-suffix">Crew</span></h2>
            <p className="brand-subtitle">Manage your brand presence & offers</p>
          </div>

          <form className="signin-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email" className={focusedField === 'email' ? 'focused' : ''}>
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="brand@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={focusedField === 'email' ? 'focused' : ''}
                />
                <div className="input-highlight"></div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password" className={focusedField === 'password' ? 'focused' : ''}>
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={focusedField === 'password' ? 'focused' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
                <div className="input-highlight"></div>
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </button>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  Verifying...
                </span>
              ) : (
                <span>
                  Sign In <i className="fas fa-arrow-right"></i>
                </span>
              )}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <div className="signup-redirect">
              <p>
                New brand?{" "}
                <span 
                  className="signup-link" 
                  onClick={() => navigate("/signup")}
                >
                  Create an account
                  <i className="fas fa-arrow-right"></i>
                </span>
              </p>
            </div>
          </form>

          {/* Trust Badge */}
          <div className="trust-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Secure & Encrypted</span>
            <span className="dot">•</span>
            <i className="fas fa-clock"></i>
            <span>24/7 Support</span>
          </div>
        </div>

        {/* Image Side - Right */}
        <div className="signin-image-side">
          <img src={loginImage} alt="Login" className="side-image" />
          
        </div>
      </div>
    </div>
  );
}