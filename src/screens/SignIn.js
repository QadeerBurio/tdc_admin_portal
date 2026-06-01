import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Added Link
import { AuthContext } from "../context/AuthContext";
import "./styles/SignIn.css";

export default function SignIn() {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      const { token, user } = res.data;

      // Allow only Brand and Admin
      const allowedRoles = ["brand", "admin", "employee", "traveler"];

if (!allowedRoles.includes(user.role)) {
  alert("Access Denied");
  return;
}

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToken(token);
      setUser(user);

      // Redirect based on role
       if (user.role === "admin") {
  navigate("/admin");
} 
else if (user.role === "brand") {
  navigate("/home");
}
else if (user.role === "employee") {
  navigate("/employee-dashboard");
}
else if (user.role === "traveler") {
  navigate("/traveler-dashboard");
}
else {
  navigate("/home"); // student fallback
}
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-card" onSubmit={handleLogin}>
        <div className="brand-logo-section">
          <h2 style={{ color: "#08634f" }}>PartnerHub</h2>
          <p className="subtitle">Manage your brand presence & offers</p>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="brand@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-footer-links">
          <div className="forgot">
            <span onClick={() => navigate("/forgot-password")}>
              Forgot Password?
            </span>
          </div>
        </div>

        <button
          className="login-btn"
          type="submit"
          disabled={loading}
          style={{ background: "#08634f", marginTop: "10px" }}
        >
          {loading ? "Verifying..." : "Login"}
        </button>

        {/* New Brand Signup Section */}
        <div className="signup-redirect">
          <p>
            New brand?{" "}
            <span 
              className="signup-link" 
              onClick={() => navigate("/signup")}
              style={{ color: "#08634f", cursor: "pointer", fontWeight: "bold" }}
            >
              Create an account
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}