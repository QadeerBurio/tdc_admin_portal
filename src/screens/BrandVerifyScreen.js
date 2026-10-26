// screens/BrandVerifyScreen.js - Brand Promo Code Verification (ReactJS)
// Online side of verify student (design/portal/BrVerify): the student shares a promo code from the tdc app.
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Ico from '../portal/Ico';
import { Button, Field, Input, Select, StatCard, EmptyState, Pill, Facts, confirmDialog } from '../portal/kit';
import './styles/BrandPortal.css';

// API Base URL - Change this to your backend URL
const API_BASE_URL = 'https://the-deft-crew-production.up.railway.app/api';

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

    if (await confirmDialog('Are you sure you want to confirm this redemption?')) {
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

  if (user?.role !== 'brand') {
    return (
      <div className="tdcp k-page" data-screen="brand-promo">
        <div className="k-card">
          <EmptyState
            icon="lock"
            tone="red"
            title="Access Denied: Only brands can access this screen"
            action={<Button variant="secondary" icon="chevronLeft" onClick={() => navigate(-1)}>Go Back</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tdcp k-page" data-screen="brand-promo">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="ticket" tone="orange" size={56} />
          <div>
            <h1>verify promo code<span className="dot" aria-hidden="true">.</span></h1>
            <p>for online orders. the student shares the promo code from the tdc app.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button variant="secondary" icon="chevronLeft" onClick={() => navigate(-1)}>back</Button>
        </div>
      </div>

      {stats && (
        <div className="k-stats">
          <StatCard label="Active Codes" value={stats.activeCodes} icon="ticket" tone="orange" />
          <StatCard label="Used Today" value={stats.usedCodes} icon="check" tone="green" />
          <StatCard label="Total Savings" value={`Rs. ${stats.totalSavings || 0}`} icon="coin" tone="blue" />
        </div>
      )}

      <div className="bv-grid">
        <section className="k-card bv-pane">
          <h2 className="br-h2">Enter Promo Code</h2>

          {error && (
            <div className="k-note bad" role="alert" onClick={() => setError(null)}>
              {error}
            </div>
          )}
          {success && (
            <div className="k-note ok" role="status" onClick={() => setSuccess(null)}>
              {success}
            </div>
          )}

          <form className="bo-form" onSubmit={(e) => e.preventDefault()}>
            <Field label="Promo code" htmlFor="bp-code">
              <Input
                id="bp-code"
                type="text"
                placeholder="Enter promo code (e.g. ZIN123456)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
            </Field>
            <Field label="Bill amount (PKR)" htmlFor="bp-bill">
              <Input
                id="bp-bill"
                type="number"
                placeholder="Enter bill amount"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </Field>
            <Field label="Offer" htmlFor="bp-offer">
              <Select
                id="bp-offer"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
              >
                {offers.map((offer) => (
                  <option key={offer._id} value={offer._id}>
                    {offer.title} ({offer.discountPercentage}% OFF)
                  </option>
                ))}
              </Select>
            </Field>
            <div className="k-row">
              <Button
                icon="check"
                onClick={handleVerify}
                loading={verifying}
                disabled={verifying || !promoCode.trim()}
              >
                {verifying ? 'Verifying...' : 'Verify Promo Code'}
              </Button>
              <Button variant="secondary" onClick={handleClear}>
                Clear All
              </Button>
            </div>
          </form>
        </section>

        {showResult && verificationResult ? (
          <section className="k-card bv-pane">
            <div className="bb-chips">
              <Pill tone="green" dot>Verified!</Pill>
            </div>
            <p className="k-hint">Promo code is valid and ready to use</p>
            <h3 className="bp-sub">Student Information</h3>
            <Facts rows={[
              ['name', verificationResult.student.name],
              ['email', verificationResult.student.email],
              ['university', verificationResult.student.university],
            ]} />
            <h3 className="bp-sub">Offer Details</h3>
            <Facts rows={[
              ['offer', verificationResult.offer.title],
              ['discount', `${verificationResult.offer.discountPercentage}% OFF`],
            ]} />
            <div className="bv-sum">
              <div className="bv-sum-head"><span>Transaction</span></div>
              <div className="bv-row"><span>Bill Amount:</span><span>Rs. {verificationResult.transaction.billAmount}</span></div>
              <div className="bv-row off"><span>Savings:</span><span>- Rs. {verificationResult.transaction.savedAmount}</span></div>
              <div className="bv-row total"><span>Final Amount:</span><span>Rs. {verificationResult.transaction.finalAmount}</span></div>
            </div>
            <div className="k-row">
              <Button icon="check" onClick={handleConfirmRedemption}>Confirm Redemption</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResult(false);
                  setVerificationResult(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </section>
        ) : (
          <section className="k-card bv-pane">
            <EmptyState icon="ticket" tone="orange" title="no code checked yet" text="enter the code, the bill and the offer, then press verify." />
          </section>
        )}
      </div>
    </div>
  );
};

export default BrandVerifyScreen;
