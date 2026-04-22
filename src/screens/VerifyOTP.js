import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/VerifyOTP.css";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userId = location.state?.userId;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/verify-otp",
        { userId, otp }
      );

      alert("OTP verified");

      navigate("/reset-password", {
        state: { resetToken: res.data.resetToken }
      });

    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <form className="verify-card" onSubmit={handleVerifyOTP}>

        <h2>Verify OTP</h2>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </form>
    </div>
  );
}
