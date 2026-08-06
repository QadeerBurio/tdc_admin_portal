// src/components/admin/BrandApprovalScreen.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
  X, CheckCircle, Clock, User, Mail, Phone, MapPin, Building,
  Store, Gift, QrCode, Copy, Download, Share2, Eye, ChevronRight,
  Calendar, Hash, Link2, UserPlus, Award, Sparkles, Crown,
  Flame, TrendingUp, RefreshCw, ShoppingBag, FileText,
  Briefcase, Ticket, FileCheck, Users, Layers, Zap,
  ArrowUpRight, ChevronDown, ChevronUp, BarChart3, LogIn
} from 'lucide-react';
import './styles/Brands.css';

const API_BASE = 'https://the-deft-crew-production.up.railway.app/api';

const BrandApprovalScreen = () => {
  const { token, user, login } = useContext(AuthContext);

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0
  });
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [brandOffers, setBrandOffers] = useState([]);
  const [brandStats, setBrandStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    totalClaims: 0,
    totalSavings: 0
  });
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);

  // QR Code States
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [selectedOfferForQR, setSelectedOfferForQR] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mobile responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch brands from API
  const fetchBrands = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allUrl = `${API_BASE}/brand-approval`;
      const allResponse = await axios.get(allUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (allResponse.data.success) {
        setStats(allResponse.data.stats);
        
        if (filter !== 'all') {
          const filteredUrl = `${API_BASE}/brand-approval?status=${filter}`;
          const filteredResponse = await axios.get(filteredUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (filteredResponse.data.success) {
            setBrands(filteredResponse.data.brands);
          }
        } else {
          setBrands(allResponse.data.brands);
        }
      } else {
        showToast('Failed to load brands: ' + (allResponse.data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      if (error.response?.status === 403) {
        showToast('Access Denied: You do not have permission to view this page.', 'error');
      } else if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
      } else {
        showToast('Failed to load brands: ' + (error.response?.data?.message || error.message), 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filter]);

  // Fetch brand offers and details
  const fetchBrandOffers = useCallback(async (brandId) => {
    if (!token || !brandId) return;
    
    setLoadingDetails(true);
    try {
      const url = `${API_BASE}/offers/brand/${brandId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success || Array.isArray(response.data)) {
        const offers = Array.isArray(response.data) ? response.data : response.data.offers || [];
        setBrandOffers(offers);
        
        // Calculate stats
        const activeOffers = offers.filter(o => o.isActive !== false).length;
        const totalClaims = offers.reduce((sum, o) => sum + (o.claimedBy?.length || 0), 0);
        const totalSavings = offers.reduce((sum, o) => sum + (o.totalSavings || 0), 0);
        
        setBrandStats({
          totalOffers: offers.length,
          activeOffers,
          totalClaims,
          totalSavings
        });
      }
    } catch (error) {
      console.error('Error fetching brand offers:', error);
      setBrandOffers([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      fetchBrands();
    }
  }, [isAdmin, fetchBrands]);

  // ==========================================
  // AUTO-LOGIN TO BRAND DASHBOARD - FIXED
  // ==========================================
  const handleAutoLogin = async (brandId, e) => {
    if (e) e.stopPropagation();
    
    // Make sure we have a valid token
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      showToast('You need to be logged in as admin first', 'error');
      return;
    }
    
    setAutoLoginLoading(true);
    
    try {
      console.log('Attempting auto-login for brand:', brandId);
      
      // Call the admin login endpoint for this brand
      const response = await axios.post(`${API_BASE}/auth/admin-login-as-brand`, {
        brandId: brandId
      }, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Auto-login response:', response.data);

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        const userData = response.data.user;
        
        // Store the new token and user data
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update auth context using the login function
        await login(newToken, userData);
        
        showToast(`Successfully logged in as ${userData.brandName || userData.name}`, 'success');
        
        // Redirect to brand dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/brand-dashboard';
        }, 500);
        
      } else {
        showToast('Failed to login as brand: ' + (response.data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      
      let errorMessage = 'Failed to login as brand. Please try again.';
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        if (error.response.status === 403) {
          errorMessage = 'Only admins can login as brands';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Brand is not approved yet';
        } else if (error.response.status === 404) {
          errorMessage = 'Brand not found';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setAutoLoginLoading(false);
    }
  };

  const handleStatusUpdate = async (brandId, status) => {
    setProcessingId(brandId);
    try {
      const url = `${API_BASE}/brand-approval/${brandId}/status`;
      const response = await axios.put(
        url,
        { status, note: statusNote || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowModal(false);
        setSelectedBrand(null);
        setStatusNote('');
        
        showToast(`Brand ${status.toUpperCase()} successfully!`, 'success');
        await fetchBrands();
      } else {
        showToast('Failed to update brand: ' + (response.data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      showToast(error.response?.data?.message || 'Failed to update brand status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: '#fef3c7', text: '#92400e', icon: '⏳', label: 'Pending' },
      approved: { bg: '#d1fae5', text: '#065f46', icon: '✅', label: 'Approved' },
      rejected: { bg: '#fee2e2', text: '#991b1b', icon: '❌', label: 'Rejected' },
      draft: { bg: '#e0e7ff', text: '#3730a3', icon: '📄', label: 'Draft' }
    };

    const config = configs[status] || configs.pending;

    return (
      <span className={`status-badge status-${status}`} style={{ backgroundColor: config.bg, color: config.text }}>
        {config.icon} {config.label}
      </span>
    );
  };

  const renderFilterButton = (filterKey, label, count) => (
    <button
      className={`filter-btn ${filter === filterKey ? 'active' : ''}`}
      onClick={() => setFilter(filterKey)}
    >
      {label}
      {count !== undefined && count > 0 && <span className="filter-count">{count}</span>}
    </button>
  );

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    setStatusNote(brand.brandApprovalNote || '');
    setShowModal(true);
    fetchBrandOffers(brand._id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBrand(null);
    setStatusNote('');
    setBrandOffers([]);
    setBrandStats({
      totalOffers: 0,
      activeOffers: 0,
      totalClaims: 0,
      totalSavings: 0
    });
  };

  // QR Code Functions
  const generateQRForOffer = async (offer, brandUser, e) => {
    e.stopPropagation();
    setSelectedOfferForQR(offer);
    setGeneratingQR(true);
    
    try {
      const qrPayload = {
        type: 'offer',
        offerId: offer._id,
        brandId: brandUser._id,
        brandName: brandUser.brandName || brandUser.name || 'Brand',
        offerTitle: offer.title || 'Offer',
        discount: offer.discountPercentage || 0,
        timestamp: new Date().toISOString(),
        isOnline: offer.isOnline || false,
        isInStore: offer.isInStore || false,
        promoCode: offer.promoCode || null,
        expiryDate: offer.expiryDate || null
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrImage(qrDataUrl);
      setQrData(qrPayload);
      setShowQRModal(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      showToast("Failed to generate QR code for this offer", 'error');
    } finally {
      setGeneratingQR(false);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrImage(null);
    setQrData(null);
    setSelectedOfferForQR(null);
  };

  const downloadQR = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.download = `qr-${selectedOfferForQR?.title || 'offer'}-${selectedBrand?.brandName || 'brand'}.png`;
      link.href = qrImage;
      link.click();
    }
  };

  const copyQRData = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareQR = async () => {
    if (qrImage) {
      try {
        const response = await fetch(qrImage);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: `${selectedBrand?.brandName || 'Brand'} Discount QR Code`,
            text: `Scan this QR code to get ${selectedOfferForQR?.discountPercentage || 0}% off at ${selectedBrand?.brandName || selectedBrand?.name || 'Brand'}`,
            files: [file]
          });
        } else {
          await navigator.clipboard.writeText(qrImage);
          showToast('QR code copied to clipboard!', 'success');
        }
      } catch (err) {
        console.error("Share error:", err);
      }
    }
  };

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="access-denied-container">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>This area is reserved for administrators only. Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading brands...</p>
      </div>
    );
  }

  return (
    <div className="brand-approval-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="brand-approval-header">
        <div className="header-left">
          <h1>Brand Approvals</h1>
          <p>Review and manage brand applications</p>
        </div>
        <button 
          className="refresh-btn" 
          onClick={() => { setRefreshing(true); fetchBrands(); }} 
          disabled={refreshing}
        >
          <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>⟳</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="stats-container">
        <div className="stat-card stat-total">
          <span className="stat-value">{stats.total || 0}</span>
          <span className="stat-label">Total Brands</span>
        </div>
        <div className="stat-card stat-pending">
          <span className="stat-value">{stats.pending || 0}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-card stat-approved">
          <span className="stat-value">{stats.approved || 0}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card stat-rejected">
          <span className="stat-value">{stats.rejected || 0}</span>
          <span className="stat-label">Rejected</span>
        </div>
        <div className="stat-card stat-draft">
          <span className="stat-value">{stats.draft || 0}</span>
          <span className="stat-label">Drafts</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-container">
        {renderFilterButton('all', 'All', stats.total)}
        {renderFilterButton('pending', 'Pending', stats.pending)}
        {renderFilterButton('approved', 'Approved', stats.approved)}
        {renderFilterButton('rejected', 'Rejected', stats.rejected)}
        {renderFilterButton('draft', 'Draft', stats.draft)}
      </div>

      {/* Brand List */}
      <div className="brand-list">
        {brands.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No brands found</h3>
            <p>{filter === 'all' ? 'No brands have registered yet' : `No ${filter} brands to display`}</p>
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand._id}
              className="brand-card"
              onClick={() => handleBrandClick(brand)}
            >
              <div className="brand-card-content">
                <div className="brand-logo-container">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.brandName || brand.name} className="brand-logo" />
                  ) : (
                    <div className="brand-logo-placeholder">
                      {(brand.brandName || brand.name || 'B')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="brand-info">
                  <h3 className="brand-name">{brand.brandName || brand.name}</h3>
                  <p className="brand-email">{brand.email}</p>
                  <span className="brand-category">{brand.category || 'General'}</span>
                </div>

                <div className="brand-right">
                  {getStatusBadge(brand.brandApprovalStatus)}
                  <span className="brand-date">
                    {new Date(brand.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brand Detail Modal */}
      <AnimatePresence>
        {showModal && selectedBrand && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="modal-container"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-brand-info">
                  <div className="modal-brand-logo-container">
                    {selectedBrand.logo ? (
                      <img src={selectedBrand.logo} alt={selectedBrand.brandName} className="modal-brand-logo" />
                    ) : (
                      <div className="modal-brand-logo-placeholder">
                        {(selectedBrand.brandName || selectedBrand.name || 'B')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="modal-brand-details">
                    <h2>{selectedBrand.brandName || selectedBrand.name}</h2>
                    <p className="modal-brand-email">{selectedBrand.email}</p>
                    {getStatusBadge(selectedBrand.brandApprovalStatus)}
                  </div>
                </div>
                <div className="modal-header-actions">
                  {/* Auto-Login Button - Only show for approved brands */}
                  {selectedBrand.brandApprovalStatus === 'approved' && (
                    <motion.button
                      className="auto-login-btn"
                      onClick={(e) => handleAutoLogin(selectedBrand._id, e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={autoLoginLoading}
                      title="Login as this brand"
                    >
                      {autoLoginLoading ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <>
                          <LogIn size={isMobile ? 14 : 16} />
                          <span>Login as Brand</span>
                        </>
                      )}
                    </motion.button>
                  )}
                  <button className="modal-close-btn" onClick={closeModal}>
                    <X size={isMobile ? 16 : 20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                {loadingDetails ? (
                  <div className="loading-details">
                    <div className="spinner-small"></div>
                    <p>Loading brand details...</p>
                  </div>
                ) : (
                  <>
                    {/* Quick Stats */}
                    <div className="modal-stats">
                      <div className="modal-stat">
                        <span className="modal-stat-value">{brandStats.totalOffers}</span>
                        <span className="modal-stat-label">Total Offers</span>
                      </div>
                      <div className="modal-stat-divider" />
                      <div className="modal-stat">
                        <span className="modal-stat-value">{brandStats.activeOffers}</span>
                        <span className="modal-stat-label">Active</span>
                      </div>
                      <div className="modal-stat-divider" />
                      <div className="modal-stat">
                        <span className="modal-stat-value">{brandStats.totalClaims}</span>
                        <span className="modal-stat-label">Total Claims</span>
                      </div>
                      <div className="modal-stat-divider" />
                      <div className="modal-stat">
                        <span className="modal-stat-value">${brandStats.totalSavings}</span>
                        <span className="modal-stat-label">Savings</span>
                      </div>
                    </div>

                    <div className="modal-grid">
                      {/* Brand Information */}
                      <div className="modal-section">
                        <h4 className="modal-section-title">
                          <Building size={isMobile ? 12 : 14} /> Brand Information
                        </h4>
                        <div className="modal-details">
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Brand Name</span>
                            <span className="modal-detail-value">{selectedBrand.brandName || selectedBrand.name}</span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Email</span>
                            <span className="modal-detail-value">{selectedBrand.email}</span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Phone</span>
                            <span className="modal-detail-value">{selectedBrand.phone || 'N/A'}</span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Category</span>
                            <span className="modal-detail-value">{selectedBrand.category || 'General'}</span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Address</span>
                            <span className="modal-detail-value">{selectedBrand.address || 'N/A'}</span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Website</span>
                            <span className="modal-detail-value">{selectedBrand.website || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Presence & Referral Info */}
                      <div className="modal-section">
                        <h4 className="modal-section-title">
                          <Layers size={isMobile ? 12 : 14} /> Presence & Referrals
                        </h4>
                        <div className="modal-details">
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Online Presence</span>
                            <span className="modal-detail-value">
                              <span className={`presence-tag ${selectedBrand.isOnline ? 'active' : 'inactive'}`}>
                                {selectedBrand.isOnline ? '🟢 Online' : '🔴 Offline'}
                              </span>
                            </span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">In-Store</span>
                            <span className="modal-detail-value">
                              <span className={`presence-tag ${selectedBrand.isInStore ? 'active' : 'inactive'}`}>
                                {selectedBrand.isInStore ? '🟢 Available' : '🔴 Not Available'}
                              </span>
                            </span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Referral Code</span>
                            <code className="modal-referral-code">{selectedBrand.referralCode || 'N/A'}</code>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Referral Count</span>
                            <span className="modal-detail-value">
                              <span className={`modal-referral-badge ${selectedBrand.referralCount >= 10 ? 'modal-top-referral-badge' : ''}`}>
                                {selectedBrand.referralCount || 0}
                                {selectedBrand.referralCount >= 10 && ' 🔥'}
                              </span>
                            </span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Referred By</span>
                            <span className="modal-detail-value">{selectedBrand.referredBy?.name || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Offers Section - With QR Generation */}
                      <div className="modal-section modal-section-full">
                        <h4 className="modal-section-title">
                          <Gift size={isMobile ? 12 : 14} /> Brand Offers ({brandOffers.length})
                        </h4>
                        {brandOffers.length > 0 ? (
                          <div className="offer-list">
                            {brandOffers.map((offer, index) => (
                              <div key={index} className="offer-item">
                                <div className="offer-item-left">
                                  <span className="offer-title">{offer.title}</span>
                                  <span className="offer-discount">{offer.discountPercentage}% off</span>
                                  <span className="offer-status">
                                    {offer.claimedBy?.length || 0} claims
                                  </span>
                                  <span className={`offer-active-status ${offer.isActive !== false ? 'active' : 'inactive'}`}>
                                    {offer.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                  </span>
                                </div>
                                <div className="offer-item-right">
                                  {offer.isOnline && offer.isInStore && (
                                    <span className="badge-small badge-both">Online & In-Store</span>
                                  )}
                                  {offer.isOnline && !offer.isInStore && (
                                    <span className="badge-small badge-online">Online</span>
                                  )}
                                  {!offer.isOnline && offer.isInStore && (
                                    <span className="badge-small badge-instore">In-Store</span>
                                  )}
                                  <motion.button
                                    className="qr-generate-btn"
                                    onClick={(e) => generateQRForOffer(offer, selectedBrand, e)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={generatingQR}
                                    title="Generate QR Code for this offer"
                                  >
                                    {generatingQR && selectedOfferForQR?._id === offer._id ? (
                                      <div className="spinner-small"></div>
                                    ) : (
                                      <QrCode size={isMobile ? 14 : 16} />
                                    )}
                                    <span className="qr-btn-text">QR</span>
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-offers">
                            <p>No offers created yet</p>
                          </div>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="modal-section modal-section-full">
                        <h4 className="modal-section-title">
                          <Calendar size={isMobile ? 12 : 14} /> Timestamps
                        </h4>
                        <div className="modal-details">
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Joined</span>
                            <span className="modal-detail-value">
                              {new Date(selectedBrand.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="modal-detail-row">
                            <span className="modal-detail-label">Last Updated</span>
                            <span className="modal-detail-value">
                              {new Date(selectedBrand.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          {selectedBrand.brandApprovedAt && (
                            <div className="modal-detail-row">
                              <span className="modal-detail-label">Approved At</span>
                              <span className="modal-detail-value">
                                {new Date(selectedBrand.brandApprovedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {selectedBrand.brandRejectedAt && (
                            <div className="modal-detail-row">
                              <span className="modal-detail-label">Rejected At</span>
                              <span className="modal-detail-value">
                                {new Date(selectedBrand.brandRejectedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Note */}
                      <div className="modal-section modal-section-full">
                        <h4 className="modal-section-title">
                          <FileText size={isMobile ? 12 : 14} /> Admin Note
                        </h4>
                        <textarea
                          className="note-input"
                          placeholder="Add a note about this brand (optional)..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          rows="3"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  className="action-btn action-draft"
                  onClick={() => handleStatusUpdate(selectedBrand._id, 'draft')}
                  disabled={processingId === selectedBrand._id}
                >
                  {processingId === selectedBrand._id ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    '📄 Save as Draft'
                  )}
                </button>
                <button
                  className="action-btn action-reject"
                  onClick={() => handleStatusUpdate(selectedBrand._id, 'rejected')}
                  disabled={processingId === selectedBrand._id}
                >
                  {processingId === selectedBrand._id ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    '❌ Reject'
                  )}
                </button>
                <button
                  className="action-btn action-approve"
                  onClick={() => handleStatusUpdate(selectedBrand._id, 'approved')}
                  disabled={processingId === selectedBrand._id}
                >
                  {processingId === selectedBrand._id ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    '✅ Approve'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && qrImage && selectedOfferForQR && (
          <motion.div 
            className="qr-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQRModal}
          >
            <motion.div 
              className="qr-modal-content"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="qr-modal-header">
                <div>
                  <h3 className="qr-modal-title">
                    <QrCode size={isMobile ? 16 : 20} style={{ marginRight: '8px', color: '#ff961a' }} />
                    QR Code - {selectedBrand?.brandName || 'Brand'}
                  </h3>
                  <p className="qr-modal-subtitle">
                    {selectedOfferForQR.title} • {selectedOfferForQR.discountPercentage}% OFF
                  </p>
                </div>
                <button className="qr-modal-close-btn" onClick={closeQRModal}>
                  <X size={isMobile ? 16 : 20} />
                </button>
              </div>

              <div className="qr-modal-body">
                <div className="qr-image-container">
                  <img src={qrImage} alt="QR Code" className="qr-modal-image" />
                </div>

                <div className="qr-offer-details">
                  <div className="qr-offer-row">
                    <span className="qr-offer-label">Brand:</span>
                    <span className="qr-offer-value">{selectedBrand?.brandName || selectedBrand?.name || 'Brand'}</span>
                  </div>
                  <div className="qr-offer-row">
                    <span className="qr-offer-label">Offer:</span>
                    <span className="qr-offer-value">{selectedOfferForQR.title}</span>
                  </div>
                  <div className="qr-offer-row">
                    <span className="qr-offer-label">Discount:</span>
                    <span className="qr-offer-value highlight-discount">{selectedOfferForQR.discountPercentage}% OFF</span>
                  </div>
                  <div className="qr-offer-row">
                    <span className="qr-offer-label">Type:</span>
                    <span className="qr-offer-value">
                      {selectedOfferForQR.isOnline && selectedOfferForQR.isInStore ? (
                        <span className="badge-small badge-both">Online & In-Store</span>
                      ) : selectedOfferForQR.isOnline ? (
                        <span className="badge-small badge-online">Online Only</span>
                      ) : selectedOfferForQR.isInStore ? (
                        <span className="badge-small badge-instore">In-Store Only</span>
                      ) : (
                        <span className="badge-small">Standard</span>
                      )}
                    </span>
                  </div>
                  {selectedOfferForQR.promoCode && (
                    <div className="qr-offer-row">
                      <span className="qr-offer-label">Promo Code:</span>
                      <span className="qr-offer-value promo-code">{selectedOfferForQR.promoCode}</span>
                    </div>
                  )}
                </div>

                <div className="qr-modal-actions">
                  <motion.button 
                    className="qr-action-btn qr-action-download"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadQR}
                  >
                    <Download size={isMobile ? 14 : 16} /> Download
                  </motion.button>
                  <motion.button 
                    className="qr-action-btn qr-action-share"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareQR}
                  >
                    <Share2 size={isMobile ? 14 : 16} /> Share
                  </motion.button>
                  <motion.button 
                    className="qr-action-btn qr-action-copy"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyQRData}
                  >
                    <Copy size={isMobile ? 14 : 16} /> {copied ? 'Copied!' : 'Copy Data'}
                  </motion.button>
                </div>

                <div className="qr-scan-instructions">
                  <p className="qr-scan-text">📱 Students can scan this QR code to claim this discount</p>
                  <p className="qr-scan-subtext">The QR code contains all necessary information for verification</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandApprovalScreen;