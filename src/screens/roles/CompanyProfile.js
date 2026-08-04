import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaArrowRight, FaBriefcase, FaCalendarCheck, FaFileAlt,
  FaTrophy, FaGraduationCap, FaSearch, FaFilter, FaCheckCircle,FaUserGraduate, FaBolt,
  FaUniversity, FaLaptopCode, FaChartLine, FaMinus, FaPlus,
  FaCalendarAlt, FaBuilding, FaUsers, FaRocket, FaShieldAlt,
  FaClock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedinIn,
  FaTwitter, FaFacebookF, FaInstagram, FaYoutube, FaGlobe,
  FaStar, FaAward, FaLightbulb, FaCog, FaDatabase, FaCode,
  FaPaintBrush, FaChartBar, FaMobileAlt, FaTabletAlt,
  FaDollarSign, FaHandshake, FaHeart, FaThumbsUp, FaRocket as FaRocketIcon
} from 'react-icons/fa';
import './CompanyProfile.css';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  
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
    whyAudience: useRef(null),
    socialProof: useRef(null),
    faq: useRef(null),
    finalCta: useRef(null)
  };

  // Fix: Use individual useInView hooks instead of an object
  const heroInView = useInView(sectionRefs.hero, { once: false, amount: 0.1 });
  const problemInView = useInView(sectionRefs.problem, { once: false, amount: 0.1 });
  const solutionInView = useInView(sectionRefs.solution, { once: false, amount: 0.1 });
  const howItWorksInView = useInView(sectionRefs.howItWorks, { once: false, amount: 0.1 });
  const whyAudienceInView = useInView(sectionRefs.whyAudience, { once: false, amount: 0.1 });
  const socialProofInView = useInView(sectionRefs.socialProof, { once: false, amount: 0.1 });
  const faqInView = useInView(sectionRefs.faq, { once: false, amount: 0.1 });
  const finalCtaInView = useInView(sectionRefs.finalCta, { once: false, amount: 0.1 });

  // Create a stable object for isVisible
  const isVisible = {
    hero: heroInView,
    problem: problemInView,
    solution: solutionInView,
    howItWorks: howItWorksInView,
    whyAudience: whyAudienceInView,
    socialProof: socialProofInView,
    faq: faqInView,
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

  const faqData = [
    {
      question: "When is the best time to scout final-year students?",
      answer: "Right now. The best companies begin interviewing and issuing conditional job offers 3 to 6 months before final exams conclude, ensuring the student joins full-time immediately upon graduation."
    },
    {
      question: "What types of roles can we hire for?",
      answer: "Employers primarily use our platform to source for Entry-Level Corporate positions, Management Trainee Officers (MTOs), Associate Engineers, UI/UX Designers, Growth Marketers, and specialized project-based interns."
    },
    {
      question: "How do we know the students' academic details are accurate?",
      answer: "We work directly alongside the placement cells and institutional databases of our partner universities, ensuring academic backgrounds, enrollment statuses, and graduation timelines are strictly verified."
    }
  ];

  const universities = ['SZABIST', 'IoBM', 'Indus', 'Hamdard', 'Ziauddin', 'Denning'];

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="company-landing">
      {/* Navigation */}
      <nav className="company-nav">
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
          <div className="hero-grid">
            {/* Left Side - Text Content */}
            <motion.div
              className="hero-left"
              variants={containerVariants}
              initial="hidden"
              animate={isVisible.hero ? "visible" : "hidden"}
            >
              <motion.div className="hero-pre-headline" variants={itemVariants} custom={0}>
                <span className="pre-headline-badge">⚡ THE RECRUITMENT SHORTCUT FOR FAST-GROWING COMPANIES</span>
              </motion.div>

              <motion.h1 className="hero-headlines" variants={itemVariants} custom={1}>
                Hire Top-Tier Final Year Students and Fresh Graduates{' '}
                <span className="highlight-text">Before Your Competitors Even See Their CVs.</span>
              </motion.h1>

              <motion.p className="hero-subheadline" variants={itemVariants} custom={2}>
                Gain exclusive, direct access to the brightest final-year talent and fresh alumni from elite private universities (SZABIST, IoBM, Indus, Hamdard, Ziauddin, Denning). Skip the job-portal noise. Filter by skills, view vetted portfolios, and secure top entry-level talent early.
              </motion.p>

              <motion.div className="hero-ctas" variants={itemVariants} custom={3}>
                <motion.button 
                  className="hero-primary-btn"
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(229, 182, 62, 0.4)', y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your Company Profile
                  <FaArrowRight />
                </motion.button>
              </motion.div>

              {/* Hero Micro Copy - Now as Cards/Counters */}
              <motion.div className="hero-micro-copy-cards" variants={itemVariants} custom={4}>
                <motion.div 
                  className="micro-card"
                  whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(229, 182, 62, 0.12)' }}
                >
                  <div className="micro-card-icon">🏢</div>
                  <div className="micro-card-content">
                    <span className="micro-card-number">50+</span>
                    <span className="micro-card-label">Leading Companies</span>
                  </div>
                </motion.div>
                <motion.div 
                  className="micro-card"
                  whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(229, 182, 62, 0.12)' }}
                >
                  <div className="micro-card-icon">💼</div>
                  <div className="micro-card-content">
                    <span className="micro-card-number">4+</span>
                    <span className="micro-card-label">Hiring Tracks</span>
                  </div>
                </motion.div>
                <motion.div 
                  className="micro-card"
                  whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(229, 182, 62, 0.12)' }}
                >
                  <div className="micro-card-icon">⏱️</div>
                  <div className="micro-card-content">
                    <span className="micro-card-number">2</span>
                    <span className="micro-card-label">Minute Setup</span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div className="hero-trust-badge" variants={itemVariants} custom={5}>
                <FaBriefcase />
                <span>💼 Partnered with Pakistan's top private universities to stream the top 10% of graduating talent directly to your dashboard.</span>
              </motion.div>
            </motion.div>

            {/* Right Side - Dashboard Mockup */}
            <motion.div
              className="hero-right"
              initial={{ opacity: 0, x: 60 }}
              animate={isVisible.hero ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="dashboard-mockup">
                <div className="dashboard-header">
                  <div className="dashboard-dots">
                    <span className="dot-red"></span>
                    <span className="dot-yellow"></span>
                    <span className="dot-green"></span>
                  </div>
                  <span className="dashboard-title">The Deft Crew</span>
                  <span className="dashboard-count">12 candidates</span>
                </div>

                <div className="dashboard-candidates">
                  {[
                    { name: 'Ayesha Khan', university: 'SZABIST', program: 'BBA (Finance)', gpa: '3.8', badge: 'Top Performer' },
                    { name: 'Hamza Ali', university: 'IoBM', program: 'BS (Computer Science)', gpa: '3.9', badge: 'AI Specialist' },
                    { name: 'Zara Ahmed', university: 'Indus', program: 'BS (Marketing)', gpa: '3.7', badge: 'Creative Lead' }
                  ].map((candidate, index) => (
                    <motion.div 
                      key={index}
                      className="candidate-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={isVisible.hero ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5 + index * 0.15 }}
                      whileHover={{ scale: 1.02, y: -4, borderColor: '#E5B63E' }}
                    >
                     
                      <div className="candidate-info">
                        <h4>{candidate.name}</h4>
                        <p className="candidate-details">
                          {candidate.university} • {candidate.program} • GPA: {candidate.gpa}
                        </p>
                        <span className="candidate-badge">{candidate.badge}</span>
                      </div>
                      
                    </motion.div>
                  ))}
                </div>

                <div className="dashboard-footer">
                  <span className="filter-tag">📊 GPA ≥ 3.5</span>
                  <span className="filter-tag">🎓 Final Year</span>
                  <span className="filter-tag">🏆 Top 10%</span>
                </div>
              </div>
            </motion.div>
          </div>
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
            <motion.div className="problem-badge" variants={itemVariants} custom={0}>
              <span>⚠️ THE PAIN POINT</span>
            </motion.div>

            <motion.h2 className="problem-headline" variants={itemVariants} custom={1}>
              Traditional Entry-Level Hiring is <span className="highlight-text">Broken, Slow, and Expensive</span>
            </motion.h2>

            <motion.p className="problem-copy" variants={itemVariants} custom={2}>
              Every HR manager and business owner knows the pain of posting a standard "Entry-Level Job" online. Within 24 hours, you are hit with a wave of friction:
            </motion.p>

            <motion.div className="problem-grid" variants={staggerVariants} initial="hidden" animate={isVisible.problem ? "visible" : "hidden"}>
              {[
                {
                  icon: FaFileAlt,
                  title: 'The Resume Avalanche',
                  description: 'A single job post pulls in over 500+ generic, unvetted applications. Your HR team spends dozens of unbillable hours filtering out candidates who don\'t even meet the basic criteria.'
                },
                {
                  icon: FaTrophy,
                  title: 'The Bidding War for Late Talent',
                  description: 'If you wait until graduation day to post a job on traditional portals, the absolute top 10% of students—the self-starters, innovators, and high-achievers—are already locked into corporate contracts.'
                },
                {
                  icon: FaGraduationCap,
                  title: 'The Skill-Gap Gamble',
                  description: 'Traditional degrees don\'t always translate to workplace readiness. Sorting through raw CVs won\'t tell you if a candidate can actually execute a marketing campaign, write clean code, or manage client operations.'
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div key={index} className="problem-card" variants={itemVariants} custom={index}>
                    <div className="problem-icon">
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
            <motion.div className="solution-badge" variants={itemVariants} custom={0}>
              <span>💡 THE SOLUTION</span>
            </motion.div>

            <motion.h2 className="solution-headline" variants={itemVariants} custom={1}>
              The Ultimate <span className="highlight-text">Early-Access Talent Pipeline</span>
            </motion.h2>

            <motion.p className="solution-copy" variants={itemVariants} custom={2}>
              We have digitized and streamlined the campus placement drive. Our platform connects you directly with students while they are finishing their final semesters and fresh graduates actively seeking entry-level roles.
            </motion.p>

            <motion.div className="solution-features" variants={staggerVariants} initial="hidden" animate={isVisible.solution ? "visible" : "hidden"}>
              {[
  {
    icon: FaSearch,
    title: 'Pre-Market Scouting',
    description: 'Interview and extend offers to exceptional final-year students before they step foot into the open job market. Secure tomorrow\'s leaders today at optimum entry-level packages.'
  },
  {
    icon: FaFilter,
    title: 'Zero Noise, 100% Signal',
    description: 'Filter candidates explicitly by university, specific GPA thresholds, key technical skill sets, and verified final-year graduation projects.'
  },
  {
    icon: FaCheckCircle,
    title: 'Vetted and Ready to Deploy',
    description: 'We don\'t just host resumes; we connect you with candidates who possess practical, hands-on experience, reducing onboarding time and accelerating productivity.'
  },

  // New Features
  {
    icon: FaUserGraduate,
    title: 'Verified Student Profiles',
    description: 'Every candidate profile is verified through their university details, academic records, and graduation status, ensuring authentic and trustworthy hiring.'
  },
  {
    icon: FaBolt,
    title: 'Fast Hiring Pipeline',
    description: 'Shortlist, connect, and schedule interviews within minutes using our streamlined recruitment workflow, reducing your overall hiring cycle.'
  },
  
  {
    icon: FaHandshake,
    title: 'Direct Employer Connection',
    description: 'Communicate directly with shortlisted candidates, manage interview invitations, and build long-term relationships with emerging talent from leading universities.'
  }
].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div key={index} className="solution-feature" variants={itemVariants} custom={index}>
                    <div className="solution-feature-icon">
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
            <motion.div className="howitworks-badge" variants={itemVariants} custom={0}>
              <span>🚀 HOW IT WORKS</span>
            </motion.div>

            <motion.h2 className="howitworks-headline" variants={itemVariants} custom={1}>
              The 3-Step <span className="highlight-text">Placement Process</span>
            </motion.h2>

            <motion.div className="howitworks-steps" variants={staggerVariants} initial="hidden" animate={isVisible.howItWorks ? "visible" : "hidden"}>
              {[
                {
                  step: '01',
                  title: 'Set Up Your Profile & Requirements',
                  subtitle: 'Takes 2 Mins',
                  description: 'Register your company and specify the exact entry-level roles or internship tracks you are looking to fill (e.g., Tech, Growth Marketing, Finance, Creative).'
                },
                {
                  step: '02',
                  title: 'Filter & Scout Pre-Market Talent',
                  subtitle: 'Automated Matching',
                  description: 'Bypass traditional job posts. Instantly search through profiles of final-year students and fresh graduates from specific top-tier private universities who match your exact criteria.'
                },
                {
                  step: '03',
                  title: 'Shortlist & Interview Directly',
                  subtitle: 'Accelerated Hiring',
                  description: 'Review verified student portfolios and final year project summaries. Shortlist candidates and schedule interviews directly through our streamlined dashboard.'
                }
              ].map((item, index) => (
                <motion.div key={index} className="howitworks-step" variants={itemVariants} custom={index}>
                  <div className="step-number">{item.step}</div>
                  <div className="step-content">
                    <h3>{item.title}</h3>
                    <span className="step-subtitle">{item.subtitle}</span>
                    <p>{item.description}</p>
                  </div>
                  {index < 2 && (
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

      {/* WHY AUDIENCE SECTION */}
      <section ref={sectionRefs.whyAudience} className="whyaudience-section">
        <div className="whyaudience-bg-effects">
          <div className="whyaudience-half-white-bg"></div>
          <div className="whyaudience-digital-grid"></div>
          <div className="whyaudience-radial-spotlight"></div>
        </div>

        <div className="container">
          <motion.div
            className="whyaudience-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.whyAudience ? "visible" : "hidden"}
          >
            <motion.div className="whyaudience-badge" variants={itemVariants} custom={0}>
              <span>🎯 WHY THIS AUDIENCE?</span>
            </motion.div>

            <motion.h2 className="whyaudience-headline" variants={itemVariants} custom={1}>
              Tap into Pakistan's Most Aggressive, Self-Taught, and <span className="highlight-text">Ambitious Student Base</span>
            </motion.h2>

            <motion.div className="whyaudience-grid" variants={staggerVariants} initial="hidden" animate={isVisible.whyAudience ? "visible" : "hidden"}>
              {[
                {
                  icon: FaUniversity,
                  title: 'Elite Institutional Pedigree',
                  description: 'Secure talent from elite private networks like IoBM, SZABIST, Ziauddin, and Denning. These institutions are renowned for practical business management, engineering excellence, and modern communication skills.'
                },
                {
                  icon: FaLaptopCode,
                  title: 'The Gen-Z Digital Edge',
                  description: 'The graduating classes of today are digital natives. They intuitively understand AI tools, automation workflows, modern social media dynamics, and contemporary software systems.'
                },
                {
                  icon: FaChartLine,
                  title: 'High Retention Potential',
                  description: 'Hiring final-year students allows you to mold them into your company culture early on. Employees who start as interns or entry-level recruits show significantly higher long-term retention rates.'
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div key={index} className="whyaudience-card" variants={itemVariants} custom={index}>
                    <div className="whyaudience-icon">
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

      {/* SOCIAL PROOF / UNIVERSITIES */}
      <section ref={sectionRefs.socialProof} className="socialproof-section">
        <div className="socialproof-bg-effects">
          <div className="socialproof-half-white-bg"></div>
          <div className="socialproof-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="socialproof-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.socialProof ? "visible" : "hidden"}
          >
            <motion.div className="socialproof-badge" variants={itemVariants} custom={0}>
              <span>🏛️ PARTNER UNIVERSITIES</span>
            </motion.div>

            <motion.h2 className="socialproof-headline" variants={itemVariants} custom={1}>
              Sourcing Talent Directly From <span className="highlight-text">Top Higher Education Networks</span>
            </motion.h2>

            <motion.div className="socialproof-grid" variants={staggerVariants} initial="hidden" animate={isVisible.socialProof ? "visible" : "hidden"}>
              {universities.map((uni, index) => (
                <motion.div key={index} className="socialproof-logo" variants={itemVariants} custom={index}>
                  <FaUniversity />
                  <span>{uni}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section ref={sectionRefs.faq} className="faq-section">
        <div className="faq-bg-effects">
          <div className="faq-half-white-bg"></div>
          <div className="faq-digital-grid"></div>
        </div>

        <div className="container">
          <motion.div
            className="faq-content"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible.faq ? "visible" : "hidden"}
          >
            <motion.div className="faq-badge" variants={itemVariants} custom={0}>
              <span>❓ FAQ</span>
            </motion.div>

            <motion.h2 className="faq-headline" variants={itemVariants} custom={1}>
              Frequently Asked <span className="highlight-text">Questions</span>
            </motion.h2>

            <motion.div className="faq-list" variants={staggerVariants} initial="hidden" animate={isVisible.faq ? "visible" : "hidden"}>
              {faqData.map((item, index) => (
                <motion.div key={index} className="faq-item" variants={itemVariants} custom={index}>
                  <div className="faq-question" onClick={() => toggleFaq(index)}>
                    <span>{item.question}</span>
                    {activeFaq === index ? <FaMinus /> : <FaPlus />}
                  </div>
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        className="faq-answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
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
            <motion.h2 className="finalcta-headline" variants={itemVariants} custom={0}>
              Build Your Next Generation of <span className="highlight-text">Leaders Today</span>
            </motion.h2>

            <motion.p className="finalcta-subtext" variants={itemVariants} custom={1}>
              Stop waiting for talent to find you. Take control of your hiring pipeline, cut down your time-to-hire by over 60%, and secure top-tier graduates before your competitors can even schedule a screening call.
            </motion.p>

            <motion.div className="finalcta-actions" variants={itemVariants} custom={2}>
              <motion.button 
                className="finalcta-primary-btn"
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(229, 182, 62, 0.4)', y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Recruiting Vetted Grads Now
                <FaArrowRight />
              </motion.button>
              <motion.button 
                className="finalcta-secondary-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/contact')}
              >
                <FaCalendarAlt />
                Schedule a Demo
              </motion.button>
            </motion.div>

            <motion.div className="finalcta-trust" variants={itemVariants} custom={3}>
              <div className="trust-item">
                <FaCheckCircle />
                <span>50+ Companies Trust Us</span>
              </div>
              <div className="trust-item">
                <FaCheckCircle />
                <span>Top 10% of Graduates</span>
              </div>
              <div className="trust-item">
                <FaCheckCircle />
                <span>60% Faster Hiring</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="company-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">The Deft <span className="footer-suffix">Crew</span></span>
              <p>Connecting companies with top talent.</p>
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

export default CompanyProfile;