// UserDossier.js - Complete Unified Dossier for All Roles
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Phone, GraduationCap, 
  Briefcase, FileText, Globe, Mail, 
  ExternalLink, Award, Calendar, User, ShieldCheck,
  Loader2, AlertCircle, Store, Plane, Building,
  CreditCard, Gift, Ticket, FileCheck, Users,
  Link2, Crown, Star, Clock, CheckCircle, XCircle,
  Eye, Key, Hash, UserPlus, TrendingUp, Flame
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const UserDossier = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userDetails, setUserDetails] = useState({
    offers: [],
    jobs: [],
    applications: [],
    claimedOffers: [],
    savings: {},
    resume: null,
    stats: {}
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Get userId from location state or URL params
  const userId = location.state?.userId || new URLSearchParams(location.search).get('userId');

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided. Please go back and select a user.');
      setLoading(false);
      return;
    }
    fetchUserData(userId);
  }, [userId]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchUserData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Fetch user data
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      
      if (res.status === 404) {
        throw new Error('User not found. The user may have been deleted.');
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch user data (Status: ${res.status})`);
      }
      
      const data = await res.json();
      setUserData(data);
      
      // Fetch role-specific details
      await fetchUserCompleteDetails(data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const fetchUserCompleteDetails = async (user) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
      
      let details = {
        offers: [],
        jobs: [],
        applications: [],
        claimedOffers: [],
        savings: {},
        resume: null,
        stats: {}
      };

      if (user.role === 'brand') {
        try {
          const offersRes = await fetch(
            `http://localhost:5000/api/offers/brand/${user._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const offersData = await offersRes.json();
          details.offers = Array.isArray(offersData) ? offersData : [];
        } catch (err) {
          console.error("Error fetching brand details:", err);
        }
      }

      if (user.role === 'employee') {
        try {
          const jobsRes = await fetch(
            `http://localhost:5000/api/jobs/my-jobs`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const jobsData = await jobsRes.json();
          details.jobs = Array.isArray(jobsData) ? jobsData : [];
        } catch (err) {
          console.error("Error fetching employee details:", err);
        }
      }

      if (user.role === 'student') {
        try {
          const claimedRes = await fetch(
            `http://localhost:5000/api/offers/claimed`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const claimedData = await claimedRes.json();
          details.claimedOffers = Array.isArray(claimedData) ? claimedData : [];
          
          const savingsRes = await fetch(
            `http://localhost:5000/api/offers/my-total-savings`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const savingsData = await savingsRes.json();
          details.savings = savingsData || { totalSaved: 0, redemptionCount: 0 };
          
          const jobAppsRes = await fetch(
            `http://localhost:5000/api/jobs/my-applications`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const jobAppsData = await jobAppsRes.json();
          details.applications = Array.isArray(jobAppsData) ? jobAppsData : [];
          
          const resumeRes = await fetch(
            `http://localhost:5000/api/resume/primary`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const resumeData = await resumeRes.json();
          details.resume = resumeData.success ? resumeData.data : null;
        } catch (err) {
          console.error("Error fetching student details:", err);
        }
      }

      setUserDetails(details);
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'student': return <GraduationCap size={20} />;
      case 'brand': return <Store size={20} />;
      case 'employee': return <Briefcase size={20} />;
      case 'traveler': return <Plane size={20} />;
      case 'admin': return <ShieldCheck size={20} />;
      default: return <User size={20} />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'student': return '#3b82f6';
      case 'brand': return '#8b5cf6';
      case 'employee': return '#10b981';
      case 'traveler': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getReferralLevel = (count) => {
    if (count >= 10) return { level: 'Elite', color: '#8b5cf6', bg: '#f5f3ff', icon: '👑' };
    if (count >= 5) return { level: 'Pro', color: '#f59e0b', bg: '#fffbeb', icon: '⭐' };
    if (count >= 1) return { level: 'Starter', color: '#3b82f6', bg: '#eff6ff', icon: '🌟' };
    return { level: 'New', color: '#94a3b8', bg: '#f1f5f9', icon: '💫' };
  };

  const DetailItem = ({ label, value, icon: Icon, isPassword = false }) => {
    const displayValue = isPassword 
      ? (showPassword ? value : '••••••••')
      : (value || '—');
    
    return (
      <div style={styles.detailCard}>
        <div style={styles.detailLabelWrap}>
          {Icon && <Icon size={14} style={{ color: '#EAB308' }} />}
          <label style={styles.detailLabel}>{label}</label>
          {isPassword && value && (
            <button 
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Eye size={14} />
            </button>
          )}
        </div>
        <p style={styles.detailValue}>
          {displayValue}
          {isPassword && value && showPassword && (
            <span 
              style={styles.copyHint} 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(value);
                alert('Password copied to clipboard!');
              }}
              title="Click to copy"
            >
              📋
            </span>
          )}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} color="#EAB308" />
        </motion.div>
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading user dossier...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontWeight: 900, fontSize: '24px', color: '#000' }}>USER NOT FOUND</h2>
          <p style={{ color: '#64748b', margin: '8px 0 24px', maxWidth: '400px' }}>
            {error || 'No user record found. Please go back and try again.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={styles.primaryBtn}>
              GO BACK
            </button>
            <button onClick={() => navigate('/admin/users')} style={styles.secondaryBtn}>
              GO TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { role, name, email, phone, address, instagram, logo, bio, headline, skills = [] } = userData;
  const referralLevel = getReferralLevel(userData.referralCount || 0);
  const roleColor = getRoleColor(role);

  return (
    <div style={styles.pageWrapper}>
      {/* Top Navigation */}
      <nav style={styles.navBar}>
        <div style={styles.navContent}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>RETURN TO ADMIN</span>
          </button>
          <div style={styles.idBadge}>
            {role.toUpperCase()} • {userData._id?.slice(-8).toUpperCase() || 'UNKNOWN'}
          </div>
        </div>
      </nav>

      <main style={styles.mainContainer}>
        {/* Left: Identity Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.profileCard}>
            <div style={styles.avatarContainer}>
              <div style={styles.avatarInner}>
                {logo ? (
                  <img src={logo} alt="Logo" style={styles.avatarImage} />
                ) : (
                  name ? name[0].toUpperCase() : <User size={40} />
                )}
              </div>
              {userData.referralCount >= 10 && (
                <div style={styles.crownBadge}>👑</div>
              )}
            </div>
            
            <h1 style={styles.userName}>{name || 'User'}</h1>
            <p style={styles.userSubHeader}>
              <span style={{ 
                ...styles.roleBadge, 
                background: `${roleColor}15`, 
                color: roleColor,
                border: `1px solid ${roleColor}30`
              }}>
                {getRoleIcon(role)} {role}
              </span>
              {userData.isVip && <span style={styles.vipBadge}>⭐ VIP</span>}
              {userData.isAlumni && <span style={styles.alumniBadge}>🎓 Alumni</span>}
            </p>
            
            <div style={styles.statusRow}>
              <span style={{
                ...styles.statusBadge,
                background: userData.status === 'Verified' ? '#10b98115' : '#f59e0b15',
                color: userData.status === 'Verified' ? '#10b981' : '#f59e0b'
              }}>
                {userData.status === 'Verified' ? <CheckCircle size={12} /> : <Clock size={12} />}
                {userData.status || 'Pending'}
              </span>
              <span style={styles.referralLevelBadge}>
                {referralLevel.icon} {referralLevel.level}
              </span>
            </div>
            
            <div style={styles.yellowDivider} />
            
            <div style={styles.contactStack}>
              {email && (
                <a href={`mailto:${email}`} style={styles.contactLink}>
                  <Mail size={16} /> {email}
                </a>
              )}
              {phone && (
                <div style={styles.contactLink}>
                  <Phone size={16} /> {phone}
                </div>
              )}
              {address && (
                <div style={styles.contactLink}>
                  <MapPin size={16} /> {address}
                </div>
              )}
              {location && (
                <div style={styles.contactLink}>
                  <Globe size={16} /> {location}
                </div>
              )}
              {instagram && (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" style={styles.socialLink}>
                  <Globe size={16} /> @{instagram} <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Detailed Dossier */}
        <div style={styles.contentArea}>
          
          {/* Quick Stats */}
          <div style={styles.quickStats}>
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{userData.referralCount || 0}</span>
              <span style={styles.quickStatLabel}>Referrals</span>
            </div>
            <div style={styles.quickStatDivider} />
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{userData.status === 'Verified' ? '✅' : '⏳'}</span>
              <span style={styles.quickStatLabel}>Status</span>
            </div>
            <div style={styles.quickStatDivider} />
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{userData.isVip ? '⭐' : '—'}</span>
              <span style={styles.quickStatLabel}>VIP</span>
            </div>
            <div style={styles.quickStatDivider} />
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{role}</span>
              <span style={styles.quickStatLabel}>Role</span>
            </div>
          </div>

          {/* Section: Personal Information */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><User size={20} /></div>
              <h2 style={styles.sectionTitle}>Personal Information</h2>
            </div>
            <div style={styles.grid2Col}>
              <DetailItem label="Full Name" value={name} icon={User} />
              <DetailItem label="Email" value={email} icon={Mail} />
              <DetailItem label="Password" value={userData.password} icon={Key} isPassword />
              <DetailItem label="Phone" value={phone} icon={Phone} />
              <DetailItem label="Location" value={location} icon={Globe} />
              <DetailItem label="Instagram" value={instagram} icon={Globe} />
              {address && <DetailItem label="Address" value={address} icon={MapPin} />}
              {bio && <DetailItem label="Bio" value={bio} />}
              {headline && <DetailItem label="Headline" value={headline} />}
            </div>
            {skills && skills.length > 0 && (
              <div style={styles.skillsContainer}>
                <label style={styles.skillsLabel}>Skills</label>
                <div style={styles.skillsList}>
                  {skills.map((skill, i) => (
                    <span key={i} style={styles.skillTag}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {logo && (
              <div style={styles.logoContainer}>
                <label style={styles.skillsLabel}>Logo</label>
                <img src={logo} alt="Logo" style={styles.logoPreview} />
              </div>
            )}
          </section>

          {/* Section: Referral Information - ALL ROLES */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><UserPlus size={20} /></div>
              <h2 style={styles.sectionTitle}>Referral Information</h2>
            </div>
            <div style={styles.grid2Col}>
              <DetailItem label="Referral Code" value={userData.referralCode || 'N/A'} icon={Link2} />
              <DetailItem label="Referral Count" value={userData.referralCount || 0} icon={TrendingUp} />
              <DetailItem label="Referral Level" value={`${referralLevel.icon} ${referralLevel.level}`} icon={Crown} />
              <DetailItem label="Referred By" value={userData.referredBy?.name || 'None'} icon={Users} />
            </div>
          </section>

          {/* Section: Company Details - BRAND & EMPLOYEE */}
          {(role === 'brand' || role === 'employee') && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><Building size={20} /></div>
                <h2 style={styles.sectionTitle}>Company Details</h2>
              </div>
              <div style={styles.grid2Col}>
                <DetailItem 
                  label="Company Name" 
                  value={userData.brandName || userData.companyName || 'N/A'} 
                  icon={Building} 
                />
                {role === 'brand' && userData.category && (
                  <DetailItem label="Category" value={userData.category} icon={Store} />
                )}
                <DetailItem label="Role" value={role} icon={Briefcase} />
              </div>
            </section>
          )}

          {/* Section: Academic Information - STUDENT */}
          {role === 'student' && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><GraduationCap size={20} /></div>
                <h2 style={styles.sectionTitle}>Academic Information</h2>
              </div>
              <div style={styles.grid2Col}>
                <DetailItem label="University" value={userData.university?.name || 'N/A'} icon={GraduationCap} />
                <DetailItem label="Roll No" value={userData.rollNo || 'N/A'} icon={Hash} />
                <DetailItem label="Alumni" value={userData.isAlumni ? 'Yes' : 'No'} icon={Award} />
              </div>
              {userData.education && userData.education.length > 0 && (
                <div style={styles.educationContainer}>
                  <label style={styles.skillsLabel}>Education History</label>
                  {userData.education.map((edu, i) => (
                    <div key={i} style={styles.educationItem}>
                      <div style={styles.eduHeader}>
                        <span style={styles.eduSchool}>{edu.school}</span>
                        <span style={styles.eduYear}>{edu.startYear} - {edu.endYear}</span>
                      </div>
                      <span style={styles.eduDegree}>{edu.degree}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Section: Traveler Details - TRAVELER */}
          {role === 'traveler' && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><Plane size={20} /></div>
                <h2 style={styles.sectionTitle}>Traveler Details</h2>
              </div>
              <div style={styles.grid2Col}>
                <DetailItem label="Name" value={name} icon={User} />
                <DetailItem label="Phone" value={phone} icon={Phone} />
                <DetailItem label="Email" value={email} icon={Mail} />
                <DetailItem label="Location" value={location} icon={Globe} />
              </div>
            </section>
          )}

          {/* Section: Membership & Card - STUDENT ONLY */}
          {role === 'student' && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><CreditCard size={20} /></div>
                <h2 style={styles.sectionTitle}>Membership & Card</h2>
              </div>
              <div style={styles.grid2Col}>
                <DetailItem 
                  label="VIP Status" 
                  value={userData.isVip ? 'Active' : 'Not Active'} 
                  icon={Crown} 
                />
                {userData.isVip && userData.vipExpiry && (
                  <DetailItem 
                    label="VIP Expiry" 
                    value={new Date(userData.vipExpiry).toLocaleDateString()} 
                    icon={Calendar} 
                  />
                )}
                <DetailItem 
                  label="Card Status" 
                  value={userData.cardStatus || 'None'} 
                  icon={CreditCard} 
                />
                <DetailItem 
                  label="Payment Status" 
                  value={userData.paymentStatus || 'None'} 
                  icon={FileCheck} 
                />
                {userData.canApplyForTdcCard !== undefined && (
                  <DetailItem 
                    label="Can Apply for Card" 
                    value={userData.canApplyForTdcCard ? 'Yes' : 'No'} 
                    icon={CheckCircle} 
                  />
                )}
              </div>
            </section>
          )}

          {/* Section: Shipping Details - STUDENT ONLY */}
          {role === 'student' && userData.shippingDetails && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><MapPin size={20} /></div>
                <h2 style={styles.sectionTitle}>Shipping Details</h2>
              </div>
              <div style={styles.grid2Col}>
                <DetailItem label="Address" value={userData.shippingDetails.address} icon={MapPin} />
                <DetailItem label="City" value={userData.shippingDetails.city} icon={Globe} />
                <DetailItem label="Zip Code" value={userData.shippingDetails.zipCode} icon={Hash} />
                <DetailItem label="Phone" value={userData.shippingDetails.phone} icon={Phone} />
              </div>
            </section>
          )}

          {/* Section: Payment Receipt - STUDENT ONLY */}
          {role === 'student' && userData.paymentReceipt && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><FileText size={20} /></div>
                <h2 style={styles.sectionTitle}>Payment Receipt</h2>
              </div>
              <div style={styles.receiptContainer}>
                <img 
                  src={userData.paymentReceipt} 
                  alt="Payment Receipt" 
                  style={styles.receiptPreview}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </section>
          )}

          {/* Section: Brand Offers - BRAND ONLY */}
          {role === 'brand' && userDetails.offers && userDetails.offers.length > 0 && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><Gift size={20} /></div>
                <h2 style={styles.sectionTitle}>Brand Offers ({userDetails.offers.length})</h2>
              </div>
              <div style={styles.offerList}>
                {userDetails.offers.map((offer, i) => (
                  <div key={i} style={styles.offerItem}>
                    <span style={styles.offerTitle}>{offer.title}</span>
                    <span style={styles.offerDiscount}>{offer.discountPercentage}% off</span>
                    <span style={styles.offerStatus}>{offer.claimedBy?.length || 0} claims</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Employee Jobs - EMPLOYEE ONLY */}
          {role === 'employee' && userDetails.jobs && userDetails.jobs.length > 0 && (
            <section style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <div style={styles.headerIconBox}><Briefcase size={20} /></div>
                <h2 style={styles.sectionTitle}>Jobs Posted ({userDetails.jobs.length})</h2>
              </div>
              <div style={styles.jobList}>
                {userDetails.jobs.map((job, i) => (
                  <div key={i} style={styles.jobItem}>
                    <span style={styles.jobTitle}>{job.title}</span>
                    <span style={styles.jobStatus}>{job.active ? '🟢 Active' : '🔴 Inactive'}</span>
                    <span style={styles.jobApps}>{job.totalApplications || 0} applications</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Student Claims & Applications - STUDENT ONLY */}
          {role === 'student' && (
            <>
              {userDetails.claimedOffers && userDetails.claimedOffers.length > 0 && (
                <section style={styles.contentSection}>
                  <div style={styles.sectionHeader}>
                    <div style={styles.headerIconBox}><Ticket size={20} /></div>
                    <h2 style={styles.sectionTitle}>Claimed Discounts ({userDetails.claimedOffers.length})</h2>
                  </div>
                  <div style={styles.claimedList}>
                    {userDetails.claimedOffers.map((offer, i) => (
                      <div key={i} style={styles.claimedItem}>
                        <span style={styles.claimedTitle}>{offer.title}</span>
                        <span style={styles.claimedBrand}>{offer.brand?.name || 'Brand'}</span>
                        <span style={styles.claimedDiscount}>{offer.discountPercentage}% off</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {userDetails.applications && userDetails.applications.length > 0 && (
                <section style={styles.contentSection}>
                  <div style={styles.sectionHeader}>
                    <div style={styles.headerIconBox}><FileCheck size={20} /></div>
                    <h2 style={styles.sectionTitle}>Job Applications ({userDetails.applications.length})</h2>
                  </div>
                  <div style={styles.applicationList}>
                    {userDetails.applications.map((app, i) => (
                      <div key={i} style={styles.applicationItem}>
                        <span style={styles.applicationJob}>{app.jobId?.title || 'Job'}</span>
                        <span style={{
                          ...styles.applicationStatus,
                          background: {
                            'pending': '#f59e0b20',
                            'reviewed': '#3b82f620',
                            'shortlisted': '#10b98120',
                            'interview': '#8b5cf620',
                            'rejected': '#ef444420',
                            'hired': '#05966920'
                          }[app.status] || '#94a3b820',
                          color: {
                            'pending': '#f59e0b',
                            'reviewed': '#3b82f6',
                            'shortlisted': '#10b981',
                            'interview': '#8b5cf6',
                            'rejected': '#ef4444',
                            'hired': '#059669'
                          }[app.status] || '#94a3b8'
                        }}>
                          {app.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(userDetails.resume || userDetails.savings?.totalSaved > 0) && (
                <section style={styles.contentSection}>
                  <div style={styles.sectionHeader}>
                    <div style={styles.headerIconBox}><FileText size={20} /></div>
                    <h2 style={styles.sectionTitle}>Resume & Savings</h2>
                  </div>
                  <div style={styles.grid2Col}>
                    <DetailItem 
                      label="Resume" 
                      value={userDetails.resume ? 'Uploaded' : 'Not uploaded'} 
                      icon={FileText} 
                    />
                    {userDetails.savings?.totalSaved > 0 && (
                      <>
                        <DetailItem 
                          label="Total Savings" 
                          value={`PKR ${userDetails.savings.totalSaved.toLocaleString()}`} 
                          icon={Award} 
                        />
                        <DetailItem 
                          label="Redemptions" 
                          value={userDetails.savings.redemptionCount || 0} 
                          icon={Gift} 
                        />
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Section: Timestamps - ALL ROLES */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><Clock size={20} /></div>
              <h2 style={styles.sectionTitle}>Timestamps</h2>
            </div>
            <div style={styles.grid2Col}>
              <DetailItem 
                label="Joined" 
                value={new Date(userData.createdAt).toLocaleString()} 
                icon={Calendar} 
              />
              <DetailItem 
                label="Last Updated" 
                value={new Date(userData.updatedAt).toLocaleString()} 
                icon={Clock} 
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#000000',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    backgroundColor: '#000000',
    padding: '12px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.5px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  idBadge: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#EAB308',
    padding: '6px 14px',
    borderRadius: '4px',
    color: '#000000',
    fontWeight: 800
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '40px',
  },
  sidebar: {
    position: 'sticky',
    top: '100px',
    height: 'fit-content'
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px 24px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  },
  avatarContainer: {
    width: '110px',
    height: '110px',
    margin: '0 auto 20px',
    padding: '4px',
    borderRadius: '50%',
    border: '2px solid #EAB308',
    position: 'relative',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '42px',
    fontWeight: 900,
    color: '#FFFFFF',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  crownBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    fontSize: '24px',
    animation: 'crownFloat 2s ease-in-out infinite'
  },
  userName: { 
    fontSize: '22px', 
    fontWeight: 900, 
    margin: '0 0 8px', 
    color: '#000000', 
  },
  userSubHeader: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  vipBadge: {
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    color: '#d97706',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  alumniBadge: {
    background: '#eff6ff',
    color: '#3b82f6',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  referralLevelBadge: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  yellowDivider: { 
    height: '4px', 
    backgroundColor: '#EAB308', 
    width: '40px', 
    margin: '20px auto' 
  },
  contactStack: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    textAlign: 'left', 
    marginTop: '20px' 
  },
  contactLink: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    fontSize: '14px', 
    color: '#000000', 
    textDecoration: 'none', 
    fontWeight: 500,
    wordBreak: 'break-all',
    transition: 'color 0.2s'
  },
  socialLink: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    fontSize: '13px', 
    color: '#000000', 
    fontWeight: 800, 
    textDecoration: 'none', 
    borderTop: '1px solid #F1F5F9', 
    paddingTop: '15px',
    transition: 'color 0.2s'
  },
  contentArea: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px' 
  },
  quickStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    flexWrap: 'wrap'
  },
  quickStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
  },
  quickStatLabel: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  quickStatDivider: {
    width: '1px',
    height: '30px',
    background: '#e5e7eb',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px 28px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  sectionHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '24px' 
  },
  headerIconBox: { 
    backgroundColor: '#000000', 
    color: '#EAB308', 
    padding: '8px', 
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    flexShrink: 0
  },
  sectionTitle: { 
    fontSize: '16px', 
    fontWeight: 900, 
    color: '#000000', 
    margin: 0, 
    letterSpacing: '0.5px' 
  },
  grid2Col: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '12px' 
  },
  detailCard: { 
    padding: '12px 16px', 
    backgroundColor: '#F8FAFC', 
    borderRadius: '8px', 
    borderLeft: '3px solid #000000' 
  },
  detailLabelWrap: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '4px',
    flexWrap: 'wrap'
  },
  detailLabel: { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#64748b', 
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailValue: { 
    fontSize: '14px', 
    fontWeight: 600, 
    color: '#000000', 
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  copyHint: {
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    padding: '2px 4px',
    borderRadius: '4px'
  },
  skillsContainer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  skillsLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '8px'
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  skillTag: {
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  logoContainer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  logoPreview: {
    maxWidth: '120px',
    maxHeight: '80px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    objectFit: 'contain'
  },
  educationContainer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  educationItem: {
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  eduHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  eduSchool: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a'
  },
  eduYear: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 600
  },
  eduDegree: {
    fontSize: '12px',
    color: '#64748b'
  },
  receiptContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px'
  },
  receiptPreview: {
    maxWidth: '300px',
    maxHeight: '200px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    objectFit: 'contain'
  },
  offerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  offerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  offerTitle: {
    fontWeight: 600,
    color: '#0f172a'
  },
  offerDiscount: {
    color: '#f59e0b',
    fontWeight: 700
  },
  offerStatus: {
    color: '#64748b',
    fontSize: '12px'
  },
  jobList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  jobItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  jobTitle: {
    fontWeight: 600,
    color: '#0f172a'
  },
  jobStatus: {
    fontSize: '12px'
  },
  jobApps: {
    color: '#64748b',
    fontSize: '12px'
  },
  claimedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  claimedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  claimedTitle: {
    fontWeight: 600,
    color: '#0f172a'
  },
  claimedBrand: {
    color: '#64748b',
    fontSize: '12px'
  },
  claimedDiscount: {
    color: '#10b981',
    fontWeight: 700
  },
  applicationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  applicationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  applicationJob: {
    fontWeight: 600,
    color: '#0f172a'
  },
  applicationStatus: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700
  },
  errorContainer: { 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8FAFC',
    padding: '20px'
  },
  errorCard: { 
    textAlign: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: '60px', 
    borderRadius: '20px', 
    border: '1px solid #E2E8F0', 
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '100%'
  },
  primaryBtn: { 
    backgroundColor: '#000000', 
    color: '#EAB308', 
    border: 'none', 
    padding: '14px 28px', 
    borderRadius: '8px', 
    fontWeight: 900, 
    cursor: 'pointer', 
    fontSize: '13px', 
    letterSpacing: '1px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  secondaryBtn: { 
    backgroundColor: '#F1F5F9', 
    color: '#1E293B', 
    border: '2px solid #E2E8F0', 
    padding: '12px 28px', 
    borderRadius: '8px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    fontSize: '13px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  }
};

// Add animation keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes crownFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-3px) rotate(5deg); }
  }
  
  @media (max-width: 768px) {
    .main-container {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
      padding: 0 16px !important;
    }
    .sidebar {
      position: relative !important;
      top: 0 !important;
    }
    .grid-2-col {
      grid-template-columns: 1fr !important;
    }
    .nav-content {
      flex-direction: column !important;
      gap: 8px !important;
      align-items: flex-start !important;
      padding: 0 16px !important;
    }
    .content-section {
      padding: 16px !important;
    }
    .quick-stats {
      padding: 12px 16px !important;
      justify-content: center !important;
    }
    .error-card {
      padding: 30px !important;
    }
    .profile-card {
      padding: 24px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default UserDossier;