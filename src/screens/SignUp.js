import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Signup.css";

export default function BrandSignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    brandName: "",
    email: "",
    phone: "",
    address: "",
    instagram: "",
    password: "",
    confirmPassword: "",
  });

  const validatePassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(pass);
  const validatePhone = (num) => /^[0]\d{10}$/.test(num);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { brandName, email, phone, address, instagram, password, confirmPassword } = formData;

    if (!brandName || !email || !phone || !address || !password) {
      return alert("Please fill all required fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    if (!validatePassword(password)) {
      return alert("Password must have 6+ characters, including uppercase, lowercase, and a number");
    }

    if (!validatePhone(phone)) {
      return alert("Phone must start with 0 and contain 11 digits");
    }

    try {
      setLoading(true);
      const body = {
        role: "brand",
        email,
        password,
        brandName,
        phone,
        address,
        instagram,
      };

      await axios.post("https://the-deft-crew-production.up.railway.app/api/auth/signup", body);
      alert("Brand account created successfully!");
      navigate("/login", { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSignup}>
        <div className="brand-header">
          <h2 className="brand-logo">PartnerHub</h2>
          <p className="subtitle">Create your brand partner account</p>
        </div>

        <div className="form-scroll-area">
          <div className="input-group">
            <label>Business Details</label>
            <input
              type="text"
              name="brandName"
              placeholder="Brand / Business Name"
              value={formData.brandName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Business Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Contact Number (e.g. 03001234567)"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Location & Social</label>
            <input
              type="text"
              name="address"
              placeholder="Business Address"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="instagram"
              placeholder="Instagram Handle (Optional)"
              value={formData.instagram}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Security</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Processing..." : "Register Brand"}
        </button>

        <p className="login-link">
          Already a partner?{" "}
          <span className="link-text" onClick={() => navigate("/login")}>
            Login to Dashboard
          </span>
        </p>
      </form>
    </div>
  );
}