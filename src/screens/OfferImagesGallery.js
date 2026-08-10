import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './styles/OfferImagesGallery.css';

const OfferImagesGallery = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [hoveredOffer, setHoveredOffer] = useState(null);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchAllOfferImages();
  }, []);

  const fetchAllOfferImages = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await axios.get(
        'https://the-deft-crew-production.up.railway.app/api/offers/images/all',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const validOffers = (response.data.offers || []).filter(offer => 
        offer.image && 
        offer.image !== null && 
        offer.image !== '' &&
        offer.image !== 'https://via.placeholder.com/120x120?text=Logo'
      );
      
      setOffers(validOffers);
      setError(null);
    } catch (err) {
      console.error('Error fetching offer images:', err);
      setError(err.response?.data?.message || 'Failed to load offer images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (offer) => {
    setSelectedOffer(offer);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedOffer(null);
    document.body.style.overflow = 'auto';
  };

  const handleViewAll = () => {
    setShowAllBrands(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAllBrands = () => {
    setShowAllBrands(false);
    document.body.style.overflow = 'auto';
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoScroll(false);
    const container = scrollRef.current;
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    const container = scrollRef.current;
    if (container) container.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const container = scrollRef.current;
    if (container) container.style.cursor = 'grab';
    setTimeout(() => setAutoScroll(true), 5000);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = scrollRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    if (!autoScroll || offers.length === 0 || showAllBrands) return;

    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;
      
      if (currentScroll >= maxScroll - 1) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ left: currentScroll + 1, behavior: 'smooth' });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [offers, autoScroll, showAllBrands]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Loading Amazing Offers...</p>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">😕</div>
        <p className="error-message">{error}</p>
        <button onClick={fetchAllOfferImages} className="retry-btn">
          <span className="retry-icon">⟳</span> Try Again
        </button>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon">🏷️</div>
        <h3 className="empty-title">No Brands Available</h3>
        <p className="empty-message">Check back later for exciting brands from our partner brands!</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <div className="header-content">
          <span className="header-badge">Companies and Brands</span>
          <h2 className="gallery-title">Trusted By Industries Brands</h2>
          <p className="gallery-subtitle">Partnering with top brands to create meaningful connections with students</p>
        </div>
        <div className="header-actions">
          <button className="view-all-btn" onClick={handleViewAll}>
            <span>View All</span>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="gallery-wrapper">
        <div 
          className="offers-scroll-container" 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ cursor: 'grab' }}
        >
          {offers.map((offer, index) => (
            <div 
              key={offer.offerId || index} 
              className={`offer-card ${hoveredOffer === offer.offerId ? 'hovered' : ''}`}
              onClick={() => handleImageClick(offer)}
              onMouseEnter={() => setHoveredOffer(offer.offerId)}
              onMouseLeave={() => setHoveredOffer(null)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-glow"></div>
              <div className="offer-image-wrapper">
                <img 
                  src={offer.image} 
                  alt={offer.title || 'Offer'}
                  className="offer-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/120x120?text=Logo';
                    e.target.alt = 'Image not available';
                  }}
                />
                <div className="image-ring-animation"></div>
              </div>
              <div className="offer-info">
                <h3 className="offer-title">{offer.title || 'Offer'}</h3>
                <div className="offer-meta">
                  <span className="offer-category">{offer.category || 'General'}</span>
                  <span className="offer-discount-badge">Partners</span>
                </div>
              </div>
              <div className="card-shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* All Brands Modal */}
      {showAllBrands && (
        <div className="modal-overlay" onClick={closeAllBrands}>
          <div className="modal-content all-brands-modal" onClick={(e) => e.stopPropagation()}>
            <div className="all-brands-header">
              <div className="all-brands-title-section">
                <span className="all-brands-badge">All Brands</span>
                <h2 className="all-brands-title">Our Partner Brands</h2>
                <p className="all-brands-subtitle">{offers.length} trusted brands</p>
              </div>
              <button className="modal-close all-brands-close" onClick={closeAllBrands}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="all-brands-grid">
              {offers.map((offer, index) => (
                <div 
                  key={offer.offerId || index} 
                  className="all-brand-item"
                  onClick={() => {
                    closeAllBrands();
                    handleImageClick(offer);
                  }}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="all-brand-image-wrapper">
                    <img 
                      src={offer.image} 
                      alt={offer.title || 'Brand'}
                      className="all-brand-image"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/120x120?text=Brand';
                      }}
                    />
                    
                  </div>
                  <h4 className="all-brand-name">{offer.title || 'Brand'}</h4>
                  <span className="all-brand-category">{offer.category || 'General'}</span>
                </div>
              ))}
            </div>

            <div className="all-brands-footer">
              <span className="all-brands-count">{offers.length} Brands Available</span>
            </div>
          </div>
        </div>
      )}

      {/* Single Offer Modal */}
      {selectedOffer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <div className="modal-image-container">
              <div className="modal-image-wrapper">
                <img 
                  src={selectedOffer.image} 
                  alt={selectedOffer.title || 'Offer'}
                  className="modal-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=Offer';
                  }}
                />
                <div className="modal-floating-badge">
                  <span className="badge-discount">{selectedOffer.discountPercentage || 0}% OFF</span>
                </div>
              </div>
            </div>
            
            <div className="modal-details">
              <div className="modal-category-tag">{selectedOffer.category || 'General'}</div>
              <h2 className="modal-title">{selectedOffer.title || 'Offer'}</h2>
              
              <button className="modal-action-btn">
                <span>View Brands</span>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferImagesGallery;