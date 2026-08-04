import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaArrowRight, FaCheckCircle, FaShieldAlt, FaStore,
  FaVideo, FaCoins, FaCrown, FaGem, FaMobileAlt, FaChartLine,
  FaUsers, FaTag, FaBullhorn, FaRocket, FaStar, FaAward,
  FaLinkedinIn, FaTwitter, FaFacebookF, FaInstagram, FaYoutube,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaGlobe,
  FaThumbsUp, FaHeart, FaDollarSign, FaShoppingBag, FaCamera,
  FaWhatsapp, FaTelegram, FaShareAlt, FaFire, FaBolt
} from 'react-icons/fa';
import './BrandsProfile.css';

// Counter Component
const AnimatedCounter = ({ target, suffix = '', prefix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    const startValue = 0;
    const endValue = typeof target === 'string' ? parseFloat(target.replace(/,/g, '')) : target;

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      if (typeof target === 'string' && target.includes('+')) {
        setCount(Math.floor(currentValue));
      } else {
        setCount(Math.floor(currentValue));
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, target, duration]);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <span ref={counterRef}>
      {prefix}
      {typeof target === 'string' && target.includes('+') 
        ? `${formatNumber(count)}+` 
        : formatNumber(count)}
      {suffix}
    </span>
  );
};

