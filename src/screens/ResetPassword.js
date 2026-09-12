import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/ResetPassword.css";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const resetToken = location.state?.resetToken;
  const userId = location.state?.userId;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  // Redirect if no resetToken
  useEffect(() => {
    if (!resetToken) {
      alert("Session expired. Please try again.");
      navigate("/forgot-password");
    }
  }, [resetToken, navigate]);

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) return "";
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[a-z]/)) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^a-zA-Z0-9]/)) score++;
    
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    if (error) setError("");
  };

  const validatePassword = (pass) => {
    const errors = [];
    
    if (pass.length < 8) {
      errors.push("at least 8 characters");
    }
    if (!/[a-z]/.test(pass)) {
      errors.push("a lowercase letter");
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push("an uppercase letter");
    }
    if (!/[0-9]/.test(pass)) {
      errors.push("a number");
    }
    if (!/[^a-zA-Z0-9]/.test(pass)) {
      errors.push("a special character");
    }
    
    return errors;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validate fields
    if (!password || password.trim() === "") {
      setError("Please enter a new password");
      return;
    }

    if (!confirmPassword || confirmPassword.trim() === "") {
      setError("Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password strength validation
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError(`Password must contain: ${errors.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/auth/reset-password",
        { 
          resetToken, 
          newPassword: password,
          userId: userId
        }
      );

      if (res.data.success) {
        alert("Password reset successfully! Please login with your new password.");
        navigate("/login");
      } else {
        setError(res.data.message || "Failed to reset password");
      }

    } catch (err) {
      console.error("Reset Password Error:", err);
      
      if (err.response) {
        setError(
          err.response.data?.message || 
          err.response.data?.error ||
          "Failed to reset password. Please try again."
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

  return (
    <div className="reset-container">
      <form className="reset-card" onSubmit={handleResetPassword}>
        <h2>Reset Password</h2>

        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          Create a new password for your account
        </p>

        {error && (
          <div className="error-message" style={{
            color: '#ff0000',
            fontSize: '14px',
            marginBottom: '15px',
            padding: '12px',
            backgroundColor: '#ffeeee',
            borderRadius: '8px',
            textAlign: 'center',
            borderLeft: '4px solid #ff0000'
          }}>
            {error}
          </div>
        )}

        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={loading}
            className={error ? "error" : ""}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '10px',
              border: error ? '2px solid #ff0000' : '2px solid #ddd',
              borderRadius: '10px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              paddingRight: '45px'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '18px'
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {password && (
          <div style={{
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '13px',
              color: passwordStrength === 'Weak' ? '#ff0000' : 
                     passwordStrength === 'Medium' ? '#f9c349' : '#00b894'
            }}>
              Strength: {passwordStrength}
            </span>
            <div style={{
              display: 'flex',
              gap: '5px'
            }}>
              <div style={{
                width: '30px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: passwordStrength === 'Weak' ? '#ff0000' : 
                               passwordStrength === 'Medium' ? '#f9c349' : '#00b894',
                transition: 'background-color 0.3s ease'
              }} />
              <div style={{
                width: '30px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: passwordStrength === 'Weak' ? '#ddd' : 
                               passwordStrength === 'Medium' ? '#f9c349' : '#00b894',
                transition: 'background-color 0.3s ease'
              }} />
              <div style={{
                width: '30px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: passwordStrength === 'Strong' ? '#00b894' : '#ddd',
                transition: 'background-color 0.3s ease'
              }} />
            </div>
          </div>
        )}

        <div className="password-input-wrapper" style={{ marginTop: '5px' }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '20px',
              border: '2px solid #ddd',
              borderRadius: '10px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              paddingRight: '45px'
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '18px'
            }}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading || !password || !confirmPassword}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#f9c349',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: '17px',
            fontWeight: '700',
            cursor: (loading || !password || !confirmPassword) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: (loading || !password || !confirmPassword) ? 0.6 : 1,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '15px'
          }}
          onMouseEnter={(e) => {
            if (!loading && password && confirmPassword) {
              e.target.style.backgroundColor = '#e8b33d';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && password && confirmPassword) {
              e.target.style.backgroundColor = '#f9c349';
            }
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginTop: '10px'
        }}>
          <span
            onClick={() => navigate('/forgot-password')}
            style={{
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Forgot Password
          </span>
        </div>

        <p style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#999'
        }}>
          Password must contain at least 8 characters,<br />
          one uppercase, one lowercase, one number, and one special character
        </p>
      </form>
    </div>
  );
}