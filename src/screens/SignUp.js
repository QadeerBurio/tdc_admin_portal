// Signup.jsx — Compact Form LEFT + Steps RIGHT (Mobile Fixed Footer)
import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./styles/Signup.css";
import signupImage from "../assets/login1.jpeg";

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala",
  "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta",
  "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana",
  "Chiniot", "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan",
];

export default function Signup() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [error, setError] = useState("");
  const [stepsOpen, setStepsOpen] = useState(false);

  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const cityInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "", brandName: "", email: "", phone: "",
    password: "", confirmPassword: "", city: "",
  });

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return PAKISTAN_CITIES;
    const q = citySearch.toLowerCase().trim();
    return PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setStepsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      document.body.style.overflow = stepsOpen ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [stepsOpen]);

  const validatePassword = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(p);
  const validatePhone = (n) => /^[0]\d{10}$/.test(n);
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleBlur = (field) => {
    setTouchedFields({ ...touchedFields, [field]: true });
    setFocusedField(null);
  };

  const handleFocus = (field) => {
    setFocusedField(field);
    setError("");
  };

  const handleSelectCity = (city) => {
    setFormData((prev) => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
    setTouchedFields((prev) => ({ ...prev, city: true }));
  };

  const isFieldValid = (field) => {
    switch (field) {
      case "fullName": return role === "employee" && formData.fullName.trim().length > 0;
      case "brandName": return role === "brand" && formData.brandName.trim().length > 0;
      case "email": return validateEmail(formData.email);
      case "phone": return validatePhone(formData.phone);
      case "password": return validatePassword(formData.password);
      case "confirmPassword": return formData.confirmPassword === formData.password && formData.confirmPassword.length > 0;
      case "role": return role !== "";
      case "terms": return agreeTerms;
      case "city": return true;
      default: return true;
    }
  };

  const isFieldInvalid = (field) => touchedFields[field] && !isFieldValid(field);

  const getFieldError = (field) => {
    if (!touchedFields[field]) return null;
    switch (field) {
      case "fullName": return "Full name is required";
      case "brandName": return "Brand name is required";
      case "email": return "Enter a valid email";
      case "phone": return "Must be 11 digits (starts with 0)";
      case "password": return "Uppercase, lowercase & number (6+)";
      case "confirmPassword": return "Passwords do not match";
      case "role": return "Select a role to continue";
      case "terms": return "Please accept the terms";
      default: return null;
    }
  };

  const autoLogin = async (email, password) => {
    try {
      const res = await axios.post("https://the-deft-crew-production.up.railway.app/api/auth/login", { email, password });
      const { token, user } = res.data;
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Auto-login failed" };
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const allFields = {
      role: true, email: true, phone: true,
      password: true, confirmPassword: true, terms: true, city: true,
    };
    if (role === "brand") allFields.brandName = true;
    else if (role === "employee") allFields.fullName = true;
    setTouchedFields(allFields);

    const errors = [];
    if (!role) errors.push("Please select a role");
    if (role === "brand" && !formData.brandName.trim()) errors.push("Brand name is required");
    if (role === "employee" && !formData.fullName.trim()) errors.push("Company name is required");
    if (!validateEmail(formData.email)) errors.push("Please enter a valid email");
    if (!validatePhone(formData.phone)) errors.push("Phone must be 11 digits starting with 0");
    if (!validatePassword(formData.password)) errors.push("Password must contain uppercase, lowercase, and number (6+ chars)");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");
    if (!agreeTerms) errors.push("Please agree to the Terms & Conditions");

    if (errors.length > 0) {
      setError(errors.join("\n"));
      return;
    }

    try {
      setLoading(true);
      const finalCity = formData.city?.trim() || "Karachi";

      const data = {
        role, email: formData.email, password: formData.password,
        phone: formData.phone, city: finalCity,
      };

      if (role === "brand") data.brandName = formData.brandName;
      else if (role === "employee") data.fullName = formData.fullName;
      else data.fullName = formData.fullName || "";

      await axios.post("https://the-deft-crew-production.up.railway.app/api/auth/signup", data, {
        headers: { "Content-Type": "application/json" },
      });

      const loginResult = await autoLogin(formData.email, formData.password);

      if (loginResult.success) {
        const { user } = loginResult;
        if (user.role === "admin") navigate("/admin");
        else if (user.role === "brand") navigate("/discount");
        else if (user.role === "employee") navigate("/employee-dashboard");
        else if (user.role === "traveler") navigate("/traveler-dashboard");
        else navigate("/home");
      } else {
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} account created! Please login.`);
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Background layers */}
      <div className="bg-image-layer">
        <img src={signupImage} alt="" className="bg-image" />
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
      <div className="signup-layout">
        {/* LEFT: Form Card */}
        <div className="form-side">
          <div className="form-card">
            <div className="form-head">
              <div className="brand-mark">
                <span>tdc<span className="dot">.</span></span>
              </div>
              <div className="head-text">
                <h2>Create Account</h2>
                <p>Join thousands of members today</p>
              </div>
            </div>

            {error && (
              <div className="alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form className="signup-form" onSubmit={handleSignup} noValidate>
              {/* Role Pills */}
              <div className={`field ${isFieldInvalid("role") ? "field-error" : ""}`}>
                <span className="field-label">I am a</span>
                <div className="role-pills">
                  <button
                    type="button"
                    className={`role-pill ${role === "brand" ? "active" : ""}`}
                    onClick={() => { setRole("brand"); setTouchedFields(t => ({ ...t, role: true })); }}
                  >
                    <i className="fas fa-store"></i>
                    <span>Brand</span>
                  </button>
                  <button
                    type="button"
                    className={`role-pill ${role === "employee" ? "active" : ""}`}
                    onClick={() => { setRole("employee"); setTouchedFields(t => ({ ...t, role: true })); }}
                  >
                    <i className="fas fa-briefcase"></i>
                    <span>Employer</span>
                  </button>
                </div>
                {isFieldInvalid("role") && <span className="err">{getFieldError("role")}</span>}
              </div>

              {/* Name */}
              {role && (
                <div className={`field floating ${focusedField === "name" || (role === "brand" ? formData.brandName : formData.fullName) ? "has-value" : ""} ${isFieldInvalid(role === "brand" ? "brandName" : "fullName") ? "field-error" : ""}`}>
                  <input
                    type="text"
                    name={role === "brand" ? "brandName" : "fullName"}
                    placeholder=" "
                    value={role === "brand" ? formData.brandName : formData.fullName}
                    onChange={handleChange}
                    onFocus={() => handleFocus("name")}
                    onBlur={() => handleBlur(role === "brand" ? "brandName" : "fullName")}
                    required
                  />
                  <label>{role === "brand" ? "Brand Name" : "Company Name"}</label>
                  <i className="field-icon fas fa-building"></i>
                  {isFieldInvalid(role === "brand" ? "brandName" : "fullName") && (
                    <span className="err">{getFieldError(role === "brand" ? "brandName" : "fullName")}</span>
                  )}
                </div>
              )}

              {/* Email */}
              <div className={`field floating ${focusedField === "email" || formData.email ? "has-value" : ""} ${isFieldInvalid("email") ? "field-error" : ""}`}>
                <input
                  type="email" name="email" placeholder=" "
                  value={formData.email} onChange={handleChange}
                  onFocus={() => handleFocus("email")} onBlur={() => handleBlur("email")} required
                />
                <label>Email Address</label>
                <i className="field-icon fas fa-envelope"></i>
                {isFieldInvalid("email") && <span className="err">{getFieldError("email")}</span>}
              </div>

              {/* Phone */}
              <div className={`field floating ${focusedField === "phone" || formData.phone ? "has-value" : ""} ${isFieldInvalid("phone") ? "field-error" : ""}`}>
                <input
                  type="tel" name="phone" placeholder=" "
                  value={formData.phone} onChange={handleChange}
                  onFocus={() => handleFocus("phone")} onBlur={() => handleBlur("phone")} required
                />
                <label>Phone Number</label>
                <i className="field-icon fas fa-phone"></i>
                {isFieldInvalid("phone") && <span className="err">{getFieldError("phone")}</span>}
              </div>

              {/* City */}
              <div
                className={`field floating ${focusedField === "city" || citySearch ? "has-value" : ""}`}
                ref={cityDropdownRef}
              >
                <input
                  ref={cityInputRef}
                  type="text" name="city" placeholder=" "
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                    if (e.target.value !== formData.city) setFormData((prev) => ({ ...prev, city: "" }));
                  }}
                  onFocus={() => { handleFocus("city"); setShowCityDropdown(true); }}
                  onBlur={() => setTimeout(() => setFocusedField(null), 150)}
                  autoComplete="off"
                />
                <label>City <span className="opt">(default: Karachi)</span></label>
                <i className="field-icon fas fa-map-marker-alt"></i>
                {formData.city && (
                  <button
                    type="button" className="clear-btn"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, city: "" }));
                      setCitySearch("");
                      cityInputRef.current?.focus();
                    }}
                    tabIndex={-1}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                {showCityDropdown && (
                  <div className="city-list">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <div
                          key={city}
                          className={`city-row ${formData.city === city ? "on" : ""}`}
                          onMouseDown={(e) => { e.preventDefault(); handleSelectCity(city); }}
                        >
                          <i className="fas fa-map-pin"></i>
                          <span>{city}</span>
                          {formData.city === city && <i className="fas fa-check tick"></i>}
                        </div>
                      ))
                    ) : (
                      <div className="city-empty">
                        <i className="fas fa-search"></i>
                        <span>No match</span>
                        <small>Karachi will be used</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className={`field floating ${focusedField === "password" || formData.password ? "has-value" : ""} ${isFieldInvalid("password") ? "field-error" : ""}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" placeholder=" "
                  value={formData.password} onChange={handleChange}
                  onFocus={() => handleFocus("password")} onBlur={() => handleBlur("password")} required
                />
                <label>Password</label>
                <i className="field-icon fas fa-lock"></i>
                <button
                  type="button" className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
                {isFieldInvalid("password") && <span className="err">{getFieldError("password")}</span>}
              </div>

              {/* Confirm Password */}
              <div className={`field floating ${focusedField === "confirmPassword" || formData.confirmPassword ? "has-value" : ""} ${isFieldInvalid("confirmPassword") ? "field-error" : ""}`}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword" placeholder=" "
                  value={formData.confirmPassword} onChange={handleChange}
                  onFocus={() => handleFocus("confirmPassword")} onBlur={() => handleBlur("confirmPassword")} required
                />
                <label>Confirm Password</label>
                <i className="field-icon fas fa-lock"></i>
                <button
                  type="button" className="eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
                {isFieldInvalid("confirmPassword") && <span className="err">{getFieldError("confirmPassword")}</span>}
              </div>

              {/* Terms */}
              <label className={`terms ${isFieldInvalid("terms") ? "field-error" : ""}`}>
                <input
                  type="checkbox" checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  onBlur={() => handleBlur("terms")}
                />
                <span className="checkmark"></span>
                <span className="terms-text">
                  I agree to <a href="#terms">Terms</a> & <a href="#privacy">Privacy</a>
                </span>
              </label>

              {/* Submit */}
              <button className="submit-btn" type="submit" disabled={loading}>
                <span className="btn-glow"></span>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>

              <p className="bottom-link">
                Already have an account?{" "}
                <a onClick={() => navigate("/login")}>Sign In</a>
              </p>
            </form>

            <div className="trust-row">
              <i className="fas fa-shield-alt"></i>
              <span>Secured · Free Forever</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Modern Steps — Collapsible on Mobile */}
        <div className={`steps-side ${stepsOpen ? "steps-open" : ""}`}>
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
                <strong>How it works</strong>
                <small>Your journey in 3 steps</small>
              </span>
            </span>
            <span className={`toggle-chevron ${stepsOpen ? "open" : ""}`}>
              <i className="fas fa-chevron-down"></i>
            </span>
          </button>

          <div className="steps-content">
            <h1 className="steps-title">
              Your journey <br />
              <span className="steps-accent">in 3 steps</span>
            </h1>

            <p className="steps-subtitle">
              Get started in under a minute. Everything you need to launch your presence on tdc.
            </p>

            <div className="steps-list">
              <div className="step-item" data-step="1">
                <div className="step-number">
                  <span>01</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                  <h3 style={{color:'white'}}>Create your account</h3>
                  <p style={{color:'#a9a2a2'}}>Pick your role and fill in basic details. Takes just 30 seconds.</p>
                </div>
              </div>

              <div className="step-divider"></div>

              <div className="step-item" data-step="2">
                <div className="step-number">
                  <span>02</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                   <h3 style={{color:'white'}}>Offer Exclusive Discounts</h3>
    <p style={{color:'#a9a2a2'}}>Create attractive student offers and drive more customers to your business.</p>
                </div>
              </div>

              <div className="step-divider"></div>

              <div className="step-item" data-step="3">
                <div className="step-number">
                  <span>03</span>
                  <div className="step-ring"></div>
                </div>
                <div className="step-content">
                  <h3 style={{color:'white'}}>Connect with Students & Grow Revenue</h3>
    <p style={{color:'#a9a2a2'}}>Reach more students, build loyal customers, and turn offers into revenue.</p>
                </div>
              </div>
            </div>

            <div className="steps-features">
              <div className="mini-feature">
                <i className="fas fa-bolt"></i>
                <span>Instant setup</span>
              </div>
              <div className="mini-feature">
                <i className="fas fa-shield-alt"></i>
                <span>Fully secured</span>
              </div>
              <div className="mini-feature">
                <i className="fas fa-gift"></i>
                <span>Free perks</span>
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