// src/screens/BrandApprovalScreen.js
// Brand approvals (design/portal/AdBrands): review new brands, offers and QR codes, approve / reject / draft,
// and log in as an approved brand.
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import QRCode from 'qrcode';
import Ico from '../portal/Ico';
import { PageLoading, PageHeader, Button, StatCard, Segmented, Modal, EmptyState, Pill, Card, Facts, Field, Textarea, toast as kitToast } from '../portal/kit';
import './styles/Brands.css';

const API_BASE = 'https://the-deft-crew-production.up.railway.app/api';
const STATUS = {
  pending: { tone: 'orange', label: 'Pending' },
  approved: { tone: 'green', label: 'Approved' },
  rejected: { tone: 'red', label: 'Rejected' },
  draft: { tone: 'blue', label: 'Draft' },
};

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

  const isAdmin = user?.role === 'admin';

  // Show toast notification
  const showToast = (message, type = 'success') => {
    kitToast(message, type === 'error' ? 'bad' : 'ok');
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
    const config = STATUS[status] || STATUS.pending;
    return <Pill tone={config.tone} dot>{config.label}</Pill>;
  };

  const offerType = (o, long) => (o.isOnline && o.isInStore ? <Pill tone="purple">Online & In-Store</Pill>
    : o.isOnline ? <Pill tone="blue">{long ? 'Online Only' : 'Online'}</Pill>
      : o.isInStore ? <Pill tone="green">{long ? 'In-Store Only' : 'In-Store'}</Pill>
        : long ? <Pill tone="sand">Standard</Pill> : null);

  const logo = (b, cls) => (b.logo
    ? <img src={b.logo} alt={b.brandName || b.name} className={`ba-logo ${cls || ''}`} />
    : <span className={`ba-logo ph ${cls || ''}`}>{(b.brandName || b.name || 'B')[0].toUpperCase()}</span>);

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
          dark: '#111111',
          light: '#FFFFFF'
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
      <div className="tdcp k-page">
        <div className="k-card">
          <EmptyState icon="lock" tone="red" title="Access Restricted" text="This area is reserved for administrators only. Please contact support if you believe this is an error." />
        </div>
      </div>
    );
  }

  if (loading && !refreshing) {
    return <div className="tdcp k-page"><PageLoading label="Loading brands..." /></div>;
  }

  const busy = selectedBrand && processingId === selectedBrand._id;

  return (
    <div className="tdcp k-page ba" data-screen="brand-approvals">
      <PageHeader
        title="brand approvals"
        sub="review new brands before they go live in the app."
        actions={
          <Button variant="secondary" icon="refresh" loading={refreshing} onClick={() => { setRefreshing(true); fetchBrands(); }}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <div className="k-stats">
        <StatCard label="Total Brands" value={stats.total || 0} icon="store" tone="sand" />
        <StatCard label="Pending Review" value={stats.pending || 0} icon="clock" tone="orange" />
        <StatCard label="Approved" value={stats.approved || 0} icon="checkCircle" tone="green" />
        <StatCard label="Rejected" value={stats.rejected || 0} icon="xCircle" tone="red" />
        <StatCard label="Drafts" value={stats.draft || 0} icon="file" tone="blue" />
      </div>

      <Segmented
        label="status"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: stats.total > 0 ? stats.total : undefined },
          { value: 'pending', label: 'Pending', count: stats.pending > 0 ? stats.pending : undefined },
          { value: 'approved', label: 'Approved', count: stats.approved > 0 ? stats.approved : undefined },
          { value: 'rejected', label: 'Rejected', count: stats.rejected > 0 ? stats.rejected : undefined },
          { value: 'draft', label: 'Draft', count: stats.draft > 0 ? stats.draft : undefined },
        ]}
      />

      {brands.length === 0 ? (
        <div className="k-card">
          <EmptyState icon="store" tone="sand" title="No brands found" text={filter === 'all' ? 'No brands have registered yet' : `No ${filter} brands to display`} />
        </div>
      ) : (
        <div className="ba-list">
          {brands.map((brand) => (
            <button type="button" key={brand._id} className="k-card ba-card" onClick={() => handleBrandClick(brand)}>
              {logo(brand)}
              <span className="ba-info">
                <span className="ba-name">{brand.brandName || brand.name}</span>
                <span className="ba-email">{brand.email}</span>
                <Pill tone="sand">{brand.category || 'General'}</Pill>
              </span>
              <span className="ba-right">
                {getStatusBadge(brand.brandApprovalStatus)}
                <span className="ba-date">
                  {new Date(brand.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </span>
              <Ico kind="chevronRight" tone="plain" size={18} />
            </button>
          ))}
        </div>
      )}

      {/* brand detail */}
      <Modal
        open={showModal && !!selectedBrand}
        onClose={closeModal}
        size="xl"
        title={selectedBrand ? (selectedBrand.brandName || selectedBrand.name) : ''}
        sub={selectedBrand?.email}
        footer={selectedBrand ? <>
          {selectedBrand.brandApprovalStatus === 'approved' && (
            <Button
              variant="ghost"
              icon="key"
              onClick={(e) => handleAutoLogin(selectedBrand._id, e)}
              loading={autoLoginLoading}
              title="Login as this brand"
              style={{ marginRight: 'auto' }}
            >
              Login as Brand
            </Button>
          )}
          <Button variant="secondary" icon="file" loading={busy} onClick={() => handleStatusUpdate(selectedBrand._id, 'draft')}>Save as Draft</Button>
          <Button variant="danger" icon="xCircle" loading={busy} onClick={() => handleStatusUpdate(selectedBrand._id, 'rejected')}>Reject</Button>
          <Button variant="success" icon="checkCircle" loading={busy} onClick={() => handleStatusUpdate(selectedBrand._id, 'approved')}>Approve</Button>
        </> : null}
      >
        {selectedBrand && (
          loadingDetails ? (
            <PageLoading label="Loading brand details..." minHeight={240} />
          ) : (
            <>
              <div className="ba-who">
                {logo(selectedBrand, 'lg')}
                <div style={{ minWidth: 0 }}>{getStatusBadge(selectedBrand.brandApprovalStatus)}</div>
              </div>

              <div className="k-stats">
                <StatCard label="Total Offers" value={brandStats.totalOffers} icon="gift" tone="yellow" />
                <StatCard label="Active" value={brandStats.activeOffers} icon="checkCircle" tone="green" />
                <StatCard label="Total Claims" value={brandStats.totalClaims} icon="ticket" tone="blue" />
                <StatCard label="Savings" value={`rs ${brandStats.totalSavings}`} icon="coin" tone="purple" />
              </div>

              <div className="ba-grid">
                <Card title="Brand Information" icon="store" tone="purple">
                  <Facts rows={[
                    ['Brand Name', selectedBrand.brandName || selectedBrand.name],
                    ['Email', selectedBrand.email],
                    ['Phone', selectedBrand.phone || 'N/A'],
                    ['Category', selectedBrand.category || 'General'],
                    ['Address', selectedBrand.address || 'N/A'],
                    ['Website', selectedBrand.website || 'N/A'],
                  ]} />
                </Card>

                <Card title="Presence & Referrals" icon="globe" tone="blue">
                  <Facts rows={[
                    ['Online Presence', <Pill key="on" tone={selectedBrand.isOnline ? 'green' : 'red'} dot>{selectedBrand.isOnline ? 'Online' : 'Offline'}</Pill>],
                    ['In-Store', <Pill key="in" tone={selectedBrand.isInStore ? 'green' : 'red'} dot>{selectedBrand.isInStore ? 'Available' : 'Not Available'}</Pill>],
                    ['Referral Code', <code key="code" className="ba-code">{selectedBrand.referralCode || 'N/A'}</code>],
                    ['Referral Count', <span key="count" className="ba-line">{selectedBrand.referralCount || 0}{selectedBrand.referralCount >= 10 && <Ico kind="flame" tone="red" size={22} />}</span>],
                    ['Referred By', selectedBrand.referredBy?.name || 'None'],
                  ]} />
                </Card>

                <Card title={`Brand Offers (${brandOffers.length})`} icon="gift" tone="yellow" style={{ gridColumn: '1 / -1' }}>
                  {brandOffers.length > 0 ? (
                    <div className="ba-offers">
                      {brandOffers.map((offer, index) => (
                        <div key={index} className="ba-offer">
                          <div className="ba-offer-main">
                            <b>{offer.title}</b>
                            <span className="ba-ok">{offer.discountPercentage}% off</span>
                            <span className="k-hint">{offer.claimedBy?.length || 0} claims</span>
                            <Pill tone={offer.isActive !== false ? 'green' : 'red'} dot>{offer.isActive !== false ? 'Active' : 'Inactive'}</Pill>
                          </div>
                          <div className="ba-offer-side">
                            {offerType(offer, false)}
                            <Button
                              size="sm"
                              variant="secondary"
                              icon="qr"
                              loading={generatingQR && selectedOfferForQR?._id === offer._id}
                              disabled={generatingQR}
                              onClick={(e) => generateQRForOffer(offer, selectedBrand, e)}
                              title="Generate QR Code for this offer"
                            >
                              QR
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="k-hint" style={{ margin: 0 }}>No offers created yet</p>
                  )}
                </Card>

                <Card title="Timestamps" icon="calendar" tone="sand">
                  <Facts rows={[
                    ['Joined', new Date(selectedBrand.createdAt).toLocaleString()],
                    ['Last Updated', new Date(selectedBrand.updatedAt).toLocaleString()],
                    ...(selectedBrand.brandApprovedAt ? [['Approved At', new Date(selectedBrand.brandApprovedAt).toLocaleString()]] : []),
                    ...(selectedBrand.brandRejectedAt ? [['Rejected At', new Date(selectedBrand.brandRejectedAt).toLocaleString()]] : []),
                  ]} />
                </Card>

                <Card title="Admin Note" icon="edit" tone="sand">
                  <Field label="note" htmlFor="ba-note">
                    <Textarea
                      id="ba-note"
                      placeholder="Add a note about this brand (optional)..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows="3"
                    />
                  </Field>
                </Card>
              </div>
            </>
          )
        )}
      </Modal>

      {/* offer QR code */}
      <Modal
        open={showQRModal && !!qrImage && !!selectedOfferForQR}
        onClose={closeQRModal}
        icon="qr"
        tone="yellow"
        title={`QR Code - ${selectedBrand?.brandName || 'Brand'}`}
        sub={selectedOfferForQR ? `${selectedOfferForQR.title} • ${selectedOfferForQR.discountPercentage}% OFF` : undefined}
        footer={<>
          <Button variant="secondary" icon="copy" onClick={copyQRData}>{copied ? 'Copied!' : 'Copy Data'}</Button>
          <Button variant="secondary" icon="share" onClick={shareQR}>Share</Button>
          <Button icon="download" onClick={downloadQR}>Download</Button>
        </>}
      >
        {selectedOfferForQR && (
          <>
            <div className="ba-qr"><img src={qrImage} alt="QR Code" /></div>
            <div className="k-card pad" style={{ padding: '6px 18px' }}>
              <Facts rows={[
                ['Brand', selectedBrand?.brandName || selectedBrand?.name || 'Brand'],
                ['Offer', selectedOfferForQR.title],
                ['Discount', <b key="d">{selectedOfferForQR.discountPercentage}% OFF</b>],
                ['Type', offerType(selectedOfferForQR, true)],
                ...(selectedOfferForQR.promoCode ? [['Promo Code', <code key="p" className="ba-code">{selectedOfferForQR.promoCode}</code>]] : []),
              ]} />
            </div>
            <div className="k-note">
              <b>Students can scan this QR code to claim this discount</b>
              <div className="k-hint">The QR code contains all necessary information for verification</div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BrandApprovalScreen;
