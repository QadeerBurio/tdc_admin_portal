import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaClock,
  FaVideo,
  FaTrash,
  FaEdit,
  FaCheck,
  FaPlus,
  FaSpinner,
  FaUsers,
  FaBriefcase,
  FaEnvelope,
  FaPhone,
  FaChevronDown,
  FaMapMarkerAlt,
  FaStar,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaFilter,
  FaSearch,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaClock as FaClockIcon,
  FaCalendarCheck,
  FaRocket,
  FaUserCheck,
  FaBuilding,
  FaUserTie,
  FaThumbsUp,
  FaRegClock,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const InterviewsManager = ({ token }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    upcoming: 0,
    today: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsForScheduling();
  }, []);

  const showNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/interviews/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(res.data);
      calculateStats(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("Failed to load interviews. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInterviews = data.filter(i => {
      const date = new Date(i.interviewDate);
      return i.status === "interview" && date >= today && date < tomorrow;
    });

    const pending = data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length;
    const completed = data.filter(i => i.status === "completed" || i.status === "hired").length;

    setStats({
      total: data.length,
      pending,
      completed,
      upcoming: data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length,
      today: todayInterviews.length,
    });
  };

  const fetchApplicationsForScheduling = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/all?status=shortlisted", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const scheduleInterview = async () => {
    if (!selectedApplication) {
      showNotification("Please select a candidate", "error");
      return;
    }
    
    if (!interviewDate) {
      showNotification("Please select an interview date and time", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/schedule`,
        {
          applicationId: selectedApplication,
          interviewDate: new Date(interviewDate).toISOString(),
          interviewNotes: interviewNotes,
          meetingLink: meetingLink
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      showNotification("Interview scheduled successfully!", "success");
      setShowScheduleModal(false);
      resetForm();
      fetchInterviews();
      fetchApplicationsForScheduling();
    } catch (err) {
      console.error("Error scheduling interview:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to schedule interview";
      showNotification(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const rescheduleInterview = async (interviewId, currentDate) => {
    const newDate = prompt("Enter new interview date and time (YYYY-MM-DD HH:MM):\n\nExample: 2024-12-25 14:30", 
      currentDate ? new Date(currentDate).toISOString().slice(0, 16).replace('T', ' ') : "");
    
    if (newDate) {
      setActionInProgress(interviewId);
      try {
        const formattedDate = new Date(newDate.replace(' ', 'T'));
        if (isNaN(formattedDate.getTime())) {
          showNotification("Invalid date format. Please use YYYY-MM-DD HH:MM", "error");
          setActionInProgress(null);
          return;
        }
        
        await axios.put(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/reschedule/${interviewId}`,
          {
            interviewDate: formattedDate.toISOString(),
            interviewNotes: "Interview rescheduled"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview rescheduled successfully", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error rescheduling:", err);
        showNotification(err.response?.data?.message || "Failed to reschedule interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const cancelInterview = async (interviewId, candidateName) => {
    if (window.confirm(`Are you sure you want to cancel the interview with ${candidateName}?`)) {
      setActionInProgress(interviewId);
      try {
        await axios.delete(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/cancel/${interviewId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview cancelled successfully", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error cancelling:", err);
        showNotification(err.response?.data?.message || "Failed to cancel interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const completeInterview = async (interviewId, candidateName) => {
    const feedback = prompt(`Enter interview feedback for ${candidateName}:`);
    if (feedback !== null) {
      setActionInProgress(interviewId);
      try {
        await axios.patch(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/complete/${interviewId}`,
          { feedback },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview marked as completed", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error completing interview:", err);
        showNotification(err.response?.data?.message || "Failed to complete interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const resetForm = () => {
    setSelectedApplication(null);
    setInterviewDate("");
    setInterviewNotes("");
    setMeetingLink("");
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳", label: "Pending" },
      reviewed: { bg: "#dbeafe", color: "#2563eb", icon: "👀", label: "Reviewed" },
      shortlisted: { bg: "#d1fae5", color: "#059669", icon: "⭐", label: "Shortlisted" },
      interview: { bg: "#ede9fe", color: "#7c3aed", icon: "🎯", label: "Scheduled" },
      completed: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Completed" },
      hired: { bg: "#d1fae5", color: "#059669", icon: "🎉", label: "Hired" },
      rejected: { bg: "#fee2e2", color: "#dc2626", icon: "❌", label: "Rejected" }
    };
    return configs[status] || configs.pending;
  };

  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  const isToday = (date) => {
    const today = new Date();
    const interviewDate = new Date(date);
    return interviewDate.getDate() === today.getDate() &&
           interviewDate.getMonth() === today.getMonth() &&
           interviewDate.getFullYear() === today.getFullYear();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (date) => {
    const now = new Date();
    const interviewDate = new Date(date);
    const diff = interviewDate - now;
    if (diff < 0) return "Past";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter and search
  const filteredInterviews = interviews
    .filter(i => 
      i.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobId?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(i => statusFilter ? i.status === statusFilter : true)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInterviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);

  // Mobile Interview Card Component
  const MobileInterviewCard = ({ interview }) => {
    const statusConfig = getStatusConfig(interview.status);
    const upcoming = isUpcoming(interview.interviewDate);
    const today = isToday(interview.interviewDate);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={styles.mobileCard}
      >
        <div style={styles.mobileCardHeader}>
          <div style={styles.mobileCardUser}>
            <div style={styles.mobileCardAvatar}>
              {interview.fullName?.charAt(0) || "A"}
              {today && upcoming && <span style={styles.mobileTodayBadge}>Today</span>}
            </div>
            <div style={styles.mobileCardUserInfo}>
              <div style={styles.mobileCardName}>{interview.fullName}</div>
              <div style={styles.mobileCardEmail}>
                <FaEnvelope size={10} /> {interview.email}
              </div>
            </div>
          </div>
          <span style={{
            ...styles.statusBadge,
            background: statusConfig.bg,
            color: statusConfig.color,
            fontSize: isMobile ? "10px" : "12px",
            padding: isMobile ? "2px 8px" : "4px 12px",
          }}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        <div style={styles.mobileCardDetails}>
          <div style={styles.mobileCardDetail}>
            <FaBuilding size={12} /> {interview.jobId?.title || "N/A"}
          </div>
          <div style={styles.mobileCardDetail}>
            <FaCalendarAlt size={12} /> {formatDate(interview.interviewDate)}
          </div>
          <div style={styles.mobileCardDetail}>
            <FaClock size={12} /> {formatTime(interview.interviewDate)}
          </div>
          {upcoming && (
            <div style={styles.mobileCardDetail}>
              <span style={styles.mobileTimeRemaining}>
                ⏱ {getTimeRemaining(interview.interviewDate)}
              </span>
            </div>
          )}
        </div>

        <div style={styles.mobileCardActions}>
          {interview.meetingLink && (
            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.mobileMeetingLink}>
              <FaVideo size={12} /> Join
            </a>
          )}
          <div style={styles.mobileActionGroup}>
            <button 
              style={styles.mobileActionBtn} 
              onClick={() => rescheduleInterview(interview._id, interview.interviewDate)}
              disabled={actionInProgress === interview._id}
            >
              <FaEdit size={12} />
            </button>
            {interview.status !== "completed" && interview.status !== "hired" && (
              <button 
                style={{ ...styles.mobileActionBtn, background: "#10b981", color: "#fff" }}
                onClick={() => completeInterview(interview._id, interview.fullName)}
                disabled={actionInProgress === interview._id}
              >
                <FaCheck size={12} />
              </button>
            )}
            <button 
              style={{ ...styles.mobileActionBtn, background: "#ef4444", color: "#fff" }}
              onClick={() => cancelInterview(interview._id, interview.fullName)}
              disabled={actionInProgress === interview._id}
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <FaSpinner size={50} color="#f9c349" />
      </motion.div>
      <p style={styles.loadingText}>Loading interviews...</p>
      <div style={styles.loadingBar}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          style={styles.loadingProgress}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            style={{
              ...styles.toast,
              borderLeft: `4px solid ${toastType === "success" ? "#10b981" : "#ef4444"}`
            }}
          >
            <span style={styles.toastIcon}>
              {toastType === "success" ? "✅" : "❌"}
            </span>
            <span style={styles.toastMessage}>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <FaCalendarCheck size={24} />
          </div>
          <div>
            <h1 style={isMobile ? styles.mobileTitle : styles.title}>Interview Management</h1>
            <p style={isMobile ? styles.mobileSubtitle : styles.subtitle}>
              {isMobile ? "Schedule & track interviews" : "Schedule, track, and manage candidate interviews"}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={isMobile ? styles.mobileScheduleBtn : styles.scheduleBtn}
          onClick={() => setShowScheduleModal(true)}
        >
          <FaPlus size={14} /> {isMobile ? "New" : "Schedule Interview"}
        </motion.button>
      </motion.div>

      {/* Stats Cards - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          ...styles.statsGrid,
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
          gap: isMobile ? "8px" : isTablet ? "10px" : "12px",
        }}
      >
        <motion.div whileHover={{ y: -2 }} style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <FaCalendarCheck size={isMobile ? 14 : 18} />
          </div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: isMobile ? "16px" : isTablet ? "18px" : "22px" }}>
              {stats.total}
            </span>
            <span style={{ ...styles.statLabel, fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px" }}>
              Total
            </span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <FaRocket size={isMobile ? 14 : 18} />
          </div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: isMobile ? "16px" : isTablet ? "18px" : "22px" }}>
              {stats.upcoming}
            </span>
            <span style={{ ...styles.statLabel, fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px" }}>
              Upcoming
            </span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <FaThumbsUp size={isMobile ? 14 : 18} />
          </div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: isMobile ? "16px" : isTablet ? "18px" : "22px" }}>
              {stats.today}
            </span>
            <span style={{ ...styles.statLabel, fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px" }}>
              Today
            </span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <FaRegClock size={isMobile ? 14 : 18} />
          </div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: isMobile ? "16px" : isTablet ? "18px" : "22px" }}>
              {stats.pending}
            </span>
            <span style={{ ...styles.statLabel, fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px" }}>
              Pending
            </span>
          </div>
        </motion.div>

        {!isMobile && !isTablet && (
          <motion.div whileHover={{ y: -2 }} style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FaCheckCircle size={18} />
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.completed}</span>
              <span style={styles.statLabel}>Completed</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={styles.filterBar}
      >
        <div style={styles.searchBox}>
          <FaSearch size={14} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={isMobile ? "Search..." : "Search by candidate, email, or position..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearch} onClick={() => setSearchTerm("")}>
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {isMobile ? (
          <button style={styles.mobileFilterToggle} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FaFilter size={14} /> Filters <FaChevronDown size={12} />
          </button>
        ) : (
          <>
            <div style={styles.filterGroup}>
              <FaFilter size={14} style={styles.filterIcon} />
              <select
                style={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="reviewed">👀 Reviewed</option>
                <option value="shortlisted">⭐ Shortlisted</option>
                <option value="interview">🎯 Scheduled</option>
                <option value="completed">✅ Completed</option>
                <option value="hired">🎉 Hired</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.clearBtn}
              onClick={() => { setSearchTerm(""); setStatusFilter(""); }}
            >
              <FaTimes size={12} /> Clear
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Mobile Filters */}
      {isMobile && isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={styles.mobileFilters}
        >
          <div style={styles.mobileFilterGroup}>
            <label style={styles.mobileFilterLabel}>Status</label>
            <select
              style={styles.mobileFilterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button style={styles.mobileClearBtn} onClick={() => { setSearchTerm(""); setStatusFilter(""); setIsFilterOpen(false); }}>
            Clear All Filters
          </button>
        </motion.div>
      )}

      {/* Content */}
      {interviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={styles.emptyState}
        >
          <div style={styles.emptyIcon}>
            <FaCalendarAlt size={48} />
          </div>
          <h3 style={styles.emptyTitle}>No Interviews Scheduled</h3>
          <p style={styles.emptyText}>Get started by scheduling your first interview</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.emptyBtn}
            onClick={() => setShowScheduleModal(true)}
          >
            <FaPlus /> Schedule Interview
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={styles.tableContainer}
        >
          <div style={styles.tableHeader}>
            <div style={styles.tableTitle}>
              <FaUsers size={16} style={styles.tableTitleIcon} />
              <span>All Interviews</span>
              <span style={styles.tableCount}>{filteredInterviews.length}</span>
            </div>
          </div>

          {!isMobile ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={{ minWidth: isTablet ? "180px" : "220px" }}>Candidate</th>
                    <th style={{ minWidth: isTablet ? "130px" : "160px" }}>Position</th>
                    <th style={{ minWidth: isTablet ? "150px" : "180px" }}>Interview Date</th>
                    <th style={{ minWidth: "100px" }}>Meeting</th>
                    <th style={{ minWidth: "100px" }}>Status</th>
                    <th style={{ minWidth: isTablet ? "180px" : "240px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((interview, index) => {
                    const statusConfig = getStatusConfig(interview.status);
                    const upcoming = isUpcoming(interview.interviewDate);
                    const today = isToday(interview.interviewDate);
                    
                    return (
                      <motion.tr
                        key={interview._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        whileHover={{ backgroundColor: "#fafafa" }}
                        style={styles.tableRow}
                      >
                        <td>
                          <div style={styles.candidateCell}>
                            <div style={styles.candidateAvatar}>
                              {interview.fullName?.charAt(0) || "A"}
                              {today && upcoming && <span style={styles.todayBadge}>Today</span>}
                            </div>
                            <div>
                              <div style={styles.candidateName}>{interview.fullName}</div>
                              <div style={styles.candidateEmail}>
                                <FaEnvelope size={10} /> {interview.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={styles.jobTitle}>{interview.jobId?.title || "N/A"}</div>
                          <div style={styles.jobDept}>
                            <FaBuilding size={10} /> {interview.jobId?.department || ""}
                          </div>
                        </td>
                        <td>
                          {interview.interviewDate ? (
                            <div>
                              <div style={styles.interviewDate}>
                                <FaCalendarAlt size={12} /> {formatDate(interview.interviewDate)}
                              </div>
                              <div style={styles.interviewTime}>
                                <FaClock size={12} /> {formatTime(interview.interviewDate)}
                              </div>
                              {upcoming && (
                                <div style={styles.timeRemaining}>
                                  <span style={styles.timeDot} /> {getTimeRemaining(interview.interviewDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>Not scheduled</span>
                          )}
                        </td>
                        <td>
                          {interview.meetingLink ? (
                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.meetingLink}>
                              <FaVideo size={12} /> Join
                            </a>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>No link</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            ...styles.statusBadge,
                            background: statusConfig.bg,
                            color: statusConfig.color,
                          }}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td>
                          <div style={styles.actionButtons}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={styles.actionBtn}
                              onClick={() => rescheduleInterview(interview._id, interview.interviewDate)}
                              disabled={actionInProgress === interview._id}
                            >
                              {actionInProgress === interview._id ? <FaSpinner className="spinner" size={12} /> : <FaEdit size={12} />}
                              {!isTablet && "Reschedule"}
                            </motion.button>
                            {interview.status !== "completed" && interview.status !== "hired" && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ ...styles.actionBtn, background: "#10b981", color: "#fff" }}
                                onClick={() => completeInterview(interview._id, interview.fullName)}
                                disabled={actionInProgress === interview._id}
                              >
                                {actionInProgress === interview._id ? <FaSpinner className="spinner" size={12} /> : <FaCheck size={12} />}
                                {!isTablet && "Complete"}
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={{ ...styles.actionBtn, background: "#ef4444", color: "#fff" }}
                              onClick={() => cancelInterview(interview._id, interview.fullName)}
                              disabled={actionInProgress === interview._id}
                            >
                              {actionInProgress === interview._id ? <FaSpinner className="spinner" size={12} /> : <FaTrash size={12} />}
                              {!isTablet && "Cancel"}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.mobileCardList}>
              {currentItems.map((interview) => (
                <MobileInterviewCard key={interview._id} interview={interview} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredInterviews.length > itemsPerPage && (
            <div style={styles.pagination}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FaArrowLeft size={12} /> {!isMobile && "Previous"}
              </motion.button>
              <div style={styles.pageInfo}>
                <span style={styles.pageCurrent}>{currentPage}</span>
                <span style={styles.pageSeparator}>/</span>
                <span style={styles.pageTotal}>{totalPages}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {!isMobile && "Next"} <FaArrowRight size={12} />
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {/* Schedule Interview Modal - Responsive */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={isMobile ? styles.mobileModalContent : styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={isMobile ? styles.mobileModalTitle : styles.modalTitle}>
                    Schedule Interview
                  </h2>
                  <p style={styles.modalSubtitle}>
                    {isMobile ? "Set up interview details" : "Select a candidate and set up interview details"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={styles.modalCloseBtn}
                  onClick={() => setShowScheduleModal(false)}
                >
                  <FaTimes size={18} />
                </motion.button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Select Candidate *</label>
                  <select
                    value={selectedApplication || ""}
                    onChange={(e) => setSelectedApplication(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="">Choose a shortlisted candidate...</option>
                    {applications.map(app => (
                      <option key={app._id} value={app._id}>
                        {app.fullName} - {app.jobId?.title}
                      </option>
                    ))}
                  </select>
                  {applications.length === 0 && (
                    <p style={styles.formHint}>No shortlisted candidates available.</p>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    style={styles.formInput}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Meeting Link</label>
                  <input
                    type="url"
                    placeholder={isMobile ? "Meeting URL..." : "https://meet.google.com/... or https://zoom.us/j/..."}
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Interview Notes</label>
                  <textarea
                    rows={isMobile ? "2" : "3"}
                    placeholder="Add any notes or instructions..."
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    style={styles.formTextarea}
                  />
                </div>
              </div>

              <div style={isMobile ? styles.mobileModalFooter : styles.modalFooter}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.cancelModalBtn}
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.submitModalBtn}
                  onClick={scheduleInterview}
                  disabled={submitting || applications.length === 0}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner" size={14} /> Scheduling...
                    </>
                  ) : (
                    <>
                      <FaCalendarCheck size={14} /> Schedule
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #f9c349;
            border-radius: 10px;
          }

          input:focus, select:focus, textarea:focus {
            border-color: #f9c349 !important;
            outline: none !important;
          }

          @media (max-width: 768px) {
            .stat-card {
              padding: 10px 12px !important;
            }
            .stat-value {
              font-size: 16px !important;
            }
            .stat-icon-wrapper {
              width: 32px !important;
              height: 32px !important;
            }
            .stat-label {
              font-size: 9px !important;
            }
            .action-btn {
              padding: 4px 8px !important;
              font-size: 11px !important;
            }
          }

          @media (max-width: 480px) {
            .stat-card {
              padding: 8px 10px !important;
              gap: 8px !important;
            }
            .stat-value {
              font-size: 14px !important;
            }
            .stat-icon-wrapper {
              width: 28px !important;
              height: 28px !important;
            }
            .stat-icon-wrapper svg {
              font-size: 12px !important;
            }
            .stat-label {
              font-size: 8px !important;
            }
          }
        `}
      </style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: "16px 20px",
    width: "100%",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  toast: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 9999,
    border: "1px solid #e5e7eb",
  },
  toastIcon: {
    fontSize: "16px",
  },
  toastMessage: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },
  loadingBar: {
    width: "180px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    background: "#f9c349",
    borderRadius: "4px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerIconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  mobileTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  mobileSubtitle: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  scheduleBtn: {
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  mobileScheduleBtn: {
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s ease",
    cursor: "default",
  },
  statIconWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f9c349",
    flexShrink: 0,
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    color: "#64748b",
    fontWeight: "500",
  },
  filterBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    minWidth: "150px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    transition: "all 0.2s ease",
  },
  searchIcon: {
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
    background: "transparent",
    color: "#0f172a",
    padding: "4px 0",
  },
  clearSearch: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "2px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    minWidth: "120px",
  },
  filterIcon: {
    color: "#94a3b8",
  },
  filterSelect: {
    padding: "8px 4px",
    border: "none",
    outline: "none",
    fontSize: "13px",
    background: "transparent",
    color: "#0f172a",
    cursor: "pointer",
    minWidth: "110px",
    fontFamily: "'Inter', sans-serif",
  },
  clearBtn: {
    padding: "6px 14px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "13px",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  mobileFilterToggle: {
    padding: "6px 14px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a",
    fontFamily: "'Inter', sans-serif",
  },
  mobileFilters: {
    background: "#fff",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "14px",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  mobileFilterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  mobileFilterLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  mobileFilterSelect: {
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    width: "100%",
  },
  mobileClearBtn: {
    padding: "8px",
    background: "#f9c349",
    border: "none",
    borderRadius: "8px",
    color: "#0f172a",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
  tableContainer: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "10px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  tableTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  tableTitleIcon: {
    color: "#f9c349",
  },
  tableCount: {
    background: "#e5e7eb",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#475569",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "750px",
  },
  tableHead: {
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    textAlign: "left",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.2s ease",
  },
  candidateCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
  },
  candidateAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "#fff",
    fontSize: "14px",
    flexShrink: 0,
    position: "relative",
  },
  todayBadge: {
    position: "absolute",
    top: "-4px",
    right: "-8px",
    fontSize: "7px",
    background: "#10b981",
    color: "#fff",
    padding: "1px 6px",
    borderRadius: "8px",
    fontWeight: "600",
  },
  candidateName: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "14px",
  },
  candidateEmail: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  jobTitle: {
    fontWeight: "500",
    color: "#0f172a",
    fontSize: "13px",
  },
  jobDept: {
    fontSize: "12px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  interviewDate: {
    fontSize: "13px",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  interviewTime: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px",
  },
  timeRemaining: {
    fontSize: "11px",
    color: "#f59e0b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
  },
  timeDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#f59e0b",
    display: "inline-block",
  },
  meetingLink: {
    color: "#f9c349",
    textDecoration: "none",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "4px 10px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    color: "#475569",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb",
  },
  pageBtn: {
    padding: "6px 12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  pageInfo: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  pageCurrent: {
    fontWeight: "700",
    color: "#0f172a",
  },
  pageSeparator: {
    color: "#94a3b8",
  },
  pageTotal: {
    color: "#94a3b8",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    color: "#94a3b8",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    marginBottom: "4px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "16px",
  },
  emptyBtn: {
    padding: "8px 20px",
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "16px",
    maxWidth: "480px",
    width: "95%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
  },
  mobileModalContent: {
    background: "#fff",
    borderRadius: "14px",
    maxWidth: "98%",
    width: "100%",
    maxHeight: "95vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  mobileModalTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  modalCloseBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  modalBody: {
    padding: "20px",
    overflowY: "auto",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px",
  },
  formSelect: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    backgroundColor: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  formInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  formTextarea: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    minHeight: "60px",
    resize: "vertical",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  formHint: {
    fontSize: "12px",
    color: "#ef4444",
    marginTop: "4px",
  },
  modalFooter: {
    padding: "14px 20px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "10px",
  },
  mobileModalFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  cancelModalBtn: {
    flex: 1,
    padding: "8px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    color: "#475569",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  submitModalBtn: {
    flex: 1,
    padding: "8px",
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  // Mobile Card Styles
  mobileCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
  },
  mobileCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  mobileCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  mobileCardUser: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  },
  mobileCardAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "#fff",
    fontSize: "14px",
    flexShrink: 0,
    position: "relative",
  },
  mobileTodayBadge: {
    position: "absolute",
    top: "-4px",
    right: "-8px",
    fontSize: "7px",
    background: "#10b981",
    color: "#fff",
    padding: "1px 6px",
    borderRadius: "8px",
    fontWeight: "600",
  },
  mobileCardUserInfo: {
    flex: 1,
  },
  mobileCardName: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "14px",
  },
  mobileCardEmail: {
    fontSize: "11px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  mobileCardDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    padding: "8px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "8px",
  },
  mobileCardDetail: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#475569",
  },
  mobileTimeRemaining: {
    fontSize: "11px",
    color: "#f59e0b",
    fontWeight: "500",
  },
  mobileCardActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  mobileMeetingLink: {
    color: "#f9c349",
    textDecoration: "none",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    padding: "4px 10px",
    background: "#fef3c7",
    borderRadius: "6px",
  },
  mobileActionGroup: {
    display: "flex",
    gap: "4px",
  },
  mobileActionBtn: {
    padding: "4px 8px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    color: "#475569",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    transition: "all 0.2s ease",
    width: "30px",
    height: "30px",
  },
};

export default InterviewsManager;