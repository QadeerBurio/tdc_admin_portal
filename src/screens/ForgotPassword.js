import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    // Validate input
    if (!emailOrPhone || emailOrPhone.trim() === "") {
      setError("Please enter your email or phone number");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/forgot-password",
        { emailOrPhone: emailOrPhone.trim() }
      );

      if (res.data.success) {
        alert(res.data.message || "OTP sent successfully!");
        
        // Navigate to OTP verification with user ID
        navigate("/verify-otp", {
          state: { 
            userId: res.data.userId,
            emailOrPhone: emailOrPhone.trim()
          }
        });
      } else {
        setError(res.data.message || "Failed to send OTP");
      }

    } catch (err) {
      console.error("Forgot Password Error:", err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error
        setError(
          err.response.data?.message || 
          err.response.data?.error ||
          "Server error. Please try again."
        );
      } else if (err.request) {
        // Request made but no response
        setError("Network error. Please check your connection.");
      } else {
        // Something else happened
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <form className="forgot-card" onSubmit={handleSendOTP}>
        <h2>Forgot Password</h2>
        
        {error && (
          <div className="error-message" style={{
            color: '#ff0000',
            fontSize: '14px',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffeeee',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter Email or Phone"
          value={emailOrPhone}
          onChange={(e) => {
            setEmailOrPhone(e.target.value);
            // Clear error when user starts typing
            if (error) setError("");
          }}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            transition: 'border-color 0.3s'
          }}
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f9c349', // Yellow background
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#e8b33d';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#f9c349';
            }
          }}
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>

        <p style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <span 
            onClick={() => navigate('/login')}
            style={{
              color: '#f9c349',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Login
          </span>
        </p>
      </form>
    </div>
  );
}