import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 👉 ROLE STATE
  const [role, setRole] = useState("");

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

    try {
      setLoading(true);

      const body = {
        role,
        email,
        password,
        phone,
        address,
      };

      // 👉 ROLE-BASED DATA
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
      <form className="signup-card" onSubmit={handleSignup}>
        <h2>Create Account</h2>

        {/* ✅ ROLE SELECTION */}
        <div className="role-selection">
          <label>Select Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="">-- Choose Role --</option>
            
            <option value="brand">Brand</option>
            <option value="traveler">Traveler</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* ✅ DYNAMIC NAME FIELD */}
        {role === "brand" ? (
          <input
            type="text"
            name="brandName"
            placeholder="Brand Name"
            value={formData.brandName}
            onChange={handleChange}
            required
          />
        ) : role ? (
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        ) : null}

        {/* COMMON FIELDS */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone (03001234567)"
          value={formData.phone}
          onChange={handleChange}
        />

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

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

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Signup"}
        </button>

        <p style={{ marginTop: "10px" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#08634f", cursor: "pointer", fontWeight: "bold" }}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}