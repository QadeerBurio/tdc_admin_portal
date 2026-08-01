// UniversitiesSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaUniversity, FaChevronRight, FaSearch, FaMapMarkerAlt, FaStar, FaUsers, FaGlobe } from 'react-icons/fa';
import { MdSchool, MdPeople, MdLocationOn } from 'react-icons/md';
import './UniversitiesSection.css';

// Import your university logos
import szabistLogo from './szabist_logo.jpg'; // Update path as needed
import iobmLogo from './Iobm.png';
import indusLogo from './indus.jpg';
import hamdardLogo from './hamdard.png';
import ziauddinLogo from './ziaudin.jpg';
import denningLogo from './denning.jpg';

const UniversitiesSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Your 6 Pakistani universities
  const universities = [
    { 
      name: "SZABIST", 
      logo: szabistLogo, 
      color: "#1a237e",
      location: "Karachi, Pakistan",
      students: 5000,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Leading university in business and technology"
    },
    { 
      name: "IoBM", 
      logo: iobmLogo, 
      color: "#004d40",
      location: "Karachi, Pakistan",
      students: 3500,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Institute of Business Management"
    },
    { 
      name: "Indus", 
      logo: indusLogo, 
      color: "#1a237e",
      location: "Karachi, Pakistan",
      students: 4000,
      ranking: "Top Tier",
      type: "private",
      established: 1997,
      category: "top",
      description: "Indus University of Engineering & Technology"
    },
    { 
      name: "Hamdard", 
      logo: hamdardLogo, 
      color: "#2e7d32",
      location: "Karachi, Pakistan",
      students: 6000,
      ranking: "Top Tier",
      type: "private",
      established: 1991,
      category: "top",
      description: "Hamdard University - Excellence in Education"
    },
    { 
      name: "Ziauddin", 
      logo: ziauddinLogo, 
      color: "#4a148c",
      location: "Karachi, Pakistan",
      students: 2800,
      ranking: "Top Tier",
      type: "private",
      established: 1995,
      category: "top",
      description: "Ziauddin University - Medical Sciences"
    },
    { 
      name: "Denning", 
      logo: denningLogo, 
      color: "#bf360c",
      location: "Karachi, Pakistan",
      students: 2000,
      ranking: "Top Tier",
      type: "private",
      established: 1996,
      category: "top",
      description: "Denning College of Business & Technology"
    },
  ];

  // Tab configuration based on your universities
  const tabs = [
    { id: 'all', label: 'All Universities', icon: <FaUniversity /> },
    { id: 'top', label: 'Top Universities', icon: <FaStar /> },
    { id: 'international', label: 'International', icon: <FaGlobe /> },
  ];

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || uni.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <section className="universities-section">
      {/* Background Effects */}
      <div className="universities-bg-effects">
        <div className="universities-half-white-bg"></div>
        <div className="universities-digital-grid"></div>
        <div className="universities-radial-spotlight"></div>
      </div>

      <div className="container">
        <div className="universities-content">
          {/* Header */}
          <div className="universities-header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="universities-badge">
                <span>
                  <FaGraduationCap className="badge-icon" />
                  Partner Universities
                </span>
              </div>
            </motion.div>

            <motion.h2
              className="universities-headline"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Pakistan's <span className="highlight-text">Top Partner Universities</span>
            </motion.h2>

            <motion.p
              className="universities-subtitle"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              We partner with Pakistan's leading universities to bring you the 
              best talent and foster meaningful academic collaborations.
            </motion.p>
          </div>

          {/* Stats Row */}
          <motion.div
            className="universities-stats"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="stat-item">
              <span className="stat-number">6</span>
              <span className="stat-label">Partner Universities</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">Karachi</span>
              <span className="stat-label">Primary Hub</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50,000+</span>
              <span className="stat-label">Students Connected</span>
            </div>
          </motion.div>

          

          {/* Universities Grid */}
          <motion.div
            className="universities-grid-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="universities-grid">
              {filteredUniversities.map((uni, index) => (
                <motion.div
                  key={index}
                  className="university-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{
                    y: -8,
                    boxShadow: '0 12px 40px rgba(229, 182, 62, 0.12)',
                    borderColor: uni.color
                  }}
                >
                  <div 
                    className="university-card-glow" 
                    style={{ background: `radial-gradient(circle at 50% 0%, ${uni.color}15, transparent 70%)` }}
                  ></div>
                  
                  <div 
                    className="university-card-rank" 
                    style={{ background: uni.color }}
                  >
                    {uni.ranking}
                  </div>

                  <div 
                    className="university-logo-wrapper" 
                    style={{ backgroundColor: `${uni.color}08` }}
                  >
                    <img
                      src={uni.logo}
                      alt={uni.name}
                      className="university-logo-img"
                    />
                  </div>

                  <div className="university-info">
                    <h4 className="university-name">{uni.name}</h4>
                    <div className="university-location">
                      <MdLocationOn className="location-icon" style={{ color: uni.color }} />
                      <span>{uni.location}</span>
                    </div>
                    <p className="university-description">{uni.description}</p>
                  </div>

                  <div className="university-meta">
                    <div className="meta-item">
                      <MdSchool className="meta-icon" style={{ color: uni.color }} />
                      <span>{uni.students.toLocaleString()} Students</span>
                    </div>
                    <div className="meta-item">
                      <FaUniversity className="meta-icon" style={{ color: uni.color }} />
                      <span>{uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</span>
                    </div>
                    <div className="meta-item">
                      <MdPeople className="meta-icon" style={{ color: uni.color }} />
                      <span>Est. {uni.established}</span>
                    </div>
                  </div>

                  <div className="university-card-footer">
                    <span 
                      className="university-type" 
                      style={{ background: `${uni.color}15`, color: uni.color }}
                    >
                      {uni.category.charAt(0).toUpperCase() + uni.category.slice(1)}
                    </span>
                    <button className="explore-btn" style={{ color: uni.color }}>
                      Explore <FaChevronRight className="btn-icon" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* View All CTA */}
          <motion.div
            className="universities-cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <button className="view-all-btn">
              View All Partner Universities
              <FaChevronRight className="btn-arrow" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default UniversitiesSection;