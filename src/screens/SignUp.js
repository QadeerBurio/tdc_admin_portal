// Signup.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Signup.css";
import signupImage from "../assets/login.jpeg"; // Make sure you have this image

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    brandName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const validatePassword = (pass) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(pass);

  const validatePhone = (num) => /^[0]\d{10}$/.test(num);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!role) return alert("Please select a role");

    const { fullName, brandName, email, phone, address, password, confirmPassword } = formData;

    if (!email || !password) {
      return alert("Please fill required fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    if (!validatePassword(password)) {
      return alert("Password must contain uppercase, lowercase, number (6+ chars)");
    }

    if (phone && !validatePhone(phone)) {
      return alert("Phone must be 11 digits starting with 0");
    }

    if (!agreeTerms) {
      return alert("Please agree to the Terms & Conditions");
    }

    try {
      setLoading(true);

      const body = {
        role,
        email,
        password,
        phone,
        address,
      };

      if (role === "brand") {
        if (!brandName) return alert("Brand name required");
        body.brandName = brandName;
      } else {
        if (!fullName) return alert("Full name required");
        body.fullName = fullName;
      }

      await axios.post(
        "http://localhost:5000/api/auth/signup",
        body
      );

      alert(`${role} account created successfully`);
      navigate("/login");

    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Background Effects */}
      <div className="signup-bg-effects">
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

      <div className="signup-wrapper">
        {/* Form Side - Left */}
        <div className="signup-card">
          {/* Brand Section - Logo TDC matching Signin */}
          <div className="brand-section">
            <div className="brand-icon">
              <span className="logo-text">tdc<span className="logo-dot">.</span></span>
            </div>
            <h2 className="brand-title">The Deft <span className="brand-suffix">Crew</span></h2>
            <p className="brand-subtitle">Create your account and join the network</p>
          </div>

          <form className="signup-form" onSubmit={handleSignup}>
            {/* Role Selection */}
            <div className="input-group">
              <label className={focusedField === 'role' ? 'focused' : ''}>
                <i className="fas fa-user-tag"></i>
                Select Role
              </label>
              <div className="select-wrapper">
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  onFocus={() => setFocusedField('role')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'role' ? 'focused' : ''}
                  required
                >
                  <option value="">-- Choose Your Role --</option>
                  <option value="brand">🏢 Brand</option>
                  <option value="traveler">✈️ Traveler</option>
                  <option value="employee">👨‍💼 Employee</option>
                </select>
                <div className="select-arrow">
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Dynamic Name Field */}
            {role && (
              <div className="input-group">
                <label className={focusedField === 'name' ? 'focused' : ''}>
                  <i className="fas fa-user"></i>
                  {role === "brand" ? "Brand Name" : "Full Name"}
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name={role === "brand" ? "brandName" : "fullName"}
                    placeholder={role === "brand" ? "Enter your brand name" : "Enter your full name"}
                    value={role === "brand" ? formData.brandName : formData.fullName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={focusedField === 'name' ? 'focused' : ''}
                    required
                  />
                  <div className="input-highlight"></div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="input-group">
              <label className={focusedField === 'email' ? 'focused' : ''}>
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'email' ? 'focused' : ''}
                  required
                />
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Phone */}
            <div className="input-group">
              <label className={focusedField === 'phone' ? 'focused' : ''}>
                <i className="fas fa-phone"></i>
                Phone Number
              </label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  name="phone"
                  placeholder="03001234567"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'phone' ? 'focused' : ''}
                />
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Address */}
            <div className="input-group">
              <label className={focusedField === 'address' ? 'focused' : ''}>
                <i className="fas fa-map-marker-alt"></i>
                Address
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="address"
                  placeholder="Your location"
                  value={formData.address}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'address' ? 'focused' : ''}
                />
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className={focusedField === 'password' ? 'focused' : ''}>
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'password' ? 'focused' : ''}
                  required
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
              <div className="password-hint">
                <i className="fas fa-info-circle"></i>
                Must contain uppercase, lowercase, and number (6+ chars)
              </div>
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className={focusedField === 'confirmPassword' ? 'focused' : ''}>
                <i className="fas fa-lock"></i>
                Confirm Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === 'confirmPassword' ? 'focused' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="terms-group">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  I agree to the <span className="terms-link">Terms & Conditions</span> and 
                  <span className="terms-link"> Privacy Policy</span>
                </label>
              </div>
            </div>

            <button
              className="signup-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </span>
              ) : (
                <span>
                  Create Account <i className="fas fa-arrow-right"></i>
                </span>
              )}
            </button>

            <div className="divider">
              <span>already have an account?</span>
            </div>

            <div className="login-redirect">
              <span 
                className="login-link" 
                onClick={() => navigate("/login")}
              >
                Sign In <i className="fas fa-arrow-right"></i>
              </span>
            </div>
          </form>

          {/* Trust Badge */}
          <div className="trust-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Secure Registration</span>
            <span className="dot">•</span>
            <i className="fas fa-clock"></i>
            <span>Free Forever</span>
          </div>
        </div>

        {/* Image Side - Right */}
        <div className="signup-image-side">
          <img src={signupImage} alt="Signup" className="side-image" />
          
        </div>
      </div>
    </div>
  );
}