// Signup.jsx - No Logo Upload Version
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Signup.css";
import signupImage from "../assets/login.jpeg";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

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

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (field) => {
    setTouchedFields({ ...touchedFields, [field]: true });
    setFocusedField(null);
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const isFieldValid = (field) => {
    switch (field) {
      case "fullName":
        return role === "employee" && formData.fullName.trim().length > 0;
      case "brandName":
        return role === "brand" && formData.brandName.trim().length > 0;
      case "email":
        return validateEmail(formData.email);
      case "phone":
        return validatePhone(formData.phone);
      case "password":
        return validatePassword(formData.password);
      case "confirmPassword":
        return formData.confirmPassword === formData.password && formData.confirmPassword.length > 0;
      case "role":
        return role !== "";
      case "terms":
        return agreeTerms;
      default:
        return true;
    }
  };

  const isFieldInvalid = (field) => {
    return touchedFields[field] && !isFieldValid(field);
  };

  const getFieldError = (field) => {
    if (!touchedFields[field]) return null;
    switch (field) {
      case "fullName":
        return "Full name is required";
      case "brandName":
        return "Brand name is required";
      case "email":
        return "Please enter a valid email address";
      case "phone":
        return "Phone must be 11 digits starting with 0";
      case "password":
        return "Password must contain uppercase, lowercase, and number (6+ chars)";
      case "confirmPassword":
        return "Passwords do not match";
      case "role":
        return "Please select a role";
      case "terms":
        return "You must agree to the Terms & Conditions";
      default:
        return null;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate all fields
    const allFields = {
      role: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      terms: true,
    };

    if (role === "brand") {
      allFields.brandName = true;
    } else if (role === "employee") {
      allFields.fullName = true;
    }

    setTouchedFields(allFields);

    const errors = [];
    if (!role) errors.push("Please select a role");
    if (role === "brand" && !formData.brandName.trim()) errors.push("Brand name is required");
    if (role === "employee" && !formData.fullName.trim()) errors.push("Full name is required");
    if (!validateEmail(formData.email)) errors.push("Please enter a valid email");
    if (!validatePhone(formData.phone)) errors.push("Phone must be 11 digits starting with 0");
    if (!validatePassword(formData.password)) errors.push("Password must contain uppercase, lowercase, and number (6+ chars)");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");
    if (!agreeTerms) errors.push("Please agree to the Terms & Conditions");

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    try {
      setLoading(true);

      // Create data object (no FormData needed since no file upload)
      const data = {
        role,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address || "",
      };

      // Add role-specific fields
      if (role === "brand") {
        data.brandName = formData.brandName;
      } else if (role === "employee") {
        data.fullName = formData.fullName;
      } else {
        data.fullName = formData.fullName || "";
      }

      console.log("📤 Sending data:", {
        ...data,
        password: '[HIDDEN]'
      });

      const response = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/signup",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Signup successful:", response.data);
      alert(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
      navigate("/login");

    } catch (err) {
      console.error("❌ Signup error:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Signup failed";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
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
        <div className="signup-card">
          <div className="brand-section">
            <div className="brand-icon">
              <span className="logo-text">tdc<span className="logo-dot">.</span></span>
            </div>
            <h2 className="brand-title">The Deft <span className="brand-suffix">Crew</span></h2>
            <p className="brand-subtitle">Create your account and join the network</p>
          </div>

          <form className="signup-form" onSubmit={handleSignup} noValidate>
            {/* Role Selection */}
            <div className={`input-group ${isFieldInvalid('role') ? 'error' : ''}`}>
              <label className={focusedField === 'role' ? 'focused' : ''}>
                <i className="fas fa-user-tag"></i>
                Select Role <span className="required-star">*</span>
              </label>
              <div className="select-wrapper">
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  onFocus={() => handleFocus('role')}
                  onBlur={() => handleBlur('role')}
                  className={focusedField === 'role' ? 'focused' : ''}
                  required
                >
                  <option value="">-- Choose Your Role --</option>
                  <option value="brand">Brand</option>
                  <option value="employee">Employer</option>
                  
                </select>
                <div className="select-arrow">
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div className="input-highlight"></div>
              </div>
              {isFieldInvalid('role') && (
                <div className="error-message">{getFieldError('role')}</div>
              )}
            </div>

            {/* Name Field */}
            {role && (
              <div className={`input-group ${isFieldInvalid(role === "brand" ? 'brandName' : 'fullName') ? 'error' : ''}`}>
                <label className={focusedField === 'name' ? 'focused' : ''}>
                  <i className="fas fa-user"></i>
                  {role === "brand" ? "Brand Name" : "Full Name"}
                  <span className="required-star">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name={role === "brand" ? "brandName" : "fullName"}
                    placeholder={role === "brand" ? "Enter your brand name" : "Enter your full name"}
                    value={role === "brand" ? formData.brandName : formData.fullName}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur(role === "brand" ? 'brandName' : 'fullName')}
                    className={focusedField === 'name' ? 'focused' : ''}
                    required
                  />
                  <div className="input-highlight"></div>
                </div>
                {isFieldInvalid(role === "brand" ? 'brandName' : 'fullName') && (
                  <div className="error-message">{getFieldError(role === "brand" ? 'brandName' : 'fullName')}</div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className={`input-group ${isFieldInvalid('email') ? 'error' : ''}`}>
              <label className={focusedField === 'email' ? 'focused' : ''}>
                <i className="fas fa-envelope"></i>
                Email Address <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  className={focusedField === 'email' ? 'focused' : ''}
                  required
                />
                <div className="input-highlight"></div>
              </div>
              {isFieldInvalid('email') && (
                <div className="error-message">{getFieldError('email')}</div>
              )}
            </div>

            {/* Phone Field */}
            <div className={`input-group ${isFieldInvalid('phone') ? 'error' : ''}`}>
              <label className={focusedField === 'phone' ? 'focused' : ''}>
                <i className="fas fa-phone"></i>
                Phone Number <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  name="phone"
                  placeholder="03001234567"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => handleFocus('phone')}
                  onBlur={() => handleBlur('phone')}
                  className={focusedField === 'phone' ? 'focused' : ''}
                  required
                />
                <div className="input-highlight"></div>
              </div>
              {isFieldInvalid('phone') ? (
                <div className="error-message">{getFieldError('phone')}</div>
              ) : (
                <div className="phone-hint">
                  <i className="fas fa-info-circle"></i>
                  Must be 11 digits starting with 0 (e.g., 03001234567)
                </div>
              )}
            </div>

            {/* Address Field */}
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
                  onFocus={() => handleFocus('address')}
                  onBlur={() => handleBlur('address')}
                  className={focusedField === 'address' ? 'focused' : ''}
                />
                <div className="input-highlight"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className={`input-group ${isFieldInvalid('password') ? 'error' : ''}`}>
              <label className={focusedField === 'password' ? 'focused' : ''}>
                <i className="fas fa-lock"></i>
                Password <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
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
              {isFieldInvalid('password') ? (
                <div className="error-message">{getFieldError('password')}</div>
              ) : (
                <div className="password-hint">
                  <i className="fas fa-info-circle"></i>
                  Must contain uppercase, lowercase, and number (6+ chars)
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={`input-group ${isFieldInvalid('confirmPassword') ? 'error' : ''}`}>
              <label className={focusedField === 'confirmPassword' ? 'focused' : ''}>
                <i className="fas fa-lock"></i>
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
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
              {isFieldInvalid('confirmPassword') && (
                <div className="error-message">{getFieldError('confirmPassword')}</div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className={`terms-group ${isFieldInvalid('terms') ? 'error' : ''}`}>
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  onBlur={() => handleBlur('terms')}
                  required
                />
                <label htmlFor="terms">
                  I agree to the <span className="terms-link">Terms & Conditions</span> and 
                  <span className="terms-link"> Privacy Policy</span> <span className="required-star">*</span>
                </label>
              </div>
              {isFieldInvalid('terms') && (
                <div className="error-message">{getFieldError('terms')}</div>
              )}
            </div>

            {/* Submit Button */}
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
              <span>Already have an account?</span>
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

          <div className="trust-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Secure Registration</span>
            <span className="dot">•</span>
            <i className="fas fa-clock"></i>
            <span>Free Forever</span>
          </div>
        </div>

        <div className="signup-image-side">
          <img src={signupImage} alt="Signup" className="side-image" />
        </div>
      </div>
    </div>
  );
}