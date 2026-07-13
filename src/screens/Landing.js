import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  FaBuilding, FaTag, FaUniversity, FaUsers, FaFilter, FaCalendarCheck,
  FaChartLine, FaShieldAlt, FaRocket, FaBullhorn, FaVideo, FaStore,
  FaGem, FaCoins, FaApple, FaGooglePlay, FaLinkedinIn, FaTwitter,
  FaFacebookF, FaInstagram, FaYoutube, FaChevronRight, FaEnvelope,
  FaPhone, FaMapMarkerAlt, FaClock, FaEye, FaBullseye, FaHeart,
  FaMobileAlt, FaArrowRight, FaTimes, FaCheckCircle, FaBars,
  FaBuilding as FaBuildingIcon, FaUser, FaSchool, FaPeopleArrows,
  FaCalendarAlt, FaFileAlt, FaGraduationCap, FaPlane,
  FaStar, FaAward, FaLightbulb, FaCog, FaDatabase, FaCalendarDay
} from 'react-icons/fa';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('companies');
  const [showUniversitiesModal, setShowUniversitiesModal] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  
  // Auto-scroll to top on component mount
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  const sectionRefs = {
    hero: useRef(null),
    features: useRef(null),
    collaborate: useRef(null),
    about: useRef(null),
    contact: useRef(null)
  };

  // Fix: Use individual useInView hooks instead of an object
  const heroInView = useInView(sectionRefs.hero, { once: false, amount: 0.1 });
  const featuresInView = useInView(sectionRefs.features, { once: false, amount: 0.1 });
  const collaborateInView = useInView(sectionRefs.collaborate, { once: false, amount: 0.1 });
  const aboutInView = useInView(sectionRefs.about, { once: false, amount: 0.1 });
  const contactInView = useInView(sectionRefs.contact, { once: false, amount: 0.1 });

  // Create a stable object for isVisible
  const isVisible = {
    hero: heroInView,
    features: featuresInView,
    collaborate: collaborateInView,
    about: aboutInView,
    contact: contactInView
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  // Navigation handlers with proper routing
  const handleCompanyClick = (e) => {
    e.preventDefault();
    navigate('/company_profile');
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    navigate('/brands');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  // App Features Data
  const appFeatures = [
    {
      id: 1,
      title: "Student Deals",
      desc: "Exclusive discounts tailored for students across 200+ brands.",
      icon: FaSchool,
      color: "#f9c349",
      gradient: ['#f9c349', '#f5a623']
    },
    {
      id: 2,
      title: "Skills Share",
      desc: "Connect with fellow students to share expertise and learn new skills.",
      icon: FaPeopleArrows,
      color: "#a29bfe",
      gradient: ['#a29bfe', '#6c5ce7']
    },
    {
      id: 3,
      title: "Premium Events",
      desc: "Access workshops, seminars, and networking events.",
      icon: FaCalendarAlt,
      color: "#fd79a8",
      gradient: ['#fd79a8', '#e84393']
    },
    {
      id: 4,
      title: "Resume Builder",
      desc: "Create ATS-optimized resumes with AI-powered suggestions.",
      icon: FaFileAlt,
      color: "#00b894",
      gradient: ['#00b894', '#00a381']
    },
    {
      id: 5,
      title: "Scholarships",
      desc: "Access internal grants and external scholarships like Erasmus+.",
      icon: FaGraduationCap,
      color: "#ffa502",
      gradient: ['#ffa502', '#f9a825']
    },
    {
      id: 6,
      title: "Student Travel",
      desc: "Curated budget-friendly travel packages for students.",
      icon: FaPlane,
      color: "#6c5ce7",
      gradient: ['#6c5ce7', '#5a4bd1']
    },
  ];

  const featuresData = {
    companies: [
      {
        icon: FaUsers,
        title: 'Access Top Talent',
        description: 'Connect with 50,000+ verified students and fresh graduates from Pakistan\'s top universities.'
      },
      {
        icon: FaFilter,
        title: 'Smart Filtering',
        description: 'Filter candidates by university, GPA, skills, graduation projects, and more.'
      },
      {
        icon: FaCalendarCheck,
        title: 'Direct Scheduling',
        description: 'Schedule interviews directly through our streamlined dashboard and reduce time-to-hire by 60%.'
      },
      {
        icon: FaChartLine,
        title: 'Analytics Dashboard',
        description: 'Track your hiring progress, candidate engagement metrics, and success rates.'
      },
      {
        icon: FaShieldAlt,
        title: 'Verified Profiles',
        description: 'All student profiles are verified by institutional databases for accuracy.'
      },
      {
        icon: FaRocket,
        title: 'Early Access',
        description: 'Secure top talent 3-6 months before they enter the open job market.'
      }
    ],
    brands: [
      {
        icon: FaBullhorn,
        title: 'Reach 50,000+ Students',
        description: 'Directly connect with students from top universities and build brand awareness.'
      },
      {
        icon: FaTag,
        title: '100% Free to List',
        description: 'List your brand with zero cost and 0% commissions on student transactions.'
      },
      {
        icon: FaVideo,
        title: 'Authentic UGC',
        description: 'Get real user-generated content as students share their experiences on social media.'
      },
      {
        icon: FaStore,
        title: 'Drive Real Footfall',
        description: 'Convert student engagement into physical store visits and online orders.'
      },
      {
        icon: FaGem,
        title: 'Build Brand Loyalty',
        description: 'Create lasting relationships with the next generation of consumers.'
      },
      {
        icon: FaCoins,
        title: 'Generate Revenue',
        description: 'Turn student engagement into revenue through exclusive campus offers.'
      }
    ]
  };

  const universities = ['SZABIST', 'IoBM', 'Indus', 'Hamdard', 'Ziauddin', 'Denning'];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div 
            className="nav-logo" 
            onClick={() => scrollToSection(sectionRefs.hero)} 
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-text">The Deft</span>
            <span className="logo-suffix">Crew</span>
          </div>
          
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FaBars />
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.hero); }}>Home</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.features); }}>Why Choose Us</a>
            <a href="#collaborate" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.collaborate); }}>Collaborate</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.about); }}>About Us</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.contact); }}>Contact</a>
          </div>

          <div className="nav-actions">
            <button className="nav-login-btn" onClick={handleLoginClick}>
              <FaUser />
              <span>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - With App Features Grid */}
      <section ref={sectionRefs.hero} className="hero-section" id="home">
        <div className="hero-bg-effects">
          <div className="hero-half-white-bg"></div>
          <div className="hero-digital-grid"></div>
          <div className="hero-particles">
            <div className="hero-particle gold-blur-1"></div>
            <div className="hero-particle gold-blur-2"></div>
            <div className="hero-particle gold-blur-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="hero-wrapper">
            {/* Left Side - Text Content */}
            <motion.div
              className="hero-content"
              variants={containerVariants}
              initial="hidden"
              animate={isVisible.hero ? "visible" : "hidden"}
            >
              <motion.div className="hero-pre-headline" variants={itemVariants} custom={0}>
                <span className="pre-headline-badge">🚀 THE FUTURE OF TALENT ACQUISITION & BRAND ENGAGEMENT</span>
              </motion.div>

              <motion.h1 className="hero" variants={itemVariants} custom={3}>
                Connect, Collaborate, and <br />
                <span className="highlight-text">Grow Your Business</span>
              </motion.h1>

              <motion.p className="hero-subheadline" variants={itemVariants} custom={2}>
                The Deft Crew bridges the gap between top-tier students, fresh graduates, leading companies, and ambitious brands. 
                Whether you're hiring talent or building brand awareness, we've got you covered.
              </motion.p>

              <motion.div className="hero-stats" variants={staggerVariants} initial="hidden" animate={isVisible.hero ? "visible" : "hidden"}>
                {[
                  { number: '50,000+', label: 'Active Students' },
                  { number: '200+', label: 'Partner Companies' },
                  { number: '100+', label: 'Trusted Brands' },
                  { number: '12+', label: 'Universities' }
                ].map((stat, index) => (
                  <motion.div key={index} className="hero-stat" variants={itemVariants} custom={index}>
                    <span className="stat-number">{stat.number}</span>
                    <span className="stat-label">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side - App Features Grid */}
            <motion.div
              className="hero-features-grid"
              initial={{ opacity: 0, x: 60 }}
              animate={isVisible.hero ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="features-grid-container">
                <div className="features-grid-header">
                  <span className="features-badge">✨ App Features</span>
                  <h3>Everything You Need in One App</h3>
                </div>
                <div className="app-features-grid">
                  {appFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <motion.div
                        key={feature.id}
                        className="app-feature-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible.hero ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.5 + index * 0.08 }}
                        onMouseEnter={() => setHoveredFeature(feature.id)}
                        onMouseLeave={() => setHoveredFeature(null)}
                        whileHover={{ 
                          y: -8,
                          boxShadow: `0 12px 40px ${feature.color}25`,
                          borderColor: feature.color
                        }}
                      >
                        <div 
                          className="app-feature-icon" 
                          style={{ 
                            background: `linear-gradient(135deg, ${feature.gradient[0]}, ${feature.gradient[1]})`,
                          }}
                        >
                          <IconComponent />
                        </div>
                        <div className="app-feature-content">
                          <h4>{feature.title}</h4>
                          <p>{feature.desc}</p>
                        </div>
                        {hoveredFeature === feature.id && (
                          <motion.div 
                            className="app-feature-glow"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ background: `radial-gradient(circle, ${feature.color}30, transparent 70%)` }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="features-grid-footer">
                  <span className="footer-tag">🌟 200+ Exclusive Deals</span>
                  <span className="footer-tag">🎓 12+ Partner Universities</span>
                  <span className="footer-tag">📱 Available on iOS & Android</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / FEATURES SECTION */}
      <section ref={sectionRefs.features} className="features-section" id="features">
        <div className="features-bg-effects">
          <div className="features-half-white-bg"></div>
          <div className="features-digital-grid"></div>
          <div className="features-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="features-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.features ? "visible" : "hidden"}
          >
            <motion.div className="features-badge" variants={itemVariants} custom={0}>
              <span>✨ WHY CHOOSE US</span>
            </motion.div>

            <motion.h2 className="features-headline" variants={itemVariants} custom={1}>
              Everything You Need to <span className="highlight-text">Succeed</span>
            </motion.h2>

            <motion.p className="features-subtitle" variants={itemVariants} custom={2}>
              Whether you're hiring top talent or building brand awareness, we provide the tools you need.
            </motion.p>

            <motion.div className="features-tabs" variants={itemVariants} custom={3}>
              <button 
                className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
                onClick={() => setActiveTab('companies')}
              >
                <FaBuildingIcon />
                For Companies
              </button>
              <button 
                className={`tab-btn ${activeTab === 'brands' ? 'active' : ''}`}
                onClick={() => setActiveTab('brands')}
              >
                <FaTag />
                For Brands
              </button>
            </motion.div>

            <motion.div 
              className="features-grid"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.features ? "visible" : "hidden"}
              key={activeTab}
            >
              {(activeTab === 'companies' ? featuresData.companies : featuresData.brands).map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div 
                    key={index} 
                    className="feature-card"
                    variants={itemVariants}
                    custom={index}
                    whileHover={{ y: -8, boxShadow: '0 12px 40px rgba(229, 182, 62, 0.08)' }}
                  >
                    <div className="feature-icon-wrapper">
                      <div className="feature-icon">
                        <IconComponent />
                      </div>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* COLLABORATE SECTION */}
      <section ref={sectionRefs.collaborate} className="collaborate-section" id="collaborate">
        <div className="collaborate-bg-effects">
          <div className="collaborate-half-white-bg"></div>
          <div className="collaborate-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="collaborate-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.collaborate ? "visible" : "hidden"}
          >
            <motion.div className="collaborate-badge" variants={itemVariants} custom={0}>
              <span>🤝 JOIN THE ECOSYSTEM</span>
            </motion.div>

            <motion.h2 className="collaborate-headline" variants={itemVariants} custom={1}>
              Choose Your <span className="highlight-text">Path</span>
            </motion.h2>

            <motion.p className="collaborate-subtitle" variants={itemVariants} custom={2}>
              Whether you're a company looking for talent, a brand seeking exposure, or a university connecting students with opportunities.
            </motion.p>

            <motion.div className="collaborate-grid" variants={staggerVariants} initial="hidden" animate={isVisible.collaborate ? "visible" : "hidden"}>
              {[
                {
                  icon: FaBuildingIcon,
                  title: 'For Companies',
                  description: 'Hire top-tier final year students and fresh graduates before your competitors. Access verified talent pools and reduce time-to-hire by 60%.',
                  cta: 'Explore Companies',
                  color: '#E5B63E',
                  action: handleCompanyClick,
                  features: ['Top 10% Graduates', 'Verified Profiles', 'Early Access']
                },
                {
                  icon: FaTag,
                  title: 'For Brands',
                  description: 'Reach 50,000+ students and build brand loyalty with the next generation. 100% free to list with 0% commissions on student transactions.',
                  cta: 'Explore Brands',
                  color: '#f0c84a',
                  action: handleBrandClick,
                  features: ['50,000+ Students', 'Free Listing', 'UGC Generation']
                },
                {
                  icon: FaUniversity,
                  title: 'For Universities',
                  description: 'Connect your students with leading companies and brands. Track placement success and build strong industry partnerships.',
                  cta: 'View Universities',
                  color: '#d4a832',
                  action: () => setShowUniversitiesModal(true),
                  features: ['Industry Connect', 'Placement Tracking', 'Student Success']
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div key={index} className="collaborate-card" variants={itemVariants} custom={index}>
                    <div className="collaborate-icon" style={{ background: `${item.color}20`, color: item.color }}>
                      <IconComponent />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="collaborate-features">
                      {item.features.map((feature, i) => (
                        <span key={i} className="collaborate-feature-tag">
                          <FaCheckCircle style={{ color: item.color }} />
                          {feature}
                        </span>
                      ))}
                    </div>
                    <motion.button 
                      className="collaborate-cta"
                      onClick={item.action}
                      whileHover={{ x: 6 }}
                      style={{ color: item.color }}
                    >
                      {item.cta} <FaArrowRight />
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Universities Modal */}
      <AnimatePresence>
        {showUniversitiesModal && (
          <motion.div 
            className="universities-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUniversitiesModal(false)}
          >
            <motion.div 
              className="universities-modal"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowUniversitiesModal(false)}>
                <FaTimes />
              </button>
              <h2 className="modal-title">🏛️ Partner Universities</h2>
              <p className="modal-subtitle">We partner with Pakistan's top universities to bring you the best talent</p>
              <div className="modal-universities-grid">
                {universities.map((uni, index) => (
                  <motion.div 
                    key={index} 
                    className="modal-university-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -6, boxShadow: '0 8px 30px rgba(229, 182, 62, 0.1)' }}
                  >
                    <span>{uni}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABOUT US SECTION */}
      <section ref={sectionRefs.about} className="about-section" id="about">
        <div className="about-bg-effects">
          <div className="about-half-white-bg"></div>
          <div className="about-digital-grid"></div>
          <div className="about-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="about-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.about ? "visible" : "hidden"}
          >
            <motion.div className="about-badge" variants={itemVariants} custom={0}>
              <span>📖 ABOUT US</span>
            </motion.div>

            <motion.h2 className="about-headline" variants={itemVariants} custom={1}>
              Building the Future of <span className="highlight-text">Talent & Brand Engagement</span>
            </motion.h2>

            <motion.div className="about-grid" variants={staggerVariants} initial="hidden" animate={isVisible.about ? "visible" : "hidden"}>
              <motion.div className="about-text" variants={itemVariants} custom={0}>
                <p>
                  The Deft Crew is Pakistan's premier talent acquisition and brand engagement platform that connects 
                  top-tier universities, ambitious students, forward-thinking companies, and innovative brands.
                </p>
                <p>
                  We work directly with placement cells and institutional databases of partner universities to 
                  ensure verified, high-quality talent streams. Our platform provides companies with early access 
                  to final-year students and fresh graduates, reducing time-to-hire by over 60%.
                </p>
                <p>
                  For brands, we offer a unique opportunity to reach 50,000+ students directly with 100% free 
                  listing and 0% commissions. Build brand loyalty with the next generation of consumers through 
                  authentic engagement and user-generated content.
                </p>
                <div className="about-mission">
                  <div className="mission-item">
                    <FaEye />
                    <div>
                      <h4>Our Vision</h4>
                      <p>To become the leading ecosystem bridging academia, industry, and brands.</p>
                    </div>
                  </div>
                  <div className="mission-item">
                    <FaBullseye />
                    <div>
                      <h4>Our Mission</h4>
                      <p>Connect companies with top 10% of graduates and brands with 50,000+ students.</p>
                    </div>
                  </div>
                  <div className="mission-item">
                    <FaHeart />
                    <div>
                      <h4>Our Values</h4>
                      <p>Transparency, Innovation, Excellence, and Impact-driven solutions.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div className="about-stats" variants={itemVariants} custom={1}>
                <div className="about-stat-card">
                  <span className="about-stat-number">50,000+</span>
                  <span className="about-stat-label">Active Students</span>
                </div>
                <div className="about-stat-card">
                  <span className="about-stat-number">200+</span>
                  <span className="about-stat-label">Partner Companies</span>
                </div>
                <div className="about-stat-card">
                  <span className="about-stat-number">100+</span>
                  <span className="about-stat-label">Trusted Brands</span>
                </div>
                <div className="about-stat-card">
                  <span className="about-stat-number">12+</span>
                  <span className="about-stat-label">Universities</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section ref={sectionRefs.contact} className="contact-section" id="contact">
        <div className="contact-bg-effects">
          <div className="contact-half-white-bg"></div>
          <div className="contact-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="contact-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.contact ? "visible" : "hidden"}
          >
            <motion.div className="contact-badge" variants={itemVariants} custom={0}>
              <span>📬 CONTACT US</span>
            </motion.div>

            <motion.h2 className="contact-headline" variants={itemVariants} custom={1}>
              Get in <span className="highlight-text">Touch</span>
            </motion.h2>

            <motion.p className="contact-subtitle" variants={itemVariants} custom={2}>
              Have questions? We'd love to hear from you. Reach out to our team and we'll get back to you within 24 hours.
            </motion.p>

            <motion.div className="contact-grid" variants={staggerVariants} initial="hidden" animate={isVisible.contact ? "visible" : "hidden"}>
              <motion.div className="contact-info" variants={itemVariants} custom={0}>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h4>Location</h4>
                    <p>Karachi, Pakistan</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <p>thedeftcrew.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div>
                    <h4>Phone</h4>
                    <p>+92 300 1234567</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaClock />
                  </div>
                  <div>
                    <h4>Working Hours</h4>
                    <p>Mon - Fri, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </motion.div>

              <motion.div className="contact-details" variants={itemVariants} custom={1}>
                <div className="contact-details-card">
                  <div className="contact-map">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.123456!2d67.001!3d24.860!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDUxJzM2LjAiTiA2N8KwMDAnMzYuMCJF!5e0!3m2!1sen!2s!4v1234567890" 
                      width="100%" 
                      height="200" 
                      style={{ border: 0, borderRadius: '12px' }} 
                      allowFullScreen="" 
                      loading="lazy"
                      title="Location Map"
                    ></iframe>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* APP DOWNLOAD CTA */}
      <section className="app-cta-section">
        <div className="app-cta-bg-effects">
          <div className="app-cta-half-white-bg"></div>
          <div className="app-cta-digital-grid"></div>
          <div className="app-cta-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="app-cta-content"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="app-cta-icon">
              <FaMobileAlt />
            </div>
            <h2 className="app-cta-headline">
              Download Our <span className="highlight-text">App</span>
            </h2>
            <p className="app-cta-subtext">
              Access talent and brand opportunities on the go. Download the tdc app and start connecting instantly.
            </p>
            <div className="app-cta-buttons">
              <motion.button 
                className="app-store-btn"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaApple />
                <div>
                  <span>Download on the</span>
                  <strong>App Store</strong>
                </div>
                <FaArrowRight />
              </motion.button>
              <motion.button 
                className="play-store-btn"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGooglePlay />
                <div>
                  <span>Get it on</span>
                  <strong>Google Play</strong>
                </div>
                <FaArrowRight />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BUILD YOUR PROFILE CTA */}
      <section className="profile-cta-section">
        <div className="profile-cta-bg-effects">
          <div className="profile-cta-half-white-bg"></div>
          <div className="profile-cta-digital-grid"></div>
          <div className="profile-cta-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="profile-cta-content"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="profile-cta-headline">
              Build Your <span className="highlight-text">Profile</span> Today
            </h2>
            <p className="profile-cta-subtext">
              Whether you're a company hiring talent or a brand building awareness, create your profile and start growing.
            </p>
            <div className="profile-cta-buttons">
              <motion.button 
                className="profile-cta-company"
                onClick={handleCompanyClick}
                whileHover={{ scale: 1.05, y: -3, boxShadow: '0 12px 40px rgba(229, 182, 62, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <FaBuildingIcon />
                <div>
                  <strong>For Companies</strong>
                  <span>Hire Top Talent →</span>
                </div>
              </motion.button>
              <motion.button
                className="profile-cta-brand"
                onClick={handleBrandClick}
                whileHover={{ scale: 1.05, y: -3, boxShadow: '0 12px 40px rgba(240, 200, 74, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTag />
                <div>
                  <strong>For Brands</strong>
                  <span>Reach Students →</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span>The Deft </span>
                <span className="footer-suffix">Crew</span>
              </div>
              <p className="footer-description">
                Connecting talent, brands, and opportunities. 
                Empowering the next generation of professionals and businesses.
              </p>
              <div className="footer-social">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social-link">
                  <FaLinkedinIn />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-link">
                  <FaTwitter />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link">
                  <FaFacebookF />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                  <FaInstagram />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-link">
                  <FaYoutube />
                </a>
              </div>
            </div>

            <div className="footer-links-column">
              <h4>Quick Links</h4>
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.hero); }}>
                <FaChevronRight /> Home
              </a>
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.features); }}>
                <FaChevronRight /> Why Choose Us
              </a>
              <a href="#collaborate" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.collaborate); }}>
                <FaChevronRight /> Collaborate
              </a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.about); }}>
                <FaChevronRight /> About Us
              </a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection(sectionRefs.contact); }}>
                <FaChevronRight /> Contact
              </a>
            </div>

            <div className="footer-links-column">
              <h4>Connect With Us</h4>
              <a href="mailto:thedeftcrew.com">
                <FaEnvelope /> thedeftcrew.com
              </a>
              <a href="tel:+923001234567">
                <FaPhone /> +92 300 1234567
              </a>
              <a href="#">
                <FaMapMarkerAlt /> Karachi, Pakistan
              </a>
              <a href="#">
                <FaClock /> Mon - Fri, 9AM - 6PM
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} <span className="footer-copyright-brand">The Deft Crew</span>. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <span className="footer-divider">•</span>
              <a href="#">Terms of Service</a>
              <span className="footer-divider">•</span>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;