// Landing.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaTag,
  FaUniversity,
  FaUsers,
  FaFilter,
  FaCalendarCheck,
  FaChartLine,
  FaShieldAlt,
  FaRocket,
  FaBullhorn,
  FaVideo,
  FaStore,
  FaGem,
  FaCoins,
  FaApple,
  FaGooglePlay,
  FaLinkedinIn,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaChevronRight,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaEye,
  FaBullseye,
  FaHeart,
  FaMobileAlt,
  FaArrowRight,
  FaTimes,
  FaCheckCircle,
  FaBars,
  FaBuilding as FaBuildingIcon,
  FaUser,
  FaSchool,
  FaPeopleArrows,
  FaCalendarAlt,
  FaFileAlt,
  FaGraduationCap,
  FaPlane,
} from "react-icons/fa";
import "./styles/Landing.css";

// University logo imports from assets
import szabistLogo from "../../src/assets/szabist_logo.jpg";
import iobmLogo from "../../src/assets/Iobm.png";
import indusLogo from "../../src/assets/indus.jpg";
import hamdardLogo from "../../src/assets/hamdard.png";
import ziauddinLogo from "../../src/assets/ziaudin.jpg";
import denningLogo from "../../src/assets/denning.jpg";

// Brand logo imports from assets
import automate from "../../src/assets/logos/automate.jpeg";
import civilazation from "../../src/assets/logos/civilazation.png";
import Eagle from "../../src/assets/logos/eagle.jpeg";
import grove from "../../src/assets/logos/grove.png";
import Honey from "../../src/assets/logos/Honey.png";
import leadsnotify from "../../src/assets/logos/leadsnotify.jpeg";
import peng from "../../src/assets/logos/peng.jpeg";
import appScreenshot1 from "../../src/assets/screen1.jpeg";
import appScreenshot2 from "../../src/assets/screen2.jpeg";
import appScreenshot3 from "../../src/assets/screen3.png";
import OfferImagesGallery from "./OfferImagesGallery";
import HomeReviews from "./roles/HomeReviews";
import UniversitiesSection from "./roles/UniversitiesSection";
const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("companies");
  const [showUniversitiesModal, setShowUniversitiesModal] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, []);

  const sectionRefs = {
    hero: useRef(null),
    features: useRef(null),
    collaborate: useRef(null),
    about: useRef(null),
    contact: useRef(null),
  };

  const heroInView = useInView(sectionRefs.hero, { once: false, amount: 0.1 });
  const featuresInView = useInView(sectionRefs.features, {
    once: false,
    amount: 0.1,
  });
  const collaborateInView = useInView(sectionRefs.collaborate, {
    once: false,
    amount: 0.1,
  });
  const aboutInView = useInView(sectionRefs.about, {
    once: false,
    amount: 0.1,
  });
  const contactInView = useInView(sectionRefs.contact, {
    once: false,
    amount: 0.1,
  });

  const isVisible = {
    hero: heroInView,
    features: featuresInView,
    collaborate: collaborateInView,
    about: aboutInView,
    contact: contactInView,
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
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

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  const handleCompanyClick = (e) => {
    e.preventDefault();
    navigate("/company_profile");
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    navigate("/brands");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const appFeatures = [
    {
      id: 1,
      title: "Student Deals",
      desc: "Exclusive discounts tailored for students across 200+ brands.",
      icon: FaSchool,
      color: "#f9c349",
      gradient: ["#f9c349", "#f5a623"],
    },
    {
      id: 2,
      title: "Skills Share",
      desc: "Connect with fellow students to share expertise and learn new skills.",
      icon: FaPeopleArrows,
      color: "#a29bfe",
      gradient: ["#a29bfe", "#6c5ce7"],
    },
    {
      id: 3,
      title: "Premium Events",
      desc: "Access workshops, seminars, and networking events.",
      icon: FaCalendarAlt,
      color: "#fd79a8",
      gradient: ["#fd79a8", "#e84393"],
    },
    {
      id: 4,
      title: "Resume Builder",
      desc: "Create ATS-optimized resumes with AI-powered suggestions.",
      icon: FaFileAlt,
      color: "#00b894",
      gradient: ["#00b894", "#00a381"],
    },
    {
      id: 5,
      title: "Scholarships",
      desc: "Access internal grants and external scholarships like Erasmus+.",
      icon: FaGraduationCap,
      color: "#ffa502",
      gradient: ["#ffa502", "#f9a825"],
    },
    {
      id: 6,
      title: "Student Travel",
      desc: "Curated budget-friendly travel packages for students.",
      icon: FaPlane,
      color: "#6c5ce7",
      gradient: ["#6c5ce7", "#5a4bd1"],
    },
  ];

  const featuresData = {
    companies: [
      {
        icon: FaUsers,
        title: "Access Top Talent",
        description:
          "Connect with 50,000+ verified students and fresh graduates from Pakistan's top universities.",
      },
      {
        icon: FaFilter,
        title: "Smart Filtering",
        description:
          "Filter candidates by university, GPA, skills, graduation projects, and more.",
      },
      {
        icon: FaCalendarCheck,
        title: "Direct Scheduling",
        description:
          "Schedule interviews directly through our streamlined dashboard and reduce time-to-hire by 60%.",
      },
      {
        icon: FaChartLine,
        title: "Analytics Dashboard",
        description:
          "Track your hiring progress, candidate engagement metrics, and success rates.",
      },
      {
        icon: FaShieldAlt,
        title: "Verified Profiles",
        description:
          "All student profiles are verified by institutional databases for accuracy.",
      },
      {
        icon: FaRocket,
        title: "Early Access",
        description:
          "Secure top talent 3-6 months before they enter the open job market.",
      },
    ],
    brands: [
      {
        icon: FaBullhorn,
        title: "Reach 50,000+ Students",
        description:
          "Directly connect with students from top universities and build brand awareness.",
      },
      {
        icon: FaTag,
        title: "100% Free to List",
        description:
          "List your brand with zero cost and 0% commissions on student transactions.",
      },
      {
        icon: FaVideo,
        title: "Authentic UGC",
        description:
          "Get real user-generated content as students share their experiences on social media.",
      },
      {
        icon: FaStore,
        title: "Drive Real Footfall",
        description:
          "Convert student engagement into physical store visits and online orders.",
      },
      {
        icon: FaGem,
        title: "Build Brand Loyalty",
        description:
          "Create lasting relationships with the next generation of consumers.",
      },
      {
        icon: FaCoins,
        title: "Generate Revenue",
        description:
          "Turn student engagement into revenue through exclusive campus offers.",
      },
    ],
  };

  // Universities with image logos
  const universities = [
    { name: "SZABIST", logo: szabistLogo, color: "#1a237e" },
    { name: "IoBM", logo: iobmLogo, color: "#004d40" },
    { name: "Indus", logo: indusLogo, color: "#1a237e" },
    { name: "Hamdard", logo: hamdardLogo, color: "#2e7d32" },
    { name: "Ziauddin", logo: ziauddinLogo, color: "#4a148c" },
    { name: "Denning", logo: denningLogo, color: "#bf360c" },
  ];

  // Brands with image logos
  const brands = [
    { name: "automate", logo: automate },
    { name: "civilazation", logo: civilazation },
    { name: "Eagle", logo: Eagle },
    { name: "grove", logo: grove },
    { name: "Honey", logo: Honey },
    { name: "leadsnotify", logo: leadsnotify },
    { name: "peng", logo: peng },
    
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div
            className="nav-logo"
            onClick={() => scrollToSection(sectionRefs.hero)}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-suffix">The Deft</span>
            <span className="logo-suffix">Crew</span>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FaBars />
          </button>

          <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(sectionRefs.hero);
              }}
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(sectionRefs.features);
              }}
            >
              Why Choose Us
            </a>
            <a
              href="#collaborate"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(sectionRefs.collaborate);
              }}
            >
              Collaborate
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(sectionRefs.about);
              }}
            >
              About Us
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(sectionRefs.contact);
              }}
            >
              Contact
            </a>
            <div className="nav-actions">
              <button className="nav-login-btn" onClick={handleLoginClick}>
                <FaUser />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
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
            <motion.div
              className="hero-content"
              variants={containerVariants}
              initial="hidden"
              animate={isVisible.hero ? "visible" : "hidden"}
            >
              <motion.div
                className="hero-pre-headline"
                variants={itemVariants}
                custom={0}
              >
                <span className="pre-headline-badge">
                  🚀 THE FUTURE OF TALENT ACQUISITION & BRAND ENGAGEMENT
                </span>
              </motion.div>

              <motion.h1
                className="hero-title"
                variants={itemVariants}
                custom={1}
              >
                Connect, Collaborate, and <br />
                <span className="highlight-text">Grow Your Business</span>
              </motion.h1>

              <motion.p
                className="hero-subheadline"
                variants={itemVariants}
                custom={2}
              >
                The Deft Crew bridges the gap between top-tier students, fresh
                graduates, leading companies, and ambitious brands. Whether
                you're hiring talent or building brand awareness, we've got you
                covered.
              </motion.p>

              <motion.div
                className="hero-stats"
                variants={staggerVariants}
                initial="hidden"
                animate={isVisible.hero ? "visible" : "hidden"}
              >
                {[
                  { number: "50,000+", label: "Active Students" },
                  { number: "50+", label: "Partner Companies" },
                  { number: "100+", label: "Trusted Brands" },
                  { number: "12+", label: "Universities" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="hero-stat"
                    variants={itemVariants}
                    custom={index}
                  >
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
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
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
                          borderColor: feature.color,
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
                            style={{
                              background: `radial-gradient(circle, ${feature.color}30, transparent 70%)`,
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="features-grid-footer">
                  <span className="footer-tag">🌟 200+ Exclusive Deals</span>
                  <span className="footer-tag">
                    🎓 12+ Partner Universities
                  </span>
                  <span className="footer-tag">
                    📱 Available on iOS & Android
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / FEATURES SECTION */}
      <section
        ref={sectionRefs.features}
        className="features-section"
        id="features"
      >
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
            <motion.div
              className="features-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>✨ WHY CHOOSE US</span>
            </motion.div>

            <motion.h2
              className="features-headline"
              variants={itemVariants}
              custom={1}
            >
              Everything You Need to{" "}
              <span className="highlight-text">Succeed</span>
            </motion.h2>

            <motion.p
              className="features-subtitle"
              variants={itemVariants}
              custom={2}
            >
              Whether you're hiring top talent or building brand awareness, we
              provide the tools you need.
            </motion.p>

            <motion.div
              className="features-tabs"
              variants={itemVariants}
              custom={3}
            >
              <button
                className={`tab-btn ${activeTab === "companies" ? "active" : ""}`}
                onClick={() => setActiveTab("companies")}
              >
                <FaBuildingIcon />
                For Companies
              </button>
              <button
                className={`tab-btn ${activeTab === "brands" ? "active" : ""}`}
                onClick={() => setActiveTab("brands")}
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
              {(activeTab === "companies"
                ? featuresData.companies
                : featuresData.brands
              ).map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="feature-card"
                    variants={itemVariants}
                    custom={index}
                    whileHover={{
                      y: -8,
                      boxShadow: "0 12px 40px rgba(229, 182, 62, 0.08)",
                    }}
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
      <section
        ref={sectionRefs.collaborate}
        className="collaborate-section"
        id="collaborate"
      >
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
            <motion.div
              className="collaborate-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>🤝 JOIN THE ECOSYSTEM</span>
            </motion.div>

            <motion.h2
              className="collaborate-headline"
              variants={itemVariants}
              custom={1}
            >
              Choose Your <span className="highlight-text">Path</span>
            </motion.h2>

            <motion.p
              className="collaborate-subtitle"
              variants={itemVariants}
              custom={2}
            >
              Whether you're a company looking for talent, a brand seeking
              exposure, or a university connecting students with opportunities.
            </motion.p>

            <motion.div
              className="collaborate-grid"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.collaborate ? "visible" : "hidden"}
            >
              {[
                {
                  icon: FaBuildingIcon,
                  title: "For Companies",
                  description:
                    "Hire top-tier final year students and fresh graduates before your competitors. Access verified talent pools and reduce time-to-hire by 60%.",
                  cta: "Register Your Company",
                  color: "#E5B63E",
                  action: handleCompanyClick,
                  features: [
                    "Top 10% Graduates",
                    "Verified Profiles",
                    "Early Access",
                  ],
                },
                {
                  icon: FaTag,
                  title: "For Brands",
                  description:
                    "Reach 50,000+ students and build brand loyalty with the next generation. 100% free to list with 0% commissions on student transactions.",
                  cta: "Register Your Brand",
                  color: "#f0c84a",
                  action: handleBrandClick,
                  features: [
                    "50,000+ Students",
                    "Free Listing",
                    "UGC Generation",
                  ],
                },
                {
                  icon: FaUniversity,
                  title: "For Universities",
                  description:
                    "Connect your students with leading companies and brands. Track placement success and build strong industry partnerships.",
                  cta: "View Universities",
                  color: "#d4a832",
                  action: () => setShowUniversitiesModal(true),
                  features: [
                    "Industry Connect",
                    "Placement Tracking",
                    "Student Success",
                  ],
                },
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    className="collaborate-card"
                    variants={itemVariants}
                    custom={index}
                  >
                    <div
                      className="collaborate-icon"
                      style={{
                        background: `${item.color}20`,
                        color: item.color,
                      }}
                    >
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

      {/* Universities Modal with Image Logos */}
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
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setShowUniversitiesModal(false)}
              >
                <FaTimes />
              </button>
              <h2 className="modal-title">🏛️ Partner Universities</h2>
              <p className="modal-subtitle">
                We partner with Pakistan's top universities to bring you the
                best talent
              </p>
              <div className="modal-universities-grid">
                {universities.map((uni, index) => (
                  <motion.div
                    key={index}
                    className="modal-university-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      y: -6,
                      boxShadow: "0 8px 30px rgba(229, 182, 62, 0.15)",
                    }}
                  >
                    <div
                      className="university-logo-wrapper"
                      style={{ backgroundColor: `${uni.color}10` }}
                    >
                      <img
                        src={uni.logo}
                        alt={uni.name}
                        className="university-logo-img"
                      />
                    </div>
                    <span className="university-name">{uni.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABOUT US SECTION with Stats */}
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
            <motion.div
              className="about-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>📖 ABOUT US</span>
            </motion.div>

            <motion.h2
              className="about-headline"
              variants={itemVariants}
              custom={1}
            >
              Building the Future of{" "}
              <span className="highlight-text">Talent & Brand Engagement</span>
            </motion.h2>

            <motion.div
              className="about-grid"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.about ? "visible" : "hidden"}
            >
              <motion.div
                className="about-text"
                variants={itemVariants}
                custom={0}
              >
                <p>
                  The Deft Crew is Pakistan's premier talent acquisition and
                  brand engagement platform that connects top-tier universities,
                  ambitious students, forward-thinking companies, and innovative
                  brands.
                </p>
                <p>
                  We work directly with placement cells and institutional
                  databases of partner universities to ensure verified,
                  high-quality talent streams. Our platform provides companies
                  with early access to final-year students and fresh graduates,
                  reducing time-to-hire by over 60%.
                </p>
                <p>
                  For brands, we offer a unique opportunity to reach 50,000+
                  students directly with 100% free listing and 0% commissions.
                  Build brand loyalty with the next generation of consumers
                  through authentic engagement and user-generated content.
                </p>
              </motion.div>

              <motion.div
                className="about-stats"
                variants={itemVariants}
                custom={1}
              >
                <div className="about-stat-card">
                  <span className="about-stat-number">50,000+</span>
                  <span className="about-stat-label">Active Students</span>
                </div>
                <div className="about-stat-card">
                  <span className="about-stat-number">50+</span>
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
        <div className="about-mission">
          <div className="mission-item">
            <FaEye />
            <div>
              <h4>Our Vision</h4>
              <p>
                To become the leading ecosystem bridging academia, industry, and
                brands.
              </p>
            </div>
          </div>
          <div className="mission-item">
            <FaBullseye />
            <div>
              <h4>Our Mission</h4>
              <p>
                Connect companies with top 10% of graduates and brands with
                50,000+ students.
              </p>
            </div>
          </div>
          <div className="mission-item">
            <FaHeart />
            <div>
              <h4>Our Values</h4>
              <p>
                Transparency, Innovation, Excellence, and Impact-driven
                solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

     {/* COMPANIES & BRANDS COLLABORATION SECTION */}
<section className="brands-collab-section">
  <div className="brands-collab-bg-effects">
    <div className="brands-collab-half-white-bg"></div>
    <div className="brands-collab-digital-grid"></div>
    <div className="brands-collab-radial-spotlight"></div>
  </div>

  <div className="container">
    <motion.div
      className="brands-collab-content"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        className="brands-collab-header"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <motion.span
          className="brands-collab-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="badge-icon"></span> COMPANIES & BRANDS
        </motion.span>

        <motion.h2
          className="brands-collab-headline"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Trusted by{" "}
          <span className="highlight-text">Industry Leaders</span>
        </motion.h2>

        <motion.p
          className="brands-collab-subtext"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Partnering with top companies and brands to create meaningful
          connections with students
        </motion.p>
      </motion.div>

      <OfferImagesGallery/>
    </motion.div>
  </div>
</section>
<UniversitiesSection/>
<HomeReviews/>
      {/* CONTACT US SECTION */}
      <section
        ref={sectionRefs.contact}
        className="contact-section"
        id="contact"
      >
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
            <motion.div
              className="contact-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>📬 CONTACT US</span>
            </motion.div>

            <motion.h2
              className="contact-headline"
              variants={itemVariants}
              custom={1}
            >
              Get in <span className="highlight-text">Touch</span>
            </motion.h2>

            <motion.p
              className="contact-subtitle"
              variants={itemVariants}
              custom={2}
            >
              Have questions? We'd love to hear from you. Reach out to our team
              and we'll get back to you within 24 hours.
            </motion.p>

            <motion.div
              className="contact-grid"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.contact ? "visible" : "hidden"}
            >
              <motion.div
                className="contact-info"
                variants={itemVariants}
                custom={0}
              >
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h4>Location</h4>
                    <p>Bldg 22-C LN 3, Bukhari Phase 6 DHA, Karachi, Pakistan 75500.</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <p>hello@thedeftcrew.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div>
                    <h4>Phone</h4>
                    <p>+923222969595</p>
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

              <motion.div
                className="contact-details"
                variants={itemVariants}
                custom={1}
              >
                <div className="contact-details-card">
                  <div className="contact-map">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2858.069255290672!2d67.066767!3d24.791769799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33cebff2f4c39%3A0xd0b467e3ee81f4a7!2sThe%20Deft%20Crew-Digital%20Marketing%20Agency%20%7C%20Social%20Media%20Marketing%20%26%20Influencer%20Agency!5e1!3m2!1sen!2s!4v1784106864269!5m2!1sen!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
                      width="100%"
                      height="500"
                      style={{ border: 0, borderRadius: "12px" }}
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
            <motion.div
              className="app-cta-icon"
              animate={{
                y: [0, -12, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FaMobileAlt />
            </motion.div>

            <motion.h2
              className="app-cta-headline"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Download Our <span className="highlight-text">App</span>
            </motion.h2>

            <motion.p
              className="app-cta-subtext"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Access talent and brand opportunities on the go. Download the tdc
              app and start connecting instantly.
            </motion.p>

            <motion.div
              className="app-cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.a
                href="https://apps.apple.com/pk/app/the-deft-crew/id6765877675"
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-btn gold"
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaApple />
                <div>
                  <span>Download on the</span>
                  <strong>App Store</strong>
                </div>
                <FaArrowRight className="arrow-icon" />
              </motion.a>

              <motion.a
                href="https://play.google.com/store/apps/details?id=com.aqkhan110.tdc"
                target="_blank"
                rel="noopener noreferrer"
                className="play-store-btn gold"
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGooglePlay />
                <div>
                  <span>Get it on</span>
                  <strong>Google Play</strong>
                </div>
                <FaArrowRight className="arrow-icon" />
              </motion.a>
            </motion.div>

            {/* Optional: App Screenshots Preview */}
            <motion.div
              className="app-screenshots"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* App Screenshots Preview with Images */}
              <motion.div
                className="app-screenshots"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="app-screenshot">
                  <img
                    src={appScreenshot1}
                    alt="App Screenshot 1"
                    className="app-screenshot-img"
                  />
                  <div className="app-screenshot-overlay">
                    <span>Home</span>
                  </div>
                </div>
                <div className="app-screenshot">
                  <img
                    src={appScreenshot2}
                    alt="App Screenshot 2"
                    className="app-screenshot-img"
                  />
                  <div className="app-screenshot-overlay">
                    <span>Features</span>
                  </div>
                </div>
                <div className="app-screenshot">
                  <img
                    src={appScreenshot3}
                    alt="App Screenshot 3"
                    className="app-screenshot-img"
                  />
                  <div className="app-screenshot-overlay">
                    <span>Profile</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
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

        {/* Floating Elements */}
        <div className="profile-cta-floating">
          <div className="floating-icon">✦</div>
          <div className="floating-icon">✦</div>
          <div className="floating-icon">✦</div>
          <div className="floating-icon">✦</div>
        </div>

        <div className="container">
          <motion.div
            className="profile-cta-content"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.h2
              className="profile-cta-headline"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Build Your <span className="highlight-text">Profile</span> Today
            </motion.h2>

            <motion.p
              className="profile-cta-subtext"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Whether you're a company hiring talent or a brand building
              awareness, create your profile and start growing.
            </motion.p>

            <motion.div
              className="profile-cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.button
                className="profile-cta-company"
                onClick={handleCompanyClick}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="btn-border"></div>
                <div className="btn-glow"></div>
                <FaBuildingIcon />
                <div>
                  <strong>For Companies</strong>
                  <span>Hire Top Talent →</span>
                </div>
              </motion.button>

              <motion.button
                className="profile-cta-brand"
                onClick={handleBrandClick}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="btn-border"></div>
                <div className="btn-glow"></div>
                <FaTag />
                <div>
                  <strong>For Brands</strong>
                  <span>Reach Students →</span>
                </div>
              </motion.button>
            </motion.div>
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
                Connecting talent, brands, and opportunities. Empowering the
                next generation of professionals and businesses.
              </p>
              <div className="footer-social">
                <a
                  href="https://www.linkedin.com/company/thedeftcrew/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="social-link"
                >
                  <FaLinkedinIn />
                </a>
                
                <a
                  href="https://www.facebook.com/share/1CijYDto1b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="social-link"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://www.instagram.com/thedeftcrew?igsh=MWRnc3RnZ3hkN2s0Yw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="social-link"
                >
                  <FaInstagram />
                </a>
                
              </div>
            </div>

            <div className="footer-links-column">
              <h4>Quick Links</h4>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sectionRefs.hero);
                }}
              >
                <FaChevronRight /> Home
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sectionRefs.features);
                }}
              >
                <FaChevronRight /> Why Choose Us
              </a>
              <a
                href="#collaborate"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sectionRefs.collaborate);
                }}
              >
                <FaChevronRight /> Collaborate
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sectionRefs.about);
                }}
              >
                <FaChevronRight /> About Us
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sectionRefs.contact);
                }}
              >
                <FaChevronRight /> Contact
              </a>
            </div>

            <div className="footer-links-column">
              <h4>Connect With Us</h4>
              <a href="mailto:hello@thedeftcrew.com">
                <FaEnvelope /> hello@thedeftcrew.com
              </a>
              <a href="tel:+923222969595">
                <FaPhone /> +923222969595
              </a>
              <a href="#">
                <FaMapMarkerAlt /> Bldg 22-C LN 3, Bukhari Phase 6 DHA, Karachi, Pakistan 75500.
              </a>
              <a href="#">
                <FaClock /> Mon - Fri, 9AM - 6PM
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()}{" "}
              <span className="footer-copyright-brand">The Deft Crew</span>. All
              rights reserved.
            </p>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
