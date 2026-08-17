// screens/BrandVerifyScreen.js - Brand Promo Code Verification (ReactJS)
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft,
  FaTicketAlt,
  FaMoneyBillWave,
  FaTag,
  FaUser,
  FaEnvelope,
  FaUniversity,
  FaPercent,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

// API Base URL - Change this to your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BrandVerifyScreen = () => {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  // State
  const [promoCode, setPromoCode] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [offerId, setOfferId] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load brand's offers
  useEffect(() => {
    loadBrandOffers();
    loadStats();
  }, []);

  // Check if user is brand
  useEffect(() => {
    if (user?.role !== 'brand') {
      setError('Access Denied: Only brands can access this screen');
    }
  }, [user]);

  // Fetch with authentication
  const fetchWithAuth = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
  };

  const loadBrandOffers = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/offers/my-offers');
      setOffers(data);
      if (data.length > 0) {
        setOfferId(data[0]._id);
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchWithAuth('/promo-codes/brand-stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleVerify = async () => {
    // Reset states
    setError(null);
    setSuccess(null);
    setVerificationResult(null);
    setShowResult(false);

    // Validation
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }
    if (!billAmount || parseFloat(billAmount) <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }
    if (!offerId) {
      setError('Please select an offer');
      return;
    }

    setVerifying(true);

    try {
      const data = await fetchWithAuth('/promo-codes/brand-verify', {
        method: 'POST',
        body: JSON.stringify({
          promoCode: promoCode.trim(),
          offerId: offerId,
          billAmount: parseFloat(billAmount),
        }),
      });

      if (data.success) {
        setVerificationResult(data.data);
        setShowResult(true);
        setSuccess('Promo code verified successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify promo code');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!verificationResult) return;

    if (window.confirm('Are you sure you want to confirm this redemption?')) {
      try {
        const data = await fetchWithAuth('/promo-codes/confirm-redemption', {
          method: 'POST',
          body: JSON.stringify({
            promoCode: promoCode.trim(),
            offerId: offerId,
            billAmount: parseFloat(billAmount),
          }),
        });

        if (data.success) {
          setSuccess(
            `✅ Redemption Confirmed! Student saved Rs. ${data.data.transaction.savedAmount}`
          );
          // Reset form
          setPromoCode('');
          setBillAmount('');
          setVerificationResult(null);
          setShowResult(false);
          loadStats();
        }
      } catch (err) {
        setError(err.message || 'Failed to confirm redemption');
      }
    }
  };

  const handleClear = () => {
    setPromoCode('');
    setBillAmount('');
    setVerificationResult(null);
    setShowResult(false);
    setError(null);
    setSuccess(null);
  };

  // Animation variants
  const resultVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  };

  if (user?.role !== 'brand') {
    return (
      <div style={styles.container}>
        <div style={styles.alertDanger}>
          <FaTimesCircle style={{ marginRight: '8px' }} />
          Access Denied: Only brands can access this screen
        </div>
        <button style={styles.buttonSecondary} onClick={() => navigate(-1)}>
          <FaChevronLeft style={{ marginRight: '8px' }} /> Go Back
        </button>
        <style>{stylesGlobal}</style>
      </div>
    );
  }

  return (
    <div style={styles.brandVerifyScreen}>
      <div style={styles.containerFluid}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <FaChevronLeft size={24} />
          </button>
          <h4 style={styles.headerTitle}>Verify Promo Code</h4>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={styles.statsRow}>
            <div style={styles.statsCard}>
              <div style={styles.statsCardBody}>
                <h3 style={styles.statsValue}>{stats.activeCodes}</h3>
                <small style={styles.statsLabel}>Active Codes</small>
              </div>
            </div>
            <div style={styles.statsCard}>
              <div style={styles.statsCardBody}>
                <h3 style={styles.statsValue}>{stats.usedCodes}</h3>
                <small style={styles.statsLabel}>Used Today</small>
              </div>
            </div>
            <div style={styles.statsCard}>
              <div style={styles.statsCardBody}>
                <h3 style={styles.statsValue}>Rs. {stats.totalSavings || 0}</h3>
                <small style={styles.statsLabel}>Total Savings</small>
              </div>
            </div>
          </div>
        )}

        {/* Verification Form */}
        <div style={styles.formCard}>
          <div style={styles.formCardBody}>
            <h5 style={styles.formTitle}>Enter Promo Code</h5>

            {error && (
              <div style={styles.alertDanger} onClick={() => setError(null)}>
                {error}
              </div>
            )}
            {success && (
              <div style={styles.alertSuccess} onClick={() => setSuccess(null)}>
                {success}
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
              <div style={styles.formGroup}>
                <div style={styles.inputGroup}>
                  <span style={styles.inputGroupText}>
                    <FaTicketAlt style={styles.iconMuted} />
                  </span>
                  <input
                    type="text"
                    style={styles.formControl}
                    placeholder="Enter promo code (e.g. ZIN123456)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                  />
                  {promoCode && (
                    <button
                      style={styles.inputClearButton}
                      onClick={() => setPromoCode('')}
                    >
                      <FaTimesCircle />
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <div style={styles.inputGroup}>
                  <span style={styles.inputGroupText}>
                    <FaMoneyBillWave style={styles.iconMuted} />
                  </span>
                  <input
                    type="number"
                    style={styles.formControl}
                    placeholder="Enter bill amount"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <div style={styles.inputGroup}>
                  <span style={styles.inputGroupText}>
                    <FaTag style={styles.iconMuted} />
                  </span>
                  <select
                    style={styles.formSelect}
                    value={offerId}
                    onChange={(e) => setOfferId(e.target.value)}
                  >
                    {offers.map((offer) => (
                      <option key={offer._id} value={offer._id}>
                        {offer.title} ({offer.discountPercentage}% OFF)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  style={{
                    ...styles.buttonWarning,
                    opacity: verifying || !promoCode.trim() ? 0.6 : 1,
                    cursor: verifying || !promoCode.trim() ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleVerify}
                  disabled={verifying || !promoCode.trim()}
                >
                  {verifying ? (
                    <>
                      <span style={styles.spinner}></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle style={{ marginRight: '8px' }} /> Verify Promo Code
                    </>
                  )}
                </button>
                <button style={styles.buttonOutline} onClick={handleClear}>
                  Clear All
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Verification Result */}
        <AnimatePresence>
          {showResult && verificationResult && (
            <motion.div
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <FaCheckCircle size={40} style={{ marginBottom: '8px' }} />
                  <h4 style={styles.resultTitle}>Verified! ✅</h4>
                  <p style={styles.resultSubtitle}>Promo code is valid and ready to use</p>
                </div>
                <div style={styles.resultBody}>
                  {/* Student Info */}
                  <div style={styles.resultSection}>
                    <h6 style={styles.resultSectionTitle}>Student Information</h6>
                    <div style={styles.listGroup}>
                      <div style={styles.listItem}>
                        <FaUser style={styles.listIcon} />{' '}
                        {verificationResult.student.name}
                      </div>
                      <div style={styles.listItem}>
                        <FaEnvelope style={styles.listIcon} />{' '}
                        {verificationResult.student.email}
                      </div>
                      <div style={styles.listItem}>
                        <FaUniversity style={styles.listIcon} />{' '}
                        {verificationResult.student.university}
                      </div>
                    </div>
                  </div>

                  {/* Offer Info */}
                  <div style={{ ...styles.resultSection, marginTop: '16px' }}>
                    <h6 style={styles.resultSectionTitle}>Offer Details</h6>
                    <div style={styles.listGroup}>
                      <div style={styles.listItem}>
                        <FaTag style={styles.listIcon} />{' '}
                        {verificationResult.offer.title}
                      </div>
                      <div style={styles.listItem}>
                        <FaPercent style={styles.listIcon} />{' '}
                        {verificationResult.offer.discountPercentage}% OFF
                      </div>
                    </div>
                  </div>

                  {/* Transaction */}
                  <div style={{ ...styles.resultSection, marginTop: '16px' }}>
                    <h6 style={styles.resultSectionTitle}>Transaction</h6>
                    <div style={styles.transactionDetails}>
                      <div style={styles.transactionRow}>
                        <span style={styles.textMuted}>Bill Amount:</span>
                        <span>Rs. {verificationResult.transaction.billAmount}</span>
                      </div>
                      <div style={styles.savingsRow}>
                        <span style={styles.textMuted}>Savings:</span>
                        <span style={styles.savingsText}>
                          - Rs. {verificationResult.transaction.savedAmount}
                        </span>
                      </div>
                      <div style={styles.finalRow}>
                        <span style={styles.finalText}>Final Amount:</span>
                        <span style={styles.finalAmount}>
                          Rs. {verificationResult.transaction.finalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={styles.resultActions}>
                    <button
                      style={styles.confirmButton}
                      onClick={handleConfirmRedemption}
                    >
                      <FaCheckCircle style={{ marginRight: '8px' }} /> Confirm Redemption
                    </button>
                    <button
                      style={styles.cancelButton}
                      onClick={() => {
                        setShowResult(false);
                        setVerificationResult(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{stylesGlobal}</style>
    </div>
  );
};

// Styles
const stylesGlobal = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f2f4f8;
  }
`;

const styles = {
  // Container
  container: {
    padding: '48px 0',
    maxWidth: '1200px',
    margin: '0 auto',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  containerFluid: {
    padding: '24px 16px',
    maxWidth: '720px',
    margin: '0 auto',
  },
  brandVerifyScreen: {
    backgroundColor: '#f2f4f8',
    minHeight: '100vh',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backButton: {
    padding: '0',
    marginRight: '16px',
    background: 'none',
    border: 'none',
    color: '#0a0a0a',
    cursor: 'pointer',
  },
  headerTitle: {
    marginBottom: '0',
    fontWeight: '700',
    fontSize: '1.25rem',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  statsCardHover: {
    transform: 'translateY(-2px)',
  },
  statsCardBody: {
    padding: '12px',
    textAlign: 'center',
  },
  statsValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f9c349',
    marginBottom: '0',
  },
  statsLabel: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: '500',
  },

  // Form Card
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '24px',
  },
  formCardBody: {
    padding: '20px',
  },
  formTitle: {
    fontWeight: '700',
    marginBottom: '16px',
    fontSize: '1rem',
  },

  // Alerts
  alertDanger: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },

  // Form Elements
  formGroup: {
    marginBottom: '12px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  inputGroupText: {
    padding: '0 12px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    borderRight: '1px solid rgba(0,0,0,0.05)',
  },
  iconMuted: {
    color: '#9ca3af',
  },
  formControl: {
    flex: '1',
    height: '48px',
    padding: '0 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    color: '#0a0a0a',
    outline: 'none',
  },
  formSelect: {
    flex: '1',
    height: '48px',
    padding: '0 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    color: '#0a0a0a',
    outline: 'none',
    cursor: 'pointer',
  },
  inputClearButton: {
    padding: '4px 12px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },

  // Buttons
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  buttonWarning: {
    flex: '1',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #f9c349, #f5a623)',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    color: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  buttonWarningHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(249, 195, 73, 0.4)',
  },
  buttonOutline: {
    padding: '12px 20px',
    background: 'transparent',
    border: '1px solid #6b7280',
    borderRadius: '12px',
    color: '#6b7280',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },

  // Spinner
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '8px',
  },

  // Result Card
  resultCard: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    backgroundColor: '#ffffff',
    marginTop: '16px',
  },
  resultHeader: {
    padding: '20px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: '0',
    fontSize: '1.25rem',
  },
  resultSubtitle: {
    marginBottom: '0',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.875rem',
  },
  resultBody: {
    padding: '16px',
  },
  resultSection: {
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    paddingBottom: '12px',
    marginBottom: '12px',
  },
  resultSectionTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '0.875rem',
    color: '#0a0a0a',
  },
  listGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  listItem: {
    padding: '6px 0',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  listIcon: {
    color: '#9ca3af',
    marginRight: '8px',
  },
  transactionDetails: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
  },
  transactionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  textMuted: {
    color: '#6b7280',
  },
  savingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '6px',
    marginTop: '4px',
  },
  savingsText: {
    fontWeight: '600',
    color: '#10b981',
  },
  finalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0 4px 0',
    marginTop: '4px',
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
  finalText: {
    fontWeight: '600',
    color: '#0a0a0a',
    fontSize: '1rem',
  },
  finalAmount: {
    fontWeight: '700',
    fontSize: '1.125rem',
    color: '#0a0a0a',
  },
  resultActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  confirmButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #f9c349, #f5a623)',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    color: '#0a0a0a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
  },
  cancelButton: {
    padding: '10px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

// Add global animation keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default BrandVerifyScreen;