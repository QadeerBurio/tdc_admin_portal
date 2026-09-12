import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/VerifyOTP.css";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const userId = location.state?.userId;
  const emailOrPhone = location.state?.emailOrPhone;

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      alert("Session expired. Please try again.");
      navigate("/forgot-password");
    }
  }, [userId, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    // Validate OTP
    if (!otp || otp.trim() === "") {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length < 4 || otp.length > 6) {
      setError("OTP should be 4-6 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/verify-otp",
        { 
          userId, 
          otp: otp.trim() 
        }
      );

      if (res.data.success) {
        alert("OTP verified successfully!");
        
        // Navigate to reset password
        navigate("/reset-password", {
          state: { 
            resetToken: res.data.resetToken,
            userId: userId
          }
        });
      } else {
        setError(res.data.message || "Invalid OTP. Please try again.");
      }

    } catch (err) {
      console.error("OTP Verification Error:", err);
      
      if (err.response) {
        setError(
          err.response.data?.message || 
          err.response.data?.error ||
          "Invalid OTP. Please check and try again."
        );
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/resend-otp",
        { 
          userId,
          emailOrPhone: emailOrPhone 
        }
      );

      if (res.data.success) {
        alert("OTP resent successfully!");
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(res.data.message || "Failed to resend OTP");
      }

    } catch (err) {
      console.error("Resend OTP Error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to resend OTP. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <form className="verify-card" onSubmit={handleVerifyOTP}>
        <h2>Verify OTP</h2>
        
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          We've sent a verification code to<br />
          <strong style={{ color: '#1a1a1a' }}>
            {emailOrPhone || 'your email/phone'}
          </strong>
        </p>

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
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => {
            // Only allow numbers
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
            if (error) setError("");
          }}
          disabled={loading}
          maxLength={6}
          autoFocus
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '20px',
            border: error ? '2px solid #ff0000' : '2px solid #ddd',
            borderRadius: '10px',
            fontSize: '18px',
            textAlign: 'center',
            letterSpacing: '8px',
            transition: 'all 0.3s ease'
          }}
        />

        <button 
          type="submit" 
          disabled={loading || !otp}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#f9c349',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: '17px',
            fontWeight: '700',
            cursor: (loading || !otp) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: (loading || !otp) ? 0.6 : 1,
            marginBottom: '15px'
          }}
          onMouseEnter={(e) => {
            if (!loading && otp) {
              e.target.style.backgroundColor = '#e8b33d';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && otp) {
              e.target.style.backgroundColor = '#f9c349';
            }
          }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px'
        }}>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={!canResend || resendLoading}
            style={{
              background: 'none',
              border: 'none',
              color: canResend ? '#f9c349' : '#999',
              fontSize: '14px',
              fontWeight: '600',
              cursor: canResend ? 'pointer' : 'not-allowed',
              textDecoration: 'underline',
              padding: '5px 0'
            }}
          >
            {resendLoading ? 'Sending...' : 
             canResend ? 'Resend OTP' : 
             `Resend in ${countdown}s`}
          </button>

          <span
            onClick={() => navigate('/forgot-password')}
            style={{
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '5px 0'
            }}
          >
            Back
          </span>
        </div>

        <p style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#999'
        }}>
          Didn't receive the code? Check your spam folder
        </p>
      </form>
    </div>
  );
}