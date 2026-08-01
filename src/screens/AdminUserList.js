// AdminUserList.js - Complete Component with Password Management & QR Display
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { 
  Users, Download, Search, X, CheckCircle, Clock, 
  UserCheck, UserX, Mail, Building, Shield, Filter,
  ChevronRight, TrendingUp, Award, Sparkles, Eye,
  UserPlus, Link2, Phone, MapPin, Calendar, Star,
  CreditCard, Hash, User, GraduationCap, FileText,
  Crown, Zap, BarChart3, Gift, Trophy, Flame,
  ChevronDown, ChevronUp, RefreshCw, ArrowUpRight,
  Briefcase, HardHat, Plane, Store, Settings, Key,
  Image, Layers, PieChart, BookOpen, Briefcase as BriefcaseIcon,
  Ticket, ShoppingBag, FileCheck, Users as UsersIcon,
  QrCode, Copy, Download as DownloadIcon, Share2,
  ChevronLeft, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

export default function AdminUserList({ role, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReferral, setFilterReferral] = useState("all");
  const [togglingId, setTogglingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [userDetails, setUserDetails] = useState({
    offers: [],
    jobs: [],
    applications: [],
    claimedOffers: [],
    savings: [],
    resume: null,
    stats: {}
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState({});
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  
  // QR Code states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [selectedOfferForQR, setSelectedOfferForQR] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Refs for scroll management
  const modalRef = useRef(null);
  const modalBodyRef = useRef(null);
  const pageWrapperRef = useRef(null);
  const tableContainerRef = useRef(null);
  
  const navigate = useNavigate();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetchUsers();
  }, [role]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterReferral, sortField, sortDirection]);

  // Scroll to top when modal opens
  useEffect(() => {
    if (showModal && modalBodyRef.current) {
      setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [showModal]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/users/${role}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const refreshUsers = async () => {
    setRefreshing(true);
    await fetchUsers();
    setTimeout(() => setRefreshing(false), 500);
  };

  const downloadExcel = () => {
    const dataToExport = users.map((user) => ({
      'Full Name': user.name,
      'Email': user.email,
      'Phone': user.phone || 'N/A',
      'Role': user.role,
      'Status': user.status,
      'Brand/Company': user.brandName || user.companyName || 'N/A',
      'University': user.university?.name || 'N/A',
      'Roll No': user.rollNo || 'N/A',
      'Referral Code': user.referralCode || 'N/A',
      'Referral Count': user.referralCount || 0,
      'Referred By': user.referredBy?.name || 'None',
      'Is VIP': user.isVip ? 'Yes' : 'No',
      'Is Alumni': user.isAlumni ? 'Yes' : 'No',
      'Card Status': user.cardStatus || 'None',
      'Payment Status': user.paymentStatus || 'None',
      'Joined Date': new Date(user.createdAt).toLocaleDateString(),
      'Has Logo': user.logo ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `${role}_report_${Date.now()}.xlsx`);
  };

  const toggleVerification = async (id, e) => {
    e.stopPropagation();
    setTogglingId(id);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/approve-user/${id}`,
        { method: "POST", headers: getAuthHeaders() }
      );
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("Error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  const viewUserDetails = (userId) => {
    setShowModal(false);
    navigate('/dossier', { state: { userId } });
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await fetchUserCompleteDetails(user);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserDetails({
      offers: [],
      jobs: [],
      applications: [],
      claimedOffers: [],
      savings: [],
      resume: null,
      stats: {}
    });
    document.body.style.overflow = '';
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
        savings: [],
        resume: null,
        stats: {}
      };

      if (user.role === 'brand') {
        try {
          const offersRes = await fetch(
            `https://the-deft-crew-production.up.railway.app/api/offers/brand/${user._id}`,
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
            `https://the-deft-crew-production.up.railway.app/api/jobs/my-jobs`,
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
            `https://the-deft-crew-production.up.railway.app/api/offers/claimed`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const claimedData = await claimedRes.json();
          details.claimedOffers = Array.isArray(claimedData) ? claimedData : [];
          
          const savingsRes = await fetch(
            `https://the-deft-crew-production.up.railway.app/api/offers/my-total-savings`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const savingsData = await savingsRes.json();
          details.savings = savingsData || { totalSaved: 0, redemptionCount: 0 };
          
          const jobAppsRes = await fetch(
            `https://the-deft-crew-production.up.railway.app/api/jobs/my-applications`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const jobAppsData = await jobAppsRes.json();
          details.applications = Array.isArray(jobAppsData) ? jobAppsData : [];
          
          const resumeRes = await fetch(
            `https://the-deft-crew-production.up.railway.app/api/resume/primary`,
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

  const togglePasswordVisibility = async (userId, e) => {
    e.stopPropagation();
    
    if (showPassword[userId]) {
      setShowPassword(prev => ({
        ...prev,
        [userId]: false
      }));
      return;
    }

    const user = users.find(u => u._id === userId);
    if (user && user.password) {
      setShowPassword(prev => ({
        ...prev,
        [userId]: user.password
      }));
      return;
    }

    setLoadingPassword(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/users/password/${userId}`,
        { headers: getAuthHeaders() }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.password) {
        setShowPassword(prev => ({
          ...prev,
          [userId]: data.password
        }));
      } else {
        const userData = users.find(u => u._id === userId);
        if (userData && userData.password) {
          setShowPassword(prev => ({
            ...prev,
            [userId]: userData.password
          }));
        } else {
          setShowPassword(prev => ({
            ...prev,
            [userId]: 'No password found'
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching password:", err);
      const userData = users.find(u => u._id === userId);
      if (userData && userData.password) {
        setShowPassword(prev => ({
          ...prev,
          [userId]: userData.password
        }));
      } else {
        setShowPassword(prev => ({
          ...prev,
          [userId]: 'Error loading password'
        }));
      }
    } finally {
      setLoadingPassword(prev => ({ ...prev, [userId]: false }));
    }
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    if (!text || text === 'No password found' || text === 'Error loading password') return;
    navigator.clipboard.writeText(text).then(() => {
      alert('Password copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // QR Code Functions
  const generateQRForOffer = async (offer, brandUser, e) => {
    e.stopPropagation();
    setSelectedOfferForQR(offer);
    setGeneratingQR(true);
    
    try {
      const qrPayload = {
        type: 'offer',
        offerId: offer._id,
        brandId: brandUser._id,
        brandName: brandUser.brandName || brandUser.name || 'Brand',
        offerTitle: offer.title || 'Offer',
        discount: offer.discountPercentage || 0,
        timestamp: new Date().toISOString(),
        isOnline: offer.isOnline || false,
        isInStore: offer.isInStore || false,
        promoCode: offer.promoCode || null
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrImage(qrDataUrl);
      setQrData(qrPayload);
      setShowQRModal(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      alert("Failed to generate QR code for this offer");
    } finally {
      setGeneratingQR(false);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrImage(null);
    setQrData(null);
    setSelectedOfferForQR(null);
  };

  const downloadQR = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.download = `qr-${selectedOfferForQR?.title || 'offer'}-${selectedUser?.brandName || 'brand'}.png`;
      link.href = qrImage;
      link.click();
    }
  };

  const copyQRData = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareQR = async () => {
    if (qrImage) {
      try {
        const response = await fetch(qrImage);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: `${selectedUser?.brandName || 'Brand'} Discount QR Code`,
            text: `Scan this QR code to get ${selectedOfferForQR?.discountPercentage || 0}% off at ${selectedUser?.brandName || selectedUser?.name || 'Brand'}`,
            files: [file]
          });
        } else {
          await navigator.clipboard.writeText(qrImage);
          alert('QR code copied to clipboard!');
        }
      } catch (err) {
        console.error("Share error:", err);
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'student': return <GraduationCap size={14} />;
      case 'brand': return <Store size={14} />;
      case 'employee': return <Briefcase size={14} />;
      case 'traveler': return <Plane size={14} />;
      case 'admin': return <Shield size={14} />;
      default: return <User size={14} />;
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

  const handleStatClick = (filterType, value) => {
    setCurrentPage(1); // Reset to first page when filtering
    if (activeStatFilter === filterType) {
      setActiveStatFilter(null);
      setFilterStatus("all");
      setFilterReferral("all");
    } else {
      setActiveStatFilter(filterType);
      if (filterType === 'verified') {
        setFilterStatus("verified");
        setFilterReferral("all");
      } else if (filterType === 'pending') {
        setFilterStatus("pending");
        setFilterReferral("all");
      } else if (filterType === 'vip') {
        setFilterStatus("all");
        setFilterReferral("all");
      } else if (filterType === 'referrals') {
        setFilterStatus("all");
        setFilterReferral("high");
      }
    }
  };

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "verified" && user.status === "Verified") ||
        (filterStatus === "pending" && user.status !== "Verified");
      
      const matchesReferral = filterReferral === "all" ||
        (filterReferral === "high" && (user.referralCount || 0) >= 10) ||
        (filterReferral === "medium" && (user.referralCount || 0) >= 5 && (user.referralCount || 0) < 10) ||
        (filterReferral === "low" && (user.referralCount || 0) > 0 && (user.referralCount || 0) < 5) ||
        (filterReferral === "none" && (user.referralCount || 0) === 0);
      
      return matchesSearch && matchesStatus && matchesReferral;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'referralCount') {
        aVal = a.referralCount || 0;
        bVal = b.referralCount || 0;
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Get current page users
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredAndSortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const stats = {
    total: users.length,
    verified: users.filter(u => u.status === "Verified").length,
    pending: users.filter(u => u.status !== "Verified").length,
    vip: users.filter(u => u.isVip).length,
    totalReferrals: users.reduce((sum, u) => sum + (u.referralCount || 0), 0),
    topReferrers: users.filter(u => (u.referralCount || 0) >= 10).length,
    withLogo: users.filter(u => u.logo).length,
  };

  if (loading) {
    return (
      <motion.div 
        className="loader-container" 
        style={styles.loadingContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="spinner" 
          style={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p style={styles.loadingText}>Loading {role} records...</p>
        <div style={styles.loadingBar}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={styles.loadingProgress}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div style={styles.pageWrapper} ref={pageWrapperRef}>
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      <div style={styles.container}>
        {/* Header Section */}
        <motion.div 
          className="animate-header" 
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div style={styles.headerBadge}>
              {getRoleIcon(role)}
              <span>{role.charAt(0).toUpperCase() + role.slice(1)} Management</span>
            </div>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.subtitle}>
              Manage and monitor all {role} accounts in your platform
            </p>
          </div>
          <div style={styles.headerActions}>
            <motion.button
              className="refresh-btn"
              onClick={refreshUsers}
              style={styles.refreshBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </motion.button>
            <motion.button
              className="download-btn"
              onClick={downloadExcel}
              disabled={users.length === 0}
              style={{...styles.downloadBtn, opacity: users.length === 0 ? 0.5 : 1}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Summary - Clickable */}
        <motion.div 
          className="stats-group" 
          style={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { 
              icon: <Users size={16} />, 
              label: 'Total', 
              value: stats.total, 
              color: '#10b981', 
              bg: '#ecfdf5',
              filter: 'total'
            },
            { 
              icon: <CheckCircle size={16} />, 
              label: 'Verified', 
              value: stats.verified, 
              color: '#3b82f6', 
              bg: '#eff6ff',
              filter: 'verified'
            },
            { 
              icon: <Clock size={16} />, 
              label: 'Pending', 
              value: stats.pending, 
              color: '#f59e0b', 
              bg: '#fef3c7',
              filter: 'pending'
            },
            { 
              icon: <Crown size={16} />, 
              label: 'VIP', 
              value: stats.vip, 
              color: '#ec4899', 
              bg: '#fdf2f8',
              filter: 'vip'
            },
            { 
              icon: <Gift size={16} />, 
              label: 'Referrals', 
              value: stats.totalReferrals, 
              color: '#eab308', 
              bg: '#fefce8',
              filter: 'referrals'
            },
            { 
              icon: <Image size={16} />, 
              label: 'With Logo', 
              value: stats.withLogo, 
              color: '#8b5cf6', 
              bg: '#f5f3ff',
              filter: 'logo'
            },
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="stat-card" 
              style={{
                ...styles.statCard,
                cursor: stat.filter !== 'total' && stat.filter !== 'logo' ? 'pointer' : 'default',
                border: activeStatFilter === stat.filter ? `2px solid ${stat.color}` : '1px solid rgba(255,255,255,0.8)',
                background: activeStatFilter === stat.filter ? stat.bg : 'rgba(255,255,255,0.8)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + index * 0.03 }}
              whileHover={{ 
                y: -2, 
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                ...(stat.filter !== 'total' && stat.filter !== 'logo' ? { scale: 1.02 } : {})
              }}
              onClick={() => handleStatClick(stat.filter, stat.value)}
            >
              <div style={{...styles.statIcon, background: stat.bg, color: stat.color}}>
                {stat.icon}
              </div>
              <div>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
              {(stat.filter === 'verified' || stat.filter === 'pending' || stat.filter === 'vip' || stat.filter === 'referrals') && (
                <div style={{ marginLeft: 'auto', fontSize: '10px', color: stat.color, opacity: 0.5 }}>
                  {activeStatFilter === stat.filter ? '✓' : '↗'}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          className="animate-controls" 
          style={styles.controlsBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search by name, email, ${role === 'brand' || role === 'employee' ? 'company or ' : ''}referral code...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <motion.button 
                onClick={() => setSearchTerm("")} 
                style={styles.clearSearch}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
          <div style={styles.filterGroupWrapper}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
              <button
                className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterStatus === "all" ? styles.activeFilter : {})}}
                onClick={() => { setFilterStatus("all"); setActiveStatFilter(null); setCurrentPage(1); }}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterStatus === "verified" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterStatus === "verified" ? styles.activeFilter : {})}}
                onClick={() => { setFilterStatus("verified"); setActiveStatFilter('verified'); setCurrentPage(1); }}
              >
                <CheckCircle size={12} /> Verified
              </button>
              <button
                className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterStatus === "pending" ? styles.activeFilter : {})}}
                onClick={() => { setFilterStatus("pending"); setActiveStatFilter('pending'); setCurrentPage(1); }}
              >
                <Clock size={12} /> Pending
              </button>
            </div>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Referrals:</span>
              <button
                className={`filter-btn ${filterReferral === "all" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "all" ? styles.activeFilter : {})}}
                onClick={() => { setFilterReferral("all"); setActiveStatFilter(null); setCurrentPage(1); }}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterReferral === "high" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "high" ? styles.activeFilter : {})}}
                onClick={() => { setFilterReferral("high"); setActiveStatFilter('referrals'); setCurrentPage(1); }}
              >
                <Flame size={12} /> 10+
              </button>
              <button
                className={`filter-btn ${filterReferral === "medium" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "medium" ? styles.activeFilter : {})}}
                onClick={() => { setFilterReferral("medium"); setActiveStatFilter(null); setCurrentPage(1); }}
              >
                <TrendingUp size={12} /> 5-9
              </button>
              <button
                className={`filter-btn ${filterReferral === "low" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "low" ? styles.activeFilter : {})}}
                onClick={() => { setFilterReferral("low"); setActiveStatFilter(null); setCurrentPage(1); }}
              >
                <UserPlus size={12} /> 1-4
              </button>
              <button
                className={`filter-btn ${filterReferral === "none" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "none" ? styles.activeFilter : {})}}
                onClick={() => { setFilterReferral("none"); setActiveStatFilter(null); setCurrentPage(1); }}
              >
                <X size={12} /> 0
              </button>
            </div>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div 
          className="table-container" 
          style={styles.tableWrapper}
          ref={tableContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th} onClick={() => handleSort('name')} className="sortable">
                  USER {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('email')} className="sortable">
                  CONTACT {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {(role === "brand" || role === "employee") && (
                  <th style={styles.th} onClick={() => handleSort('brandName')} className="sortable">
                    COMPANY/BRAND {sortField === 'brandName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {role === "student" && (
                  <th style={styles.th} onClick={() => handleSort('university')} className="sortable">
                    UNIVERSITY {sortField === 'university' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                <th style={styles.th} onClick={() => handleSort('referralCount')} className="sortable">
                  REFERRAL {sortField === 'referralCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('status')} className="sortable">
                  STATUS {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{...styles.th, textAlign: 'center'}}>LOGO</th>
                <th style={{...styles.th, textAlign: 'center'}}>ROLE</th>
                <th style={{...styles.th, textAlign: 'center'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((u, index) => {
                  const referralLevel = getReferralLevel(u.referralCount);
                  const isTop = u.referralCount >= 10;
                  const roleColor = getRoleColor(u.role);
                  
                  return (
                    <motion.tr
                      key={u._id}
                      className="user-row"
                      style={{
                        ...styles.tr,
                        cursor: 'pointer',
                        ...(isTop ? styles.topReferrerRow : {}),
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      onClick={() => openUserModal(u)}
                    >
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{
                            ...styles.avatar,
                            ...(isTop ? styles.topAvatar : {})
                          }}>
                            {u.name?.charAt(0).toUpperCase() || '?'}
                            {isTop && <div style={styles.crownBadge}>👑</div>}
                          </div>
                          <div>
                            <span style={styles.userName}>{u.name}</span>
                            <div style={styles.userRole}>
                              {u.role} {u.isAlumni ? '• 🎓 Alumni' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.emailCell}>
                          <Mail size={12} color="#94a3b8" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div style={styles.phoneCell}>
                            <Phone size={12} color="#94a3b8" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      {(role === "brand" || role === "employee") && (
                        <td style={styles.td}>
                          <span style={styles.companyTag}>
                            <Building size={12} />
                            {u.brandName || u.companyName || "N/A"}
                          </span>
                          {u.logo && (
                            <div style={styles.logoIndicator}>
                              <Image size={10} color="#10b981" />
                              <span>Has Logo</span>
                            </div>
                          )}
                        </td>
                      )}
                      {role === "student" && (
                        <td style={styles.td}>
                          <span style={styles.universityTag}>
                            <Building size={12} />
                            {u.university?.name || "N/A"}
                          </span>
                          {u.rollNo && (
                            <div style={styles.rollNoText}>
                              <Hash size={10} />
                              {u.rollNo}
                            </div>
                          )}
                        </td>
                      )}
                      <td style={styles.td}>
                        <div style={styles.referralInfo}>
                          <div style={styles.referralCode}>
                            <Link2 size={12} color="#eab308" />
                            <code>{u.referralCode || 'N/A'}</code>
                          </div>
                          <div style={styles.referralStats}>
                            <div style={{
                              ...styles.referralBadge,
                              background: referralLevel.bg,
                              color: referralLevel.color,
                            }}>
                              <span style={styles.referralCountNumber}>
                                {u.referralCount || 0}
                              </span>
                              <span style={styles.referralLevelText}>
                                {referralLevel.icon} {referralLevel.level}
                              </span>
                            </div>
                            {isTop && (
                              <div style={styles.flameBadge}>
                                <Flame size={12} color="#8b5cf6" />
                                <span>Top</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: u.status === "Verified"
                              ? "#10b98115"
                              : "#f59e0b15",
                            color: u.status === "Verified" ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {u.status === "Verified" ? (
                            <>
                              <span style={styles.badgeDotVerified}></span>
                              Verified
                            </>
                          ) : (
                            <>
                              <span style={styles.badgeDotPending}></span>
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        {u.logo ? (
                          <img 
                            src={u.logo} 
                            alt="Logo" 
                            style={styles.logoThumb}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span style={{color:"#94a3b8"}}>—</span>';
                            }}
                          />
                        ) : (
                          <span style={{color: '#94a3b8'}}>—</span>
                        )}
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <span style={{
                          ...styles.roleBadge,
                          background: `${roleColor}15`,
                          color: roleColor,
                          border: `1px solid ${roleColor}30`,
                        }}>
                          {getRoleIcon(u.role)}
                          {u.role}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <div style={styles.actionGroup}>
                          <motion.button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewUserDetails(u._id);
                            }}
                            style={styles.viewBtn}
                            title="View Full Profile"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye size={14} />
                          </motion.button>
                          <motion.button
                            className="action-btn"
                            onClick={(e) => toggleVerification(u._id, e)}
                            disabled={togglingId === u._id}
                            style={{
                              ...styles.actionBtn,
                              backgroundColor: u.status === "Verified" ? "#ef444410" : "#10b98110",
                              color: u.status === "Verified" ? "#ef4444" : "#10b981",
                              border: u.status === "Verified"
                                ? "1px solid #ef444430"
                                : "1px solid #10b98130",
                            }}
                            title={u.status === "Verified" ? "Revoke Access" : "Approve User"}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {togglingId === u._id ? (
                              <div style={styles.spinnerSmall}></div>
                            ) : u.status === "Verified" ? (
                              <UserX size={14} />
                            ) : (
                              <UserCheck size={14} />
                            )}
                          </motion.button>
                          <motion.button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(u);
                            }}
                            style={styles.expandBtn}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View Details"
                          >
                            <ArrowUpRight size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <p style={styles.emptyTitle}>No users found</p>
                    <span style={styles.emptySubtext}>
                      {searchTerm ? "Try adjusting your search" : `No ${role} users registered yet`}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredAndSortedUsers.length > itemsPerPage && (
            <div style={styles.paginationWrapper}>
              <div style={styles.paginationInfo}>
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  style={{...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {})}}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  style={{...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {})}}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      ...styles.paginationBtn,
                      ...styles.paginationNumberBtn,
                      ...(page === currentPage ? styles.paginationActive : {})
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={{...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})}}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  style={{...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})}}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
              <div style={styles.paginationPageSize}>
                {itemsPerPage} per page
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Details Modal - Modern Design with QR for Brands */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <motion.div 
            className="modal-overlay" 
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="modal-content" 
              style={styles.modalContent}
              ref={modalRef}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {selectedUser.logo ? (
                      <img 
                        src={selectedUser.logo} 
                        alt="Logo" 
                        style={styles.modalAvatarImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = selectedUser.name?.charAt(0).toUpperCase() || 'U';
                        }}
                      />
                    ) : (
                      selectedUser.name?.charAt(0).toUpperCase() || 'U'
                    )}
                    {selectedUser.referralCount >= 10 && <div style={styles.modalCrown}>👑</div>}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{selectedUser.name}</h2>
                    <p style={styles.modalSubtitle}>
                      {selectedUser.role} • {selectedUser.email}
                    </p>
                  </div>
                </div>
                <motion.button 
                  onClick={closeModal} 
                  style={styles.modalCloseBtn}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Modal Body with scroll reference */}
              <div 
                style={styles.modalBody} 
                ref={modalBodyRef}
                className="modal-body"
              >
                {loadingDetails ? (
                  <div style={styles.loadingDetails}>
                    <div style={styles.spinnerSmall}></div>
                    <p>Loading user details...</p>
                  </div>
                ) : (
                  <>
                    {/* Quick Stats */}
                    <div style={styles.modalStats}>
                      <div style={styles.modalStat}>
                        <span style={styles.modalStatValue}>{selectedUser.referralCount || 0}</span>
                        <span style={styles.modalStatLabel}>Referrals</span>
                      </div>
                      <div style={styles.modalStatDivider} />
                      <div style={styles.modalStat}>
                        <span style={styles.modalStatValue}>{selectedUser.status === 'Verified' ? '✅' : '⏳'}</span>
                        <span style={styles.modalStatLabel}>{selectedUser.status}</span>
                      </div>
                      <div style={styles.modalStatDivider} />
                      <div style={styles.modalStat}>
                        <span style={styles.modalStatValue}>{selectedUser.isVip ? '⭐' : '—'}</span>
                        <span style={styles.modalStatLabel}>VIP</span>
                      </div>
                      <div style={styles.modalStatDivider} />
                      <div style={styles.modalStat}>
                        <span style={styles.modalStatValue}>{selectedUser.role}</span>
                        <span style={styles.modalStatLabel}>Role</span>
                      </div>
                    </div>

                    <div style={styles.modalGrid}>
                      {/* Personal Information */}
                      <div style={styles.modalSection}>
                        <h4 style={styles.modalSectionTitle}>
                          <User size={14} /> Personal Information
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Full Name</span>
                            <span style={styles.modalDetailValue}>{selectedUser.name}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Email</span>
                            <span style={styles.modalDetailValue}>{selectedUser.email}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Password</span>
                            <span style={styles.modalDetailValue}>
                              <span style={styles.passwordDisplay}>
                                {showPassword[selectedUser._id] ? (
                                  <span 
                                    style={{ 
                                      fontFamily: 'monospace', 
                                      fontSize: '12px',
                                      background: '#f1f5f9',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      wordBreak: 'break-all',
                                      maxWidth: '200px',
                                      display: 'inline-block',
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => copyToClipboard(showPassword[selectedUser._id], e)}
                                    title="Click to copy password"
                                  >
                                    {showPassword[selectedUser._id]}
                                  </span>
                                ) : (
                                  '********'
                                )}
                                <motion.button
                                  onClick={(e) => togglePasswordVisibility(selectedUser._id, e)}
                                  style={styles.passwordToggleBtn}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={showPassword[selectedUser._id] ? "Hide Password" : "Show Password"}
                                  disabled={loadingPassword[selectedUser._id]}
                                >
                                  {loadingPassword[selectedUser._id] ? (
                                    <div style={styles.spinnerSmall}></div>
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </motion.button>
                              </span>
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Phone</span>
                            <span style={styles.modalDetailValue}>{selectedUser.phone || 'N/A'}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Address</span>
                            <span style={styles.modalDetailValue}>{selectedUser.address || 'N/A'}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Location</span>
                            <span style={styles.modalDetailValue}>{selectedUser.location || 'N/A'}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Instagram</span>
                            <span style={styles.modalDetailValue}>{selectedUser.instagram || 'N/A'}</span>
                          </div>
                          {selectedUser.logo && (
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Logo</span>
                              <img 
                                src={selectedUser.logo} 
                                alt="Logo" 
                                style={styles.modalLogoPreview}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          {selectedUser.bio && (
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Bio</span>
                              <span style={styles.modalDetailValue}>{selectedUser.bio}</span>
                            </div>
                          )}
                          {selectedUser.headline && (
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Headline</span>
                              <span style={styles.modalDetailValue}>{selectedUser.headline}</span>
                            </div>
                          )}
                          {selectedUser.skills && selectedUser.skills.length > 0 && (
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Skills</span>
                              <div style={styles.modalSkillsList}>
                                {selectedUser.skills.map((skill, i) => (
                                  <span key={i} style={styles.modalSkillTag}>{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Brand/Employee Company Details */}
                      {(selectedUser.role === "brand" || selectedUser.role === "employee") && (
                        <div style={styles.modalSection}>
                          <h4 style={styles.modalSectionTitle}>
                            <Store size={14} /> Company Details
                          </h4>
                          <div style={styles.modalDetails}>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Name</span>
                              <span style={styles.modalDetailValue}>
                                {selectedUser.brandName || selectedUser.companyName || 'N/A'}
                              </span>
                            </div>
                            {selectedUser.role === "brand" && selectedUser.category && (
                              <div style={styles.modalDetailRow}>
                                <span style={styles.modalDetailLabel}>Category</span>
                                <span style={styles.modalDetailValue}>{selectedUser.category}</span>
                              </div>
                            )}
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Role</span>
                              <span style={styles.modalDetailValue}>
                                <span style={{
                                  ...styles.modalRoleBadge,
                                  background: `${getRoleColor(selectedUser.role)}15`,
                                  color: getRoleColor(selectedUser.role),
                                }}>
                                  {getRoleIcon(selectedUser.role)}
                                  {selectedUser.role}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Student Academic Info */}
                      {selectedUser.role === "student" && (
                        <div style={styles.modalSection}>
                          <h4 style={styles.modalSectionTitle}>
                            <GraduationCap size={14} /> Academic Information
                          </h4>
                          <div style={styles.modalDetails}>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>University</span>
                              <span style={styles.modalDetailValue}>{selectedUser.university?.name || 'N/A'}</span>
                            </div>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Roll No</span>
                              <span style={styles.modalDetailValue}>{selectedUser.rollNo || 'N/A'}</span>
                            </div>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Alumni</span>
                              <span style={styles.modalDetailValue}>{selectedUser.isAlumni ? '✅ Yes' : '❌ No'}</span>
                            </div>
                            {selectedUser.education && selectedUser.education.length > 0 && (
                              <div style={styles.modalDetailRow}>
                                <span style={styles.modalDetailLabel}>Education</span>
                                <div style={styles.modalEduList}>
                                  {selectedUser.education.map((edu, i) => (
                                    <div key={i} style={styles.modalEduItem}>
                                      <div style={styles.modalEduHeader}>
                                        <span style={{fontWeight: 600}}>{edu.school}</span>
                                        <span style={styles.modalEduYear}>{edu.startYear} - {edu.endYear}</span>
                                      </div>
                                      <div style={styles.modalEduDegree}>{edu.degree}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Traveler Details */}
                      {selectedUser.role === "traveler" && (
                        <div style={styles.modalSection}>
                          <h4 style={styles.modalSectionTitle}>
                            <Plane size={14} /> Traveler Details
                          </h4>
                          <div style={styles.modalDetails}>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Name</span>
                              <span style={styles.modalDetailValue}>{selectedUser.name}</span>
                            </div>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Phone</span>
                              <span style={styles.modalDetailValue}>{selectedUser.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Referral Information - ALL ROLES */}
                      <div style={styles.modalSection}>
                        <h4 style={styles.modalSectionTitle}>
                          <UserPlus size={14} /> Referral Information
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Code</span>
                            <code style={styles.modalReferralCode}>{selectedUser.referralCode || 'N/A'}</code>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Count</span>
                            <span style={styles.modalDetailValue}>
                              <span style={{
                                ...styles.modalReferralBadge,
                                ...(selectedUser.referralCount >= 10 ? styles.modalTopReferralBadge : {})
                              }}>
                                {selectedUser.referralCount || 0}
                                {selectedUser.referralCount >= 10 && ' 🔥'}
                              </span>
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Level</span>
                            <span style={styles.modalDetailValue}>
                              <span style={{
                                ...styles.modalLevelBadge,
                                background: getReferralLevel(selectedUser.referralCount).bg,
                                color: getReferralLevel(selectedUser.referralCount).color,
                              }}>
                                {getReferralLevel(selectedUser.referralCount).icon} {getReferralLevel(selectedUser.referralCount).level}
                              </span>
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referred By</span>
                            <span style={styles.modalDetailValue}>{selectedUser.referredBy?.name || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      {/* BRAND OFFERS WITH QR GENERATION - ONLY FOR BRANDS */}
                      {selectedUser.role === "brand" && userDetails.offers && userDetails.offers.length > 0 && (
                        <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                          <h4 style={styles.modalSectionTitle}>
                            <Gift size={14} /> Brand Offers ({userDetails.offers.length})
                          </h4>
                          <div style={styles.offerList}>
                            {userDetails.offers.slice(0, 5).map((offer, i) => (
                              <div key={i} style={styles.offerItem}>
                                <div style={styles.offerItemLeft}>
                                  <span style={styles.offerTitle}>{offer.title}</span>
                                  <span style={styles.offerDiscount}>{offer.discountPercentage}% off</span>
                                  <span style={styles.offerStatus}>
                                    {offer.claimedBy?.length || 0} claims
                                  </span>
                                </div>
                                <div style={styles.offerItemRight}>
                                  {offer.isOnline && offer.isInStore && (
                                    <span style={{...styles.badgeSmall, background: '#8b5cf6'}}>Online & In-Store</span>
                                  )}
                                  {offer.isOnline && !offer.isInStore && (
                                    <span style={{...styles.badgeSmall, background: '#3b82f6'}}>Online</span>
                                  )}
                                  {!offer.isOnline && offer.isInStore && (
                                    <span style={{...styles.badgeSmall, background: '#10b981'}}>In-Store</span>
                                  )}
                                  <motion.button
                                    className="qr-generate-btn"
                                    onClick={(e) => generateQRForOffer(offer, selectedUser, e)}
                                    style={styles.qrGenerateBtn}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={generatingQR}
                                    title="Generate QR Code for this offer"
                                  >
                                    {generatingQR && selectedOfferForQR?._id === offer._id ? (
                                      <div style={styles.spinnerSmall}></div>
                                    ) : (
                                      <QrCode size={14} />
                                    )}
                                    <span style={styles.qrBtnText}>QR</span>
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                            {userDetails.offers.length > 5 && (
                              <div style={styles.moreItems}>+{userDetails.offers.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Employee Jobs - ONLY EMPLOYEES */}
                      {selectedUser.role === "employee" && userDetails.jobs && userDetails.jobs.length > 0 && (
                        <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                          <h4 style={styles.modalSectionTitle}>
                            <BriefcaseIcon size={14} /> Jobs Posted ({userDetails.jobs.length})
                          </h4>
                          <div style={styles.jobList}>
                            {userDetails.jobs.slice(0, 5).map((job, i) => (
                              <div key={i} style={styles.jobItem}>
                                <span style={styles.jobTitle}>{job.title}</span>
                                <span style={styles.jobStatus}>
                                  {job.active ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                                <span style={styles.jobApps}>
                                  {job.totalApplications || 0} applications
                                </span>
                              </div>
                            ))}
                            {userDetails.jobs.length > 5 && (
                              <div style={styles.moreItems}>+{userDetails.jobs.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Student Discounts & Applications - ONLY STUDENTS */}
                      {selectedUser.role === "student" && (
                        <>
                          {userDetails.claimedOffers && userDetails.claimedOffers.length > 0 && (
                            <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                              <h4 style={styles.modalSectionTitle}>
                                <Ticket size={14} /> Claimed Discounts ({userDetails.claimedOffers.length})
                              </h4>
                              <div style={styles.claimedList}>
                                {userDetails.claimedOffers.slice(0, 5).map((offer, i) => (
                                  <div key={i} style={styles.claimedItem}>
                                    <span style={styles.claimedTitle}>{offer.title}</span>
                                    <span style={styles.claimedBrand}>{offer.brand?.name || 'Brand'}</span>
                                    <span style={styles.claimedDiscount}>{offer.discountPercentage}% off</span>
                                  </div>
                                ))}
                                {userDetails.claimedOffers.length > 5 && (
                                  <div style={styles.moreItems}>+{userDetails.claimedOffers.length - 5} more</div>
                                )}
                              </div>
                            </div>
                          )}

                          {userDetails.applications && userDetails.applications.length > 0 && (
                            <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                              <h4 style={styles.modalSectionTitle}>
                                <FileCheck size={14} /> Job Applications ({userDetails.applications.length})
                              </h4>
                              <div style={styles.applicationList}>
                                {userDetails.applications.slice(0, 5).map((app, i) => (
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
                                {userDetails.applications.length > 5 && (
                                  <div style={styles.moreItems}>+{userDetails.applications.length - 5} more</div>
                                )}
                              </div>
                            </div>
                          )}

                          {(userDetails.resume || userDetails.savings?.totalSaved > 0) && (
                            <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                              <h4 style={styles.modalSectionTitle}>
                                <FileText size={14} /> Resume & Savings
                              </h4>
                              <div style={styles.modalDetails}>
                                <div style={styles.modalDetailRow}>
                                  <span style={styles.modalDetailLabel}>Resume</span>
                                  <span style={styles.modalDetailValue}>
                                    {userDetails.resume ? '✅ Uploaded' : '❌ Not uploaded'}
                                  </span>
                                </div>
                                {userDetails.savings?.totalSaved > 0 && (
                                  <>
                                    <div style={styles.modalDetailRow}>
                                      <span style={styles.modalDetailLabel}>Total Savings</span>
                                      <span style={styles.modalDetailValue}>
                                        PKR {userDetails.savings.totalSaved.toLocaleString()}
                                      </span>
                                    </div>
                                    <div style={styles.modalDetailRow}>
                                      <span style={styles.modalDetailLabel}>Redemptions</span>
                                      <span style={styles.modalDetailValue}>
                                        {userDetails.savings.redemptionCount || 0}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Timestamps - ALL ROLES */}
                      <div style={{...styles.modalSection, gridColumn: 'span 2'}}>
                        <h4 style={styles.modalSectionTitle}>
                          <Calendar size={14} /> Timestamps
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Joined</span>
                            <span style={styles.modalDetailValue}>
                              {new Date(selectedUser.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Last Updated</span>
                            <span style={styles.modalDetailValue}>
                              {new Date(selectedUser.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div style={styles.modalFooter}>
                <motion.button 
                  onClick={() => viewUserDetails(selectedUser._id)}
                  style={styles.modalViewBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Full Profile <ChevronRight size={16} />
                </motion.button>
                <motion.button 
                  onClick={closeModal}
                  style={styles.modalCloseBtnBottom}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal - Full Screen Display */}
      <AnimatePresence>
        {showQRModal && qrImage && selectedOfferForQR && (
          <motion.div 
            style={styles.qrModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQRModal}
          >
            <motion.div 
              style={styles.qrModalContent}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.qrModalHeader}>
                <div>
                  <h3 style={styles.qrModalTitle}>
                    <QrCode size={20} style={{ marginRight: '8px', color: '#ff961a' }} />
                    QR Code - {selectedUser?.brandName || 'Brand'}
                  </h3>
                  <p style={styles.qrModalSubtitle}>
                    {selectedOfferForQR.title} • {selectedOfferForQR.discountPercentage}% OFF
                  </p>
                </div>
                <motion.button 
                  onClick={closeQRModal}
                  style={styles.qrModalCloseBtn}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div style={styles.qrModalBody}>
                <div style={styles.qrImageContainer}>
                  <img src={qrImage} alt="QR Code" style={styles.qrModalImage} />
                </div>

                <div style={styles.qrOfferDetails}>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Brand:</span>
                    <span style={styles.qrOfferValue}>{selectedUser?.brandName || selectedUser?.name || 'Brand'}</span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Offer:</span>
                    <span style={styles.qrOfferValue}>{selectedOfferForQR.title}</span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Discount:</span>
                    <span style={{...styles.qrOfferValue, color: '#ff961a', fontWeight: 700}}>
                      {selectedOfferForQR.discountPercentage}% OFF
                    </span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Type:</span>
                    <span style={styles.qrOfferValue}>
                      {selectedOfferForQR.isOnline && selectedOfferForQR.isInStore ? (
                        <span style={{...styles.badgeSmall, background: '#8b5cf6'}}>Online & In-Store</span>
                      ) : selectedOfferForQR.isOnline ? (
                        <span style={{...styles.badgeSmall, background: '#3b82f6'}}>Online Only</span>
                      ) : selectedOfferForQR.isInStore ? (
                        <span style={{...styles.badgeSmall, background: '#10b981'}}>In-Store Only</span>
                      ) : (
                        <span style={{...styles.badgeSmall, background: '#94a3b8'}}>Standard</span>
                      )}
                    </span>
                  </div>
                  {selectedOfferForQR.promoCode && (
                    <div style={styles.qrOfferRow}>
                      <span style={styles.qrOfferLabel}>Promo Code:</span>
                      <span style={{...styles.qrOfferValue, fontFamily: 'monospace', fontWeight: 700, color: '#0369a1'}}>
                        {selectedOfferForQR.promoCode}
                      </span>
                    </div>
                  )}
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Generated:</span>
                    <span style={styles.qrOfferValue}>
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={styles.qrModalActions}>
                  <motion.button 
                    style={{...styles.qrActionBtn, background: '#1e293b', color: '#fff'}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadQR}
                  >
                    <DownloadIcon size={16} /> Download
                  </motion.button>
                  <motion.button 
                    style={{...styles.qrActionBtn, background: '#8b5cf6', color: '#fff'}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareQR}
                  >
                    <Share2 size={16} /> Share
                  </motion.button>
                  <motion.button 
                    style={{...styles.qrActionBtn, background: '#10b981', color: '#fff'}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyQRData}
                  >
                    <Copy size={16} /> {copied ? 'Copied!' : 'Copy Data'}
                  </motion.button>
                </div>

                <div style={styles.qrScanInstructions}>
                  <p style={styles.qrScanText}>
                    📱 Students can scan this QR code to claim this discount
                  </p>
                  <p style={styles.qrScanSubtext}>
                    The QR code contains all necessary information for verification
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes crownFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-3px) rotate(5deg); }
          }
          @keyframes flamePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          @keyframes qrModalIn {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          
          .spinning { animation: spin 1s linear infinite; }
          
          .stat-card { transition: all 0.3s ease; }
          .stat-card:hover { cursor: pointer; }
          
          .filter-btn { transition: all 0.2s ease; }
          .filter-btn.active {
            background: #fff;
            color: #ff961a;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .user-row { transition: all 0.2s ease; }
          .user-row.top-referrer {
            background: linear-gradient(90deg, #faf5ff 0%, #ffffff 100%);
            border-left: 3px solid #8b5cf6;
          }
          
          .sortable { cursor: pointer; user-select: none; }
          .sortable:hover { color: #0a0b0f; }
          
          .action-btn { transition: all 0.2s ease; }
          .qr-generate-btn { transition: all 0.2s ease; }

          /* Modal Styles */
          .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(15, 23, 42, 0.75) !important;
            backdrop-filter: blur(8px) !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            z-index: 9999 !important;
            padding: 20px !important;
            overflow-y: auto !important;
          }

          .modal-content {
            margin-top: 30px !important;
            margin-bottom: 30px !important;
            max-width: 820px !important;
            width: 100% !important;
            max-height: 90vh !important;
            background: #fff !important;
            border-radius: 24px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3) !important;
            position: relative !important;
          }

          .modal-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 20px 24px !important;
            max-height: calc(90vh - 180px) !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .modal-body::-webkit-scrollbar { width: 6px; }
          .modal-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          .modal-body::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }

          @media (max-width: 768px) {
            .stat-card { min-width: unset !important; }
            .header { flex-direction: column !important; align-items: stretch !important; }
            .headerActions { flex-direction: column !important; align-items: stretch !important; }
            .filterGroupWrapper { flex-direction: column !important; }
            .filterGroup { flex-wrap: wrap !important; }
            .modalGrid { grid-template-columns: 1fr !important; }
            .modal-content { max-width: 98% !important; max-height: 95vh !important; margin-top: 10px !important; margin-bottom: 10px !important; }
            .modal-body { max-height: calc(95vh - 180px) !important; padding: 16px !important; }
            .modal-overlay { padding: 10px !important; align-items: flex-start !important; }
            .offerItem { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
            .offerItemRight { width: 100% !important; justify-content: flex-start !important; flex-wrap: wrap !important; }
            .qrModalContent { max-width: 98% !important; margin: 10px !important; }
            .qrModalImage { width: 200px !important; height: 200px !important; }
            .qrModalActions { flex-direction: column !important; }
            .qrActionBtn { width: 100% !important; justify-content: center !important; }
            .paginationWrapper { flex-direction: column !important; gap: 12px !important; align-items: center !important; }
            .paginationControls { flex-wrap: wrap !important; justify-content: center !important; }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '25px 35px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
    borderRadius: '32px',
    overflow: 'hidden'
  },
  bgDecoration1: {
    position: 'absolute',
    top: '-100px',
    right: '-50px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-60px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, rgba(139,92,246,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.02) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  container: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: 'blur(20px)',
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    maxWidth: "1600px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "12px"
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  refreshBtn: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  title: {
    margin: 0,
    color: "#0a0b0f",
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#6c6f78",
    fontSize: "14px",
    fontWeight: "400",
  },
  downloadBtn: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: 'blur(10px)',
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    transition: "all 0.3s ease",
  },
  statIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  controlsBar: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "380px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 42px",
    fontSize: "14px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    transition: "all 0.2s ease",
    outline: "none",
    color: "#1e293b",
    fontFamily: "inherit",
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "50%",
  },
  filterGroupWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "4px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px",
    borderRadius: "30px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    padding: "0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterBtn: {
    padding: "5px 12px",
    borderRadius: "24px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  activeFilter: {
    background: "#fff",
    color: "#ff961a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "16px",
    border: "1px solid rgba(240, 242, 245, 0.8)",
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: 'blur(10px)',
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  theadRow: {
    borderBottom: "1px solid #f0f2f5",
    background: "rgba(250, 251, 252, 0.8)",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f5f7fa",
    transition: "background 0.2s ease",
  },
  topReferrerRow: {
    background: "linear-gradient(90deg, #faf5ff 0%, #ffffff 100%)",
    borderLeft: "3px solid #8b5cf6",
  },
  td: {
    padding: "12px 16px",
    fontSize: "13px",
    color: "#1e293b",
    verticalAlign: "middle",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ff961a10 0%, #f3b24510 100%)",
    color: "#ff961a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
    position: "relative",
  },
  topAvatar: {
    background: "linear-gradient(135deg, #8b5cf620 0%, #a78bfa20 100%)",
    color: "#8b5cf6",
    border: "2px solid #8b5cf6",
  },
  crownBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    fontSize: "12px",
    animation: "crownFloat 2s ease-in-out infinite",
  },
  userName: {
    fontWeight: "600",
    color: "#1e293b",
    display: "block",
    fontSize: "13px",
  },
  userRole: {
    fontSize: "10px",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  emailCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#475569",
    fontSize: "12px",
    marginBottom: "2px",
  },
  phoneCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#64748b",
    fontSize: "11px",
  },
  companyTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "500",
    color: "#475569",
  },
  designationText: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  universityTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "500",
    color: "#475569",
  },
  rollNoText: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  referralInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  referralCode: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
  },
  referralStats: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  referralBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "16px",
    fontSize: "11px",
    fontWeight: "600",
  },
  referralCountNumber: {
    fontWeight: "700",
    fontSize: "13px",
  },
  referralLevelText: {
    fontSize: "9px",
    opacity: 0.8,
  },
  flameBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f5f3ff",
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "700",
    color: "#8b5cf6",
    animation: "flamePulse 2s ease-in-out infinite",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  badgeDotVerified: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    display: "inline-block",
  },
  badgeDotPending: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#f59e0b",
    display: "inline-block",
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  viewBtn: {
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
  },
  expandBtn: {
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    overflowY: 'auto',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '24px',
    maxWidth: '820px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '30px',
    marginBottom: '30px',
  },
  modalHeader: {
    padding: '20px 28px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
    flexShrink: 0,
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  modalAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  modalCrown: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    fontSize: '16px',
    animation: 'crownFloat 2s ease-in-out infinite',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '2px',
  },
  modalCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
    maxHeight: 'calc(90vh - 180px)',
    '-webkit-overflow-scrolling': 'touch',
  },
  modalStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '20px',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  modalStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  modalStatLabel: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  modalStatDivider: {
    width: '1px',
    height: '30px',
    background: '#e5e7eb',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  modalSection: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #f1f5f9',
  },
  modalSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px 0',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '12px',
    gap: '8px',
  },
  modalDetailLabel: {
    color: '#64748b',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    minWidth: '80px',
  },
  modalDetailValue: {
    color: '#0f172a',
    textAlign: 'right',
    wordBreak: 'break-word',
    fontWeight: '500',
  },
  modalRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalReferralCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: '600',
    color: '#eab308',
    background: '#fefce8',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  modalReferralBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    color: '#d97706',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '12px',
  },
  modalTopReferralBadge: {
    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    color: '#8b5cf6',
  },
  modalLevelBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  modalVipBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    color: '#d97706',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  modalCardStatus: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  modalPaymentStatus: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  modalEduList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  modalEduItem: {
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    width: '100%',
  },
  modalEduHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    marginBottom: '2px',
    flexWrap: 'wrap',
    gap: '4px',
  },
  modalEduYear: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalEduDegree: {
    fontSize: '11px',
    color: '#64748b',
  },
  modalSkillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    justifyContent: 'flex-end',
  },
  modalSkillTag: {
    padding: '2px 8px',
    background: '#f1f5f9',
    borderRadius: '8px',
    fontSize: '10px',
    color: '#475569',
    fontWeight: '500',
  },
  passwordDisplay: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  passwordToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalReceiptPreview: {
    maxWidth: '200px',
    maxHeight: '150px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    objectFit: 'cover',
  },
  modalLogoPreview: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb',
  },
  logoThumb: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb',
  },
  logoIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#10b981',
    marginTop: '2px',
  },
  offerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  offerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  offerTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  offerDiscount: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  offerStatus: {
    color: '#64748b',
    fontSize: '11px',
  },
  jobList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  jobItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  jobTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  jobStatus: {
    fontSize: '11px',
  },
  jobApps: {
    color: '#64748b',
    fontSize: '11px',
  },
  claimedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  claimedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  claimedTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  claimedBrand: {
    color: '#64748b',
    fontSize: '11px',
  },
  claimedDiscount: {
    color: '#10b981',
    fontWeight: '600',
  },
  applicationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  applicationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  applicationJob: {
    fontWeight: '500',
    color: '#0f172a',
  },
  applicationStatus: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
  },
  moreItems: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    padding: '4px',
  },
  noItems: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '8px',
  },
  loadingDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
    color: '#64748b',
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#ff961a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  modalFooter: {
    padding: '16px 28px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  modalViewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalCloseBtnBottom: {
    padding: '8px 24px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    background: '#fff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },
  emptySubtext: {
    fontSize: "12px",
    color: "#cbd5e1",
    display: "block",
    marginTop: "6px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: 'blur(20px)',
    borderRadius: "28px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
    minHeight: "400px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#ff961a",
    borderRadius: "50%",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
  loadingBar: {
    width: "200px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  loadingProgress: {
    height: "100%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "4px",
  },
  offerItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    flex: 1,
  },
  offerItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badgeSmall: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '600',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  qrGenerateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'linear-gradient(135deg, #ff961a 0%, #f3b245 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  qrBtnText: {
    fontSize: '10px',
    fontWeight: '600',
  },
  
  // QR Modal Styles
  qrModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  },
  qrModalContent: {
    background: '#fff',
    borderRadius: '28px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)',
    animation: 'qrModalIn 0.3s ease forwards',
  },
  qrModalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  qrModalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  qrModalCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  qrModalBody: {
    padding: '24px',
  },
  qrImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  qrModalImage: {
    width: '280px',
    height: '280px',
    borderRadius: '16px',
    border: '3px solid #f1f5f9',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  qrOfferDetails: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  qrOfferRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
  },
  qrOfferLabel: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  qrOfferValue: {
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'right',
  },
  qrModalActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  qrActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  qrScanInstructions: {
    textAlign: 'center',
    padding: '12px',
    background: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
  },
  // Pagination Styles
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '12px',
    background: 'rgba(255,255,255,0.4)',
    borderRadius: '0 0 16px 16px',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  paginationBtn: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
  },
  paginationNumberBtn: {
    minWidth: '36px',
    height: '36px',
  },
  paginationActive: {
    background: 'linear-gradient(135deg, #ff961a 0%, #f3b245 100%)',
    color: '#fff',
    borderColor: '#ff961a',
  },
  paginationBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  paginationPageSize: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
};