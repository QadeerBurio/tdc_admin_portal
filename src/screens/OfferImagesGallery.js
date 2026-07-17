import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './styles/OfferImagesGallery.css';

const OfferImagesGallery = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const scrollRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

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
        'http://localhost:5000/api/offers/images/all',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setOffers(response.data.offers || []);
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

  // Auto-scroll effect for single row
  useEffect(() => {
    const container = scrollRef.current;
    if (container && offers.length > 0) {
      const autoScroll = setInterval(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const scrollAmount = 2;
        
        if (scrollPosition >= maxScroll) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
          setScrollPosition(0);
        } else {
          const newPosition = scrollPosition + scrollAmount;
          container.scrollTo({ left: newPosition, behavior: 'smooth' });
          setScrollPosition(newPosition);
        }
      }, 30);

      return () => clearInterval(autoScroll);
    }
  }, [offers, scrollPosition]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading offers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchAllOfferImages} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-wrapper">
        {/* Single Row - All items */}
       
          <div className="offers-scroll-container" ref={scrollRef}>
            {offers.map((offer) => (
              <div 
                key={offer.offerId} 
                className="offer-card"
                onClick={() => handleImageClick(offer)}
              >
                <div className="offer-image-wrapper">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    className="offer-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/120x120?text=Logo';
                      e.target.alt = 'Image not available';
                    }}
                  />
                </div>
                <div className="offer-info">
                  <h3 className="offer-title">{offer.title}</h3>
                  <span className="offer-category">{offer.category}</span>
                </div>
              </div>
            ))}
          </div>
      </div>

      {/* Modal */}
      {selectedOffer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-image-container">
              <img 
                src={selectedOffer.image} 
                alt={selectedOffer.title}
                className="modal-image"
              />
            </div>
            <div className="modal-details">
              <h2>{selectedOffer.title}</h2>
              <div className="modal-tags">
                <span className="modal-discount">{selectedOffer.discountPercentage}% OFF</span>
                <span className="modal-category">{selectedOffer.category}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferImagesGallery;