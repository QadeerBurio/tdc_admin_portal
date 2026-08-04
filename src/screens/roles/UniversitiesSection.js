// UniversitiesSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGraduationCap, 
  FaUniversity, 
  FaSearch, 
  FaMapMarkerAlt, 
  FaStar, 
  FaUsers, 
  FaGlobe,
  FaBuilding,
  FaCalendarAlt,
  FaTrophy,
  FaAward,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaSchool,
  FaLandmark,
  FaBookOpen,
  FaChartLine
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import './UniversitiesSection.css';

// Import your university logos
import szabistLogo from './szabist_logo.jpg';
import iobmLogo from './Iobm.png';
import indusLogo from './indus.jpg';
import hamdardLogo from './hamdard.png';
import ziauddinLogo from './ziaudin.jpg';
import denningLogo from './denninguni.jpg';

// Counter Component with animation
const AnimatedCounter = ({ target, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(target);
      }
    };
    requestAnimationFrame(animateCount);
  }, [isVisible, target, duration]);

  return (
    <span ref={counterRef} className="animated-counter">
      {count}{suffix}
    </span>
  );
};

const UniversitiesSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const universitiesPerPage = 20;

  const universities = [
    { 
      name: "SZABIST", 
      logo: szabistLogo, 
      color: "#1a237e",
      gradient: ["#1a237e", "#283593"],
      location: "Karachi, Pakistan",
      students: 5000,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Leading university in business and technology education",
      achievements: ["Top 10 Business School", "Research Excellence Award"],
      rating: 4.8,
      programs: 45,
      faculty: 320
    },
    { 
      name: "IoBM", 
      logo: iobmLogo, 
      color: "#004d40",
      gradient: ["#004d40", "#00695c"],
      location: "Karachi, Pakistan",
      students: 3500,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Institute of Business Management - Excellence in leadership",
      achievements: ["Best Management Institute", "Industry Partnership Award"],
      rating: 4.7,
      programs: 38,
      faculty: 280
    },
    { 
      name: "Indus", 
      logo: indusLogo, 
      color: "#1a237e",
      gradient: ["#1a237e", "#283593"],
      location: "Karachi, Pakistan",
      students: 4000,
      ranking: "Top Tier",
      type: "private",
      established: 1997,
      category: "top",
      description: "Indus University of Engineering & Technology",
      achievements: ["Engineering Excellence", "Innovation Hub"],
      rating: 4.6,
      programs: 42,
      faculty: 300
    },
    { 
      name: "Hamdard", 
      logo: hamdardLogo, 
      color: "#2e7d32",
      gradient: ["#2e7d32", "#388e3c"],
      location: "Karachi, Pakistan",
      students: 6000,
      ranking: "Top Tier",
      type: "private",
      established: 1991,
      category: "top",
      description: "Hamdard University - Excellence in Education",
      achievements: ["Top Medical University", "Research Leadership"],
      rating: 4.9,
      programs: 55,
      faculty: 450
    },
    { 
      name: "Ziauddin", 
      logo: ziauddinLogo, 
      color: "#4a148c",
      gradient: ["#4a148c", "#6a1b9a"],
      location: "Karachi, Pakistan",
      students: 2800,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Ziauddin University - Medical Sciences",
      achievements: ["Top Medical Faculty", "Healthcare Innovation"],
      rating: 4.5,
      programs: 32,
      faculty: 250
    },
    { 
      name: "Denning", 
      logo: denningLogo, 
      color: "#bf360c",
      gradient: ["#bf360c", "#d84315"],
      location: "Karachi, Pakistan",
      students: 2000,
      ranking: "Top Tier",
      type: "private",
      established: 1996,
      category: "top",
      description: "Denning College of Business & Technology",
      achievements: ["Business Leadership", "Tech Innovation"],
      rating: 4.4,
      programs: 28,
      faculty: 180
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Universities', icon: <FaUniversity />, count: universities.length },
    { id: 'top', label: 'Top Universities', icon: <FaStar />, count: universities.filter(u => u.category === 'top').length },
    { id: 'international', label: 'International', icon: <FaGlobe />, count: 0 },
  ];

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || uni.category === activeTab;
    return matchesSearch && matchesTab;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUniversities.length / universitiesPerPage);
  const indexOfLastUniversity = currentPage * universitiesPerPage;
  const indexOfFirstUniversity = indexOfLastUniversity - universitiesPerPage;
  const currentUniversities = filteredUniversities.slice(indexOfFirstUniversity, indexOfLastUniversity);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  // Calculate total stats
  const totalStudents = universities.reduce((sum, uni) => sum + uni.students, 0);
  const totalPrograms = universities.reduce((sum, uni) => sum + (uni.programs || 0), 0);
  const totalFaculty = universities.reduce((sum, uni) => sum + (uni.faculty || 0), 0);

  return (
    <section className="universities-section-modern">
      {/* Background Effects */}
      <div className="uni-bg-effects">
        <div className="uni-bg-gradient-1"></div>
        <div className="uni-bg-gradient-2"></div>
        <div className="uni-bg-gradient-3"></div>
        <div className="uni-bg-grid"></div>
        <div className="uni-bg-spotlight"></div>
      </div>

      {/* Floating Particles */}
      <div className="uni-floating-particles">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`uni-particle uni-particle-${i + 1}`}
            style={{
              animationDelay: `${i * 0.4}s`,
              width: `${2 + Math.random() * 8}px`,
              height: `${2 + Math.random() * 8}px`,
            }}
          />
        ))}
      </div>

      <div className="uni-container">
        <div className="uni-content">
          {/* Header Section */}
          <motion.div
            className="uni-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <div className="uni-badge-wrapper">
              <span className="uni-badge">
                <FaGraduationCap className="badge-icon" />
                Partner Universities Network
                <span className="badge-dot"></span>
              </span>
            </div>

            <h1 className="uni-headline">
              Pakistan's <span className="highlight-gold">Top Partner Universities</span>
            </h1>

            <p className="uni-subtitle">
              We partner with Pakistan's leading universities to bring you the 
              best talent and foster meaningful academic collaborations across 
              <span className="highlight-text"> business, technology, and medical sciences</span>.
            </p>


          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="uni-stats-row"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="uni-stat-item">
              <span className="uni-stat-number">
                <AnimatedCounter target={universities.length} />
              </span>
              <span className="uni-stat-label">Total Universities</span>
              <div className="uni-stat-bar" style={{ width: '100%' }}></div>
            </div>
            <div className="uni-stat-divider"></div>
            <div className="uni-stat-item">
              <span className="uni-stat-number">Karachi</span>
              <span className="uni-stat-label">Primary Hub</span>
              <div className="uni-stat-bar" style={{ width: '85%' }}></div>
            </div>
            <div className="uni-stat-divider"></div>
            <div className="uni-stat-item">
              <span className="uni-stat-number">
                <AnimatedCounter target={totalStudents} suffix="+" />
              </span>
              <span className="uni-stat-label">Students Connected</span>
              <div className="uni-stat-bar" style={{ width: '90%' }}></div>
            </div>
            <div className="uni-stat-divider"></div>
            <div className="uni-stat-item">
              <span className="uni-stat-number">
                <AnimatedCounter target={totalPrograms} suffix="+" />
              </span>
              <span className="uni-stat-label">Programs Offered</span>
              <div className="uni-stat-bar" style={{ width: '75%' }}></div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            className="uni-controls"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="uni-controls-top">
              <div className="uni-search-wrapper">
                <FaSearch className="uni-search-icon" />
                <input
                  className="uni-search-input"
                  placeholder="Search universities by name, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="uni-search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="uni-view-toggle">
                <button 
                  className={`uni-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                  </svg>
                </button>
                <button 
                  className={`uni-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <rect x="3" y="4" width="18" height="3" rx="1.5" fill="currentColor"/>
                    <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor"/>
                    <rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="uni-tabs-wrapper">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`uni-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="tab-count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results Info */}
          <div className="uni-results-info">
            <span>
              Showing <strong>{indexOfFirstUniversity + 1}</strong> - <strong>{Math.min(indexOfLastUniversity, filteredUniversities.length)}</strong> of <strong>{filteredUniversities.length}</strong> universities
            </span>
            {filteredUniversities.length > 0 && (
              <span className="results-badge">
                <FaChartLine />
                {filteredUniversities.length} matches found
              </span>
            )}
          </div>

          {/* Universities Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className={`uni-grid-wrapper ${viewMode === 'list' ? 'list-mode' : ''}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
            >
              <div className={`uni-grid ${viewMode === 'list' ? 'uni-list' : ''}`}>
                {currentUniversities.map((uni, index) => (
                  <motion.div
                    key={`${uni.name}-${index}`}
                    className={`university-card-modern ${hoveredCard === uni.name ? 'hovered' : ''} ${viewMode === 'list' ? 'list-card' : ''}`}
                    variants={cardVariants}
                    layout
                    onMouseEnter={() => setHoveredCard(uni.name)}
                    onMouseLeave={() => setHoveredCard(null)}
                    data-id={index}
                  >
                    {/* Card Glow Effects */}
                    <div className="card-glow-layer" style={{ 
                      background: `radial-gradient(circle at 50% 0%, ${uni.color}20, transparent 70%)` 
                    }}></div>
                    <div className="card-border-glow" style={{ borderColor: uni.color }}></div>

                    {/* Card Header */}
                    <div className="card-header">
                      <div className="card-rank-badge" style={{ background: uni.color }}>
                        <FaTrophy className="rank-icon" />
                        <span>{uni.ranking}</span>
                      </div>
                      <div className="card-rating">
                        <span className="stars">{getRatingStars(uni.rating)}</span>
                        <span className="rating-number">{uni.rating}</span>
                      </div>
                    </div>

                    {/* Logo */}
                    <div 
                      className="card-logo-wrapper" 
                      style={{ 
                        background: `linear-gradient(135deg, ${uni.gradient[0]}08, ${uni.gradient[1]}15)` 
                      }}
                    >
                      <img
                        src={uni.logo}
                        alt={uni.name}
                        className="card-logo-img"
                      />
                      <div className="logo-ring" style={{ borderColor: uni.color }}></div>
                    </div>

                    {/* Info */}
                    <div className="card-info">
                      <h3 className="card-name" style={{ color: uni.color }}>
                        {uni.name}
                      </h3>
                      <div className="card-location">
                        <MdLocationOn className="location-icon" style={{ color: uni.color }} />
                        <span>{uni.location}</span>
                      </div>
                      <p className="card-description">{uni.description}</p>
                    </div>

                    {/* Achievements */}
                    <div className="card-achievements">
                      {uni.achievements.slice(0, 2).map((achievement, i) => (
                        <span key={i} className="achievement-tag">
                          <FaAward className="achievement-icon" style={{ color: uni.color }} />
                          {achievement}
                        </span>
                      ))}
                    </div>

                    {/* Meta Data */}
                    <div className="card-meta">
                      <div className="meta-item">
                        <FaUsers className="meta-icon" style={{ color: uni.color }} />
                        <div>
                          <span className="meta-value">{uni.students.toLocaleString()}</span>
                          <span className="meta-label">Students</span>
                        </div>
                      </div>
                      <div className="meta-divider"></div>
                      <div className="meta-item">
                        <FaBuilding className="meta-icon" style={{ color: uni.color }} />
                        <div>
                          <span className="meta-value">{uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</span>
                          <span className="meta-label">Type</span>
                        </div>
                      </div>
                      <div className="meta-divider"></div>
                      <div className="meta-item">
                        <FaCalendarAlt className="meta-icon" style={{ color: uni.color }} />
                        <div>
                          <span className="meta-value">{uni.established}</span>
                          <span className="meta-label">Established</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="card-footer">
                      <span className="card-category" style={{ background: `${uni.color}15`, color: uni.color }}>
                        {uni.category.charAt(0).toUpperCase() + uni.category.slice(1)}
                      </span>
                      <button className="card-explore-btn" style={{ color: uni.color }}>
                        <span>Explore</span>
                        <FaArrowRight className="explore-arrow" />
                      </button>
                    </div>

                    {/* Hover Shimmer */}
                    <div className="card-shimmer-line"></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              className="uni-pagination"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <button 
                className={`uni-page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
                <span>Previous</span>
              </button>

              <div className="uni-page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      className={`uni-page-number ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => paginate(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button 
                className={`uni-page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                <span>Next</span>
                <FaChevronRight />
              </button>
            </motion.div>
          )}

          {/* Bottom Decoration */}
          <div className="uni-bottom-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-dots">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="decoration-text">
              <FaGraduationCap /> Empowering education through strategic partnerships
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniversitiesSection;