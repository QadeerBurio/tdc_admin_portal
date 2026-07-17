// HomeReviews.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar, FaApple, FaGooglePlay } from 'react-icons/fa';
import './HomeReviews.css';

const HomeReviews = () => {
  const appId = '6765877675';
  const country = 'pk';
  const limit = 3;
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const [appleReviews, googleReviews] = await Promise.all([
          fetchAppleReviews(),
          fetchGooglePlayReviews()
        ]);

        const allReviews = [...appleReviews, ...googleReviews];
        const sortedReviews = allReviews.sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        );

        setReviews(sortedReviews.slice(0, 3));

      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Unable to load reviews.');
      } finally {
        setLoading(false);
      }
    };

    const fetchAppleReviews = async () => {
      try {
        const feedUrl = `https://itunes.apple.com/pk/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`;
        const response = await fetch(feedUrl);

        if (!response.ok) return [];

        const data = await response.json();
        const feed = data.feed;

        if (!feed || !feed.entry) return [];

        return feed.entry
          .filter(entry => entry['im:rating'] !== undefined)
          .map(entry => ({
            id: entry.id?.label || `apple-${Date.now()}-${Math.random()}`,
            title: entry.title?.label || '',
            content: entry.content?.label || '',
            rating: parseInt(entry['im:rating']?.label || 0, 10),
            author: entry.author?.name?.label || 'Anonymous',
            version: entry['im:version']?.label || 'N/A',
            date: entry.updated?.label || new Date().toISOString(),
            store: 'apple',
            storeIcon: '🍎'
          }));
      } catch (err) {
        console.error('Error fetching Apple reviews:', err);
        return [];
      }
    };

    const fetchGooglePlayReviews = async () => {
      try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const url = `https://play.google.com/store/apps/details?id=com.aqkhan110.tdc&hl=en&gl=PK&showAllReviews=true`;

        const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch Google Play page');
        }

        const html = await response.text();
        const reviews = extractRealReviewsFromHTML(html);

        if (reviews.length === 0) {
          return await fetchGooglePlayReviewsAlternative();
        }

        return reviews;

      } catch (err) {
        console.error('Error fetching Google Play reviews:', err);
        return await fetchGooglePlayReviewsAlternative();
      }
    };

    const fetchGooglePlayReviewsAlternative = async () => {
      try {
        const response = await fetch(
          `https://play-store-scraper.herokuapp.com/reviews/com.aqkhan110.tdc?limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.reviews && data.reviews.length > 0) {
            return data.reviews.map((review, index) => ({
              id: `google-${index}-${Date.now()}`,
              title: review.title || review.text?.substring(0, 50) || 'Google Play Review',
              content: review.text || review.comment || '',
              rating: review.starRating || review.rating || 5,
              author: review.userName || review.author || 'Google Play User',
              version: review.appVersion || 'N/A',
              date: review.date || review.timestamp || new Date().toISOString(),
              store: 'google',
              storeIcon: '▶️'
            }));
          }
        }

        return [];

      } catch (err) {
        console.error('All Google Play fetch methods failed:', err);
        return [];
      }
    };

    const extractRealReviewsFromHTML = (html) => {
      try {
        const reviews = [];

        const reviewRegex = /<div[^>]*data-review-id="[^"]*"[^>]*data-rating="(\d)"[^>]*>/gi;
        let match;
        let reviewIndex = 0;

        while ((match = reviewRegex.exec(html)) !== null && reviewIndex < 5) {
          const rating = parseInt(match[1]);

          const contentRegex = /<span[^>]*jsname="bN97Pc"[^>]*>([\s\S]*?)<\/span>/g;
          let contentMatch;
          let content = '';
          let found = false;

          while ((contentMatch = contentRegex.exec(html.substring(match.index))) !== null) {
            if (contentMatch[1].trim()) {
              content = contentMatch[1].trim();
              found = true;
              break;
            }
          }

          if (found) {
            reviews.push({
              id: `google-html-${reviewIndex}-${Date.now()}`,
              title: content.substring(0, 50),
              content: content,
              rating: rating,
              author: 'Google Play User',
              version: 'N/A',
              date: new Date().toISOString(),
              store: 'google',
              storeIcon: '▶️'
            });
            reviewIndex++;
          }
        }

        return reviews;

      } catch (err) {
        console.error('Error extracting reviews from HTML:', err);
        return [];
      }
    };

    fetchReviews();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="review-stars">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="star-filled" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="star-filled" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="star-empty" />
        ))}
      </div>
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStoreColor = (store) => {
    return store === 'apple' ? '#007aff' : '#34a853';
  };

  const getStoreName = (store) => {
    return store === 'apple' ? 'App Store' : 'Google Play';
  };

  const getStoreIcon = (store) => {
    return store === 'apple' ? <FaApple /> : <FaGooglePlay />;
  };

  const handleViewAllClick = () => {
    navigate('/AppStoreReviews');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  if (loading) {
    return (
      <section className="home-reviews-section">
        <div className="container">
          <div className="home-reviews-loading">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && reviews.length === 0) {
    return null;
  }

  return (
    <motion.section 
      className="home-reviews-section"
      id="reviews-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      <div className="container">
        <motion.div className="home-reviews-container">
          {/* Section Header */}
          <motion.div 
            className="section-header"
            variants={itemVariants}
            custom={0}
          >
            
            <h2 className="section-title">
              What Our <span className="highlight-text">Users Say</span>
            </h2>
            <p className="section-subtitle">
              Real reviews from real users about their experience with The Deft Crew app
            </p>
          </motion.div>

          {/* Reviews Grid */}
          <motion.div 
            className="reviews-grid"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id || index}
                className="review-card"
                variants={itemVariants}
                custom={index}
                whileHover={{
                  y: -8,
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
                  borderColor: getStoreColor(review.store),
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Store Badge */}
                <div className="review-store-badge" style={{ background: getStoreColor(review.store) }}>
                  {getStoreIcon(review.store)}
                  <span>{getStoreName(review.store)}</span>
                </div>

                {/* Card Header */}
                <div className="review-card-header">
                  <div 
                    className="user-avatar" 
                    style={{ 
                      background: `linear-gradient(135deg, ${getStoreColor(review.store)}, ${getStoreColor(review.store)}dd)` 
                    }}
                  >
                    {getInitials(review.author)}
                  </div>
                  <div className="review-meta">
                    <div className="review-author">{review.author}</div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                      <span className="rating-number">{review.rating}.0</span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                {review.title && (
                  <div className="review-title">{review.title}</div>
                )}
                
                <div className="review-content">
                  "{review.content.length > 110
                    ? `${review.content.substring(0, 110)}...`
                    : review.content}"
                </div>

                {/* Card Footer */}
                <div className="review-card-footer">
                  <span className="review-date">{formatDate(review.date)}</span>
                  <span className="review-version">v{review.version}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* View All Button */}
          <motion.div 
            className="view-all-container"
            variants={itemVariants}
            custom={3}
          >
            <motion.button 
              className="view-all-button"
              onClick={handleViewAllClick}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span>View All Reviews</span>
              <svg className="arrow-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/>
              </svg>
            </motion.button>
            <p className="view-all-subtext">
              See what everyone is saying about The Deft Crew app
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HomeReviews;