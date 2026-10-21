// SignUp.js — partner sign up (brand or employer). Same validation, payload and auto-login as before, new tdc design.
import React, { useState, useContext, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Logo, pageTitle, IconTile, ICONS } from "../web/site";

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala",
  "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta",
  "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana",
  "Chiniot", "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan",
];

const API = "https://the-deft-crew-production.up.railway.app/api";

export default function Signup() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "", brandName: "", email: "", phone: "",
    password: "", confirmPassword: "", city: "",
  });

  // City: searchable list as on the old page (empty = Karachi when the form is sent)
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const cityInputRef = useRef(null);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return PAKISTAN_CITIES;
    const q = citySearch.toLowerCase().trim();
    return PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (city) => {
    setFormData((prev) => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
    setTouchedFields((prev) => ({ ...prev, city: true }));
  };

  useEffect(() => {
    document.title = pageTitle("partner sign up");
  }, []);

  const validatePassword = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(p);
  const validatePhone = (n) => /^[0]\d{10}$/.test(n);
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const touch = (field) => setTouchedFields((t) => ({ ...t, [field]: true }));

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
      default: return true;
    }
  };

  const isFieldInvalid = (field) => touchedFields[field] && !isFieldValid(field);

  const FIELD_ERRORS = {
    fullName: "company name is required",
    brandName: "brand name is required",
    email: "enter a valid email",
    phone: "11 digits, starting with 0",
    password: "use upper and lower case letters and a number (6+ characters)",
    confirmPassword: "passwords don't match",
    role: "pick brand or employer to continue",
    terms: "please accept the terms",
  };

  const errorFor = (field) => (isFieldInvalid(field) ? <span className="field-error" id={`${field}-err`}>{FIELD_ERRORS[field]}</span> : null);

  const autoLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
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
    if (!role) errors.push("please pick brand or employer");
    if (role === "brand" && !formData.brandName.trim()) errors.push("brand name is required");
    if (role === "employee" && !formData.fullName.trim()) errors.push("company name is required");
    if (!validateEmail(formData.email)) errors.push("please enter a valid email");
    if (!validatePhone(formData.phone)) errors.push("phone must be 11 digits starting with 0");
    if (!validatePassword(formData.password)) errors.push("password needs upper and lower case letters and a number (6+ characters)");
    if (formData.password !== formData.confirmPassword) errors.push("passwords don't match");
    if (!agreeTerms) errors.push("please agree to the terms");

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

      await axios.post(`${API}/auth/signup`, data, {
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
        alert(`${role === "brand" ? "Brand" : "Employer"} account created! Please log in.`);
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "sign up failed. please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nameField = role === "brand" ? "brandName" : "fullName";

  return (
    <div className="tdcw">
      <div className="split">
        <div className="split-form">
          <Logo />
          <form className="form-col" onSubmit={handleSignup} noValidate>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 40, letterSpacing: -1.2, lineHeight: 1.05 }}>partner with tdc<span className="dot">.</span></h1>
              <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>takes about a minute. we'll review and get you live.</p>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="field">
              <span className="label" id="role-label">i'm signing up as</span>
              <div className={`seg ${isFieldInvalid("role") ? "invalid" : ""}`} role="group" aria-labelledby="role-label">
                <button type="button" aria-pressed={role === "brand"} onClick={() => { setRole("brand"); touch("role"); }}>a brand</button>
                <button type="button" aria-pressed={role === "employee"} onClick={() => { setRole("employee"); touch("role"); }}>an employer</button>
              </div>
              {errorFor("role")}
            </div>

            {role && (
              <div className="field">
                <label htmlFor={nameField}>{role === "brand" ? "brand name" : "company name"}</label>
                <input
                  id={nameField}
                  name={nameField}
                  className={`input ${isFieldInvalid(nameField) ? "invalid" : ""}`}
                  value={role === "brand" ? formData.brandName : formData.fullName}
                  onChange={handleChange}
                  onBlur={() => touch(nameField)}
                  placeholder={role === "brand" ? "e.g. Dear Croissant" : "e.g. your company"}
                  autoComplete="organization"
                />
                {errorFor(nameField)}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">email</label>
              <input id="email" name="email" type="email" className={`input ${isFieldInvalid("email") ? "invalid" : ""}`} value={formData.email} onChange={handleChange} onBlur={() => touch("email")} placeholder="you@yourbrand.com" autoComplete="email" />
              {errorFor("email")}
            </div>

            <div className="field">
              <label htmlFor="phone">phone</label>
              <input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={11} className={`input ${isFieldInvalid("phone") ? "invalid" : ""}`} value={formData.phone} onChange={handleChange} onBlur={() => touch("phone")} placeholder="03XXXXXXXXX" autoComplete="tel" />
              {errorFor("phone")}
            </div>

            <div className="field city-field" ref={cityDropdownRef}>
              <label htmlFor="city">city <span className="muted" style={{ fontWeight: 500 }}>(default: Karachi)</span></label>
              <div className="city-input">
                <input
                  ref={cityInputRef}
                  id="city" name="city" type="text" className="input" autoComplete="off"
                  placeholder="search your city"
                  role="combobox" aria-expanded={showCityDropdown} aria-controls="city-list" aria-autocomplete="list"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                    if (e.target.value !== formData.city) setFormData((prev) => ({ ...prev, city: "" }));
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowCityDropdown(false);
                    if (e.key === "Enter" && showCityDropdown && filteredCities.length) { e.preventDefault(); handleSelectCity(filteredCities[0]); }
                  }}
                />
                {formData.city && (
                  <button
                    type="button" className="city-clear" aria-label="clear city"
                    onClick={() => { setFormData((prev) => ({ ...prev, city: "" })); setCitySearch(""); cityInputRef.current?.focus(); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                )}
              </div>
              {showCityDropdown && (
                <div className="city-list" id="city-list" role="listbox" aria-label="cities">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={city}
                        role="option" aria-selected={formData.city === city}
                        className={`city-row ${formData.city === city ? "on" : ""}`}
                        onMouseDown={(e) => { e.preventDefault(); handleSelectCity(city); }}
                      >
                        <span>{city}</span>
                        {formData.city === city && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="city-empty">no match. Karachi will be used.</div>
                  )}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="password">password</label>
              <div className="pw-wrap">
                <input id="password" name="password" type={showPassword ? "text" : "password"} className={`input ${isFieldInvalid("password") ? "invalid" : ""}`} value={formData.password} onChange={handleChange} onBlur={() => touch("password")} placeholder="6+ characters, Aa and a number" autoComplete="new-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "hide password" : "show password"}>
                  {showPassword ? "hide" : "show"}
                </button>
              </div>
              {errorFor("password")}
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} className={`input ${isFieldInvalid("confirmPassword") ? "invalid" : ""}`} value={formData.confirmPassword} onChange={handleChange} onBlur={() => touch("confirmPassword")} placeholder="type it again" autoComplete="new-password" />
              {errorFor("confirmPassword")}
            </div>

            <div className="field">
              <label className="check">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => { setAgreeTerms(e.target.checked); touch("terms"); }} />
                <span>I agree to the Terms and Privacy Policy</span>
              </label>
              {errorFor("terms")}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (<><span className="spinner" aria-hidden="true" /> creating your account</>) : "create account"}
            </button>

            <p className="muted" style={{ textAlign: "center", fontSize: 15 }}>
              already a partner? <Link to="/login" style={{ fontWeight: 700 }}>log in</Link>
            </p>
          </form>
        </div>

        <aside className="split-aside on-dark">
          <div style={{ maxWidth: 500 }}>
            <div className="eyebrow">what you get</div>
            <h2 style={{ marginTop: 12, fontWeight: 800, fontSize: 44, letterSpacing: -1.3, lineHeight: 1.05 }}>live on tdc in 3 steps<span className="dot">.</span></h2>
            <ol>
              <li><IconTile d={ICONS.userPlus} n={1} /><div><b>create your account</b><span>pick brand or employer and add your basic details.</span></div></li>
              <li><IconTile d={ICONS.percent} n={2} /><div><b>set your student offer</b><span>brands: a flat discount from 15% to 60%. employers: post your first role.</span></div></li>
              <li><IconTile d={ICONS.chart} n={3} /><div><b>track it in your portal</b><span>see every claim or applicant live, and which institutes they come from.</span></div></li>
            </ol>
            <div className="aside-chips">
              <span>free in year one</span>
              <span>100+ brands already live</span>
              <span>exit anytime, 15 days notice</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
