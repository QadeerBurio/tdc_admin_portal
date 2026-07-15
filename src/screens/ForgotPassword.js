import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/ForgotPassword.css";

export default function ForgotPassword() {

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!emailOrPhone) {
      alert("Enter email or phone");
      return;
    }

    try {

      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/forgot-password",
        { emailOrPhone }
      );

      alert(res.data.message);

      navigate("/verify-otp", {
        state: { userId: res.data.userId }
      });

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Something went wrong"
      );

    }
  };

  return (

    <div className="forgot-container">

      <form
        className="forgot-card"
        onSubmit={handleSendOTP}
      >

        <h2>Forgot Password</h2>

        <input
          type="text"
          placeholder="Enter Email or Phone"
          value={emailOrPhone}
          onChange={(e) =>
            setEmailOrPhone(e.target.value)
          }
        />

        <button type="submit">
          Send OTP
        </button>

      </form>

    </div>

  );
}