const BrandsProfile = () => {
  const navigate = useNavigate();
  
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
    problem: useRef(null),
    solution: useRef(null),
    howItWorks: useRef(null),
    whyGenZ: useRef(null),
    finalCta: useRef(null)
  };

  // Fix: Use individual useInView hooks instead of an object
  const heroInView = useInView(sectionRefs.hero, { once: false, amount: 0.1 });
  const problemInView = useInView(sectionRefs.problem, { once: false, amount: 0.1 });
  const solutionInView = useInView(sectionRefs.solution, { once: false, amount: 0.1 });
  const howItWorksInView = useInView(sectionRefs.howItWorks, { once: false, amount: 0.1 });
  const whyGenZInView = useInView(sectionRefs.whyGenZ, { once: false, amount: 0.1 });
  const finalCtaInView = useInView(sectionRefs.finalCta, { once: false, amount: 0.1 });

  // Create a stable object for isVisible
  const isVisible = {
    hero: heroInView,
    problem: problemInView,
    solution: solutionInView,
    howItWorks: howItWorksInView,
    whyGenZ: whyGenZInView,
    finalCta: finalCtaInView
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

  const statsData = [
    { number: '50000+', label: 'Active Students' },
    { number: '0', label: 'Commission', suffix: '%' },
    { number: '100', label: 'Free to List', suffix: '%' },
    { number: '12+', label: 'Partner Universities' }
  ];

  const problemStatsData = [
    { number: '12', label: 'Second Attention Span', suffix: 's' },
    { number: '89', label: 'Use Ad Blockers', suffix: '%' },
    { number: '3', label: 'Rising CPMs', suffix: 'x' }
  ];

  const howItWorksData = [
    {
      step: '01',
      title: 'Drop Your Offer',
      description: 'Set up your free profile and input an irresistible perk for verified students/alumni.'
    },
    {
      step: '02',
      title: 'Lock the Doors',
      description: 'Our institutional verification ensures only real students from elite private universities can access it.'
    },
    {
      step: '03',
      title: 'Go Viral Domestically',
      description: 'Watch your physical footfall spike, your online order volume increase, and your organic mentions climb.'
    }
  ];

  const whyData = [
    {
      icon: FaCrown,
      title: 'The Trendsetters',
      description: 'Students from private universities set the lifestyle, fashion, and dining trends for the entire youth culture. Win them, win the market.'
    },
    {
      icon: FaGem,
      title: 'Alumni Buying Power',
      description: 'Our network includes recent, high-earning graduates from networks like Denning and Hamdard who have immediate disposable income.'
    },
    {
      icon: FaMobileAlt,
      title: 'Instant Content Generators',
      description: 'They live on their phones. Every transaction is a potential viral story, reel, or video highlighting your business.'
    }
  ];

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="brands-landing">
      {/* Navigation */}
      <nav className="brands-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">tdc</span>
            <span className="logo-suffix">.</span>
          </div>
          <div className="nav-actions">
            <button className="nav-login-btn" onClick={handleLogin}>
              <FaUser />
              Login
            </button>
            <button className="nav-getstarted-btn" onClick={handleGetStarted}>
              Get Registered
              <FaArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={sectionRefs.hero} className="hero-section">
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
              <span className="pre-headline-badge">⚡ THE DEATH OF PAID ADS IS HERE</span>
            </motion.div>

            <motion.h1 
              className="hero-headline"
              variants={itemVariants}
              custom={1}
            >
              Gen-Z is Ignoring Your Sponsored Posts.
              <br />
              <span className="highlight-text"> Here is How to Enter Their Group Chats Instead.</span>
            </motion.h1>

            <motion.p 
              className="hero-subheadline"
              variants={itemVariants}
              custom={2}
            >
              Traditional B2C advertising is broken. Stop renting attention from social media algorithms. 
              Put your brand directly inside the digital wallets of 50,000+ high-spending students and 
              premium alumni from networks like SZABIST, IoBM, Indus, and Ziauddin. 
              <strong> 100% Free to list. 0% Commissions. Absolute market dominance.</strong>
            </motion.p>

            <motion.div 
              className="hero-ctas"
              variants={itemVariants}
              custom={3}
            >
              <motion.button 
                className="hero-primary-btn"
                onClick={handleGetStarted}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 20px 50px rgba(229, 182, 62, 0.4)',
                  y: -3
                }}
                whileTap={{ scale: 0.95 }}
              >
                Get Your Free Brand Listing
                <FaArrowRight />
              </motion.button>
            </motion.div>

            <motion.div 
              className="hero-social-proof"
              variants={itemVariants}
              custom={4}
            >
              <div className="social-proof-line">
                <FaCheckCircle />
                <span>Zero ad spend. Zero friction. Trusted by the fastest-growing brands in the country.</span>
              </div>
            </motion.div>

            <motion.div 
              className="hero-stats"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.hero ? "visible" : "hidden"}
            >
              {statsData.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="hero-stat-item"
                  variants={itemVariants}
                  custom={index}
                >
                  <span className="stat-number">
                    <AnimatedCounter 
                      target={stat.number} 
                      suffix={stat.suffix || ''} 
                      duration={2000 + index * 500}
                    />
                  </span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section ref={sectionRefs.problem} className="problem-section">
        <div className="problem-bg-effects">
          <div className="problem-half-white-bg"></div>
          <div className="problem-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="problem-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.problem ? "visible" : "hidden"}
          >
            <motion.div 
              className="problem-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>⚠️ THE AD FATIGUE</span>
            </motion.div>

            <motion.h2 
              className="problem-headline"
              variants={itemVariants}
              custom={1}
            >
              They Don't See Your Ads.
              <span className="highlight-text"> They Literally Don't.</span>
            </motion.h2>

            <motion.p 
              className="problem-copy"
              variants={itemVariants}
              custom={2}
            >
              The average Gen-Z consumer has a <strong>12-second attention span</strong> online and uses 
              ad-blockers instinctively. They don't buy because an algorithm showed them a carousel ad; 
              they buy because a friend dropped a link in the WhatsApp group chat. If your customer 
              acquisition strategy relies entirely on pumping money into Meta or TikTok ads, you are 
              fighting a losing battle against rising CPMs.
            </motion.p>

            <motion.div 
              className="problem-stats-row"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.problem ? "visible" : "hidden"}
            >
              {problemStatsData.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="problem-stat-item"
                  variants={itemVariants}
                  custom={index}
                  whileHover={{
                    y: -8,
                    boxShadow: '0 20px 60px rgba(229, 182, 62, 0.15)',
                    transition: { type: 'spring', stiffness: 300 }
                  }}
                >
                  <div className="stat-circle-modern">
                    <span className="stat-number-large">
                      <AnimatedCounter 
                        target={stat.number} 
                        suffix={stat.suffix || ''} 
                        duration={2000 + index * 400}
                      />
                    </span>
                    <span className="stat-label-small">{stat.label}</span>
                  </div>
                  {index < problemStatsData.length - 1 && (
                    <div className="stat-divider-modern">
                      <span className="divider-dot"></span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section ref={sectionRefs.solution} className="solution-section">
        <div className="solution-bg-effects">
          <div className="solution-half-white-bg"></div>
          <div className="solution-digital-grid"></div>
          <div className="solution-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="solution-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.solution ? "visible" : "hidden"}
          >
            <motion.div 
              className="solution-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>💡 THE SOLUTION</span>
            </motion.div>

            <motion.h2 
              className="solution-headline"
              variants={itemVariants}
              custom={1}
            >
              The Ultimate <span className="highlight-text">Campus Loophole.</span>
            </motion.h2>

            <motion.p 
              className="solution-copy"
              variants={itemVariants}
              custom={2}
            >
              We don't sell ad placements. We build an exclusive privilege network. By offering a 
              locked discount on our app, your brand becomes a badge of honor on campus. They visit 
              your storefront or e-commerce shop, feel the exclusive value, and immediately document 
              the experience across their personal social channels. You get real footfall and authentic 
              user-generated content (UGC) without a single cent of ad spend.
            </motion.p>

            <motion.div 
              className="solution-features"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.solution ? "visible" : "hidden"}
            >
              {[
                { icon: FaShieldAlt, title: 'Exclusive Network', desc: 'Build a badge of honor on campus' },
                { icon: FaStore, title: 'Real Footfall', desc: 'Drive physical store visits' },
                { icon: FaVideo, title: 'Authentic UGC', desc: 'Get viral content without ad spend' },
                { icon: FaCoins, title: 'Zero Cost', desc: 'No commissions, 100% free' }
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div 
                    key={index}
                    className="solution-feature"
                    variants={itemVariants}
                    custom={index}
                  >
                    <div className="feature-icon">
                      <IconComponent />
                    </div>
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section ref={sectionRefs.howItWorks} className="howitworks-section">
        <div className="howitworks-bg-effects">
          <div className="howitworks-half-white-bg"></div>
          <div className="howitworks-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="howitworks-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.howItWorks ? "visible" : "hidden"}
          >
            <motion.div 
              className="howitworks-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>🚀 HOW IT WORKS</span>
            </motion.div>

            <motion.h2 
              className="howitworks-headline"
              variants={itemVariants}
              custom={1}
            >
              Three Steps to <span className="highlight-text">Campus Dominance</span>
            </motion.h2>

            <motion.div 
              className="howitworks-steps"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.howItWorks ? "visible" : "hidden"}
            >
              {howItWorksData.map((step, index) => (
                <motion.div 
                  key={index}
                  className="howitworks-step"
                  variants={itemVariants}
                  custom={index}
                >
                  <div className="step-number">{step.step}</div>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  {index < howItWorksData.length - 1 && (
                    <div className="step-connector">
                      <FaArrowRight className="arrow-icon" />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHY GEN-Z & ALUMNI SECTION */}
      <section ref={sectionRefs.whyGenZ} className="why-section">
        <div className="why-bg-effects">
          <div className="why-half-white-bg"></div>
          <div className="why-digital-grid"></div>
          <div className="why-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="why-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.whyGenZ ? "visible" : "hidden"}
          >
            <motion.div 
              className="why-badge"
              variants={itemVariants}
              custom={0}
            >
              <span>🎯 WHY GEN-Z & ALUMNI?</span>
            </motion.div>

            <motion.h2 
              className="why-headline"
              variants={itemVariants}
              custom={1}
            >
              The <span className="highlight-text">Power</span> of Youth Culture
            </motion.h2>

            <motion.div 
              className="why-grid"
              variants={staggerVariants}
              initial="hidden"
              animate={isVisible.whyGenZ ? "visible" : "hidden"}
            >
              {whyData.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={index}
                    className="why-card"
                    variants={itemVariants}
                    custom={index}
                    whileHover={{
                      y: -8,
                      boxShadow: '0 20px 60px rgba(229, 182, 62, 0.15)',
                      transition: { type: 'spring', stiffness: 300 }
                    }}
                  >
                    <div className="why-card-icon">
                      <IconComponent />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section ref={sectionRefs.finalCta} className="finalcta-section">
        <div className="finalcta-bg-effects">
          <div className="finalcta-half-white-bg"></div>
          <div className="finalcta-digital-grid"></div>
          <div className="finalcta-radial-spotlight"></div>
          <div className="finalcta-particles">
            <div className="finalcta-particle gold-blur-1"></div>
            <div className="finalcta-particle gold-blur-2"></div>
            <div className="finalcta-particle gold-blur-3"></div>
          </div>
        </div>

        <div className="container">
          <motion.div
            className="finalcta-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.finalCta ? "visible" : "hidden"}
          >
            <motion.h2 
              className="finalcta-headline"
              variants={itemVariants}
              custom={0}
            >
              Don't Get Left Behind by the <span className="highlight-text">Next Generation.</span>
            </motion.h2>

            <motion.p 
              className="finalcta-subtext"
              variants={itemVariants}
              custom={1}
            >
              Join the fastest-growing brands already dominating the campus market.
            </motion.p>

            <motion.div 
              className="finalcta-actions"
              variants={itemVariants}
              custom={2}
            >
              <motion.button 
                className="finalcta-primary-btn"
                onClick={handleGetStarted}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 20px 60px rgba(229, 182, 62, 0.4)',
                  y: -3
                }}
                whileTap={{ scale: 0.95 }}
              >
                Claim Your Free Brand Now
                <FaArrowRight />
              </motion.button>
            </motion.div>

            <motion.div 
              className="finalcta-trust"
              variants={itemVariants}
              custom={3}
            >
              <div className="trust-item">
                <FaCheckCircle />
                <span>100% Free to List</span>
              </div>
              <div className="trust-item">
                <FaCheckCircle />
                <span>0% Commissions</span>
              </div>
              <div className="trust-item">
                <FaCheckCircle />
                <span>Verified Students</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="brands-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">The Deft <span className="footer-suffix">Crew</span></span>
              <p>Connecting brands with the next generation.</p>
            </div>
            <div className="footer-links">
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
            </div>
            <div className="footer-copyright">
              <p>© {new Date().getFullYear()} The Deft Crew. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrandsProfile;