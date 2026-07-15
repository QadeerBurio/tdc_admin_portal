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
  FaChartLine,
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
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsForScheduling();
  }, []);

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
    const pending = data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length;
    const completed = data.filter(i => i.status === "completed" || i.status === "hired").length;
    const upcoming = data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length;

    setStats({
      total: data.length,
      pending,
      completed,
      upcoming,
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
      alert("Please select a candidate");
      return;
    }
    
    if (!interviewDate) {
      alert("Please select an interview date and time");
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
      
      alert("Interview scheduled successfully!");
      setShowScheduleModal(false);
      resetForm();
      fetchInterviews();
      fetchApplicationsForScheduling();
    } catch (err) {
      console.error("Error scheduling interview:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to schedule interview";
      alert(errorMsg);
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
          alert("Invalid date format. Please use YYYY-MM-DD HH:MM");
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
        alert("Interview rescheduled successfully");
        fetchInterviews();
      } catch (err) {
        console.error("Error rescheduling:", err);
        alert(err.response?.data?.message || "Failed to reschedule interview");
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
        alert("Interview cancelled successfully");
        fetchInterviews();
      } catch (err) {
        console.error("Error cancelling:", err);
        alert(err.response?.data?.message || "Failed to cancel interview");
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
        alert("Interview marked as completed");
        fetchInterviews();
      } catch (err) {
        console.error("Error completing interview:", err);
        alert(err.response?.data?.message || "Failed to complete interview");
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

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳", label: "Pending" },
      reviewed: { bg: "#dbeafe", color: "#2563eb", icon: "👀", label: "Reviewed" },
      shortlisted: { bg: "#d1fae5", color: "#059669", icon: "⭐", label: "Shortlisted" },
      interview: { bg: "#ede9fe", color: "#7c3aed", icon: "🎯", label: "Scheduled" },
      completed: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Completed" },
      hired: { bg: "#d1fae5", color: "#059669", icon: "🎉", label: "Hired" },
      rejected: { bg: "#fee2e2", color: "#dc2626", icon: "❌", label: "Rejected" }
    };
    return colors[status] || colors.pending;
  };

  // Filter and search
  const filteredInterviews = interviews
    .filter(i => 
      i.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(i => statusFilter ? i.status === statusFilter : true);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInterviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);

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

  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaCalendarCheck />
          </div>
          <div>
            <h1 style={styles.title}>Interviews</h1>
            <p style={styles.subtitle}>Schedule and manage candidate interviews</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          style={styles.scheduleBtn}
          onClick={() => setShowScheduleModal(true)}
        >
          <FaPlus /> Schedule Interview
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={styles.statsGrid}
      >
        <div style={{ ...styles.statCard, borderLeft: "4px solid #3b82f6" }}>
          <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#3b82f6" }}>
            <FaCalendarCheck />
          </div>
          <div>
            <h3 style={styles.statValue}>{stats.total}</h3>
            <p style={styles.statLabel}>Total Interviews</p>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ ...styles.statIcon, background: "#f3e8ff", color: "#8b5cf6" }}>
            <FaClockIcon />
          </div>
          <div>
            <h3 style={styles.statValue}>{stats.upcoming}</h3>
            <p style={styles.statLabel}>Upcoming</p>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#f59e0b" }}>
            <FaClock />
          </div>
          <div>
            <h3 style={styles.statValue}>{stats.pending}</h3>
            <p style={styles.statLabel}>Pending</p>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={{ ...styles.statIcon, background: "#d1fae5", color: "#10b981" }}>
            <FaCheckCircle />
          </div>
          <div>
            <h3 style={styles.statValue}>{stats.completed}</h3>
            <p style={styles.statLabel}>Completed</p>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={styles.filterBar}
      >
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by candidate name, email, or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <FaFilter style={styles.filterIcon} />
          <select
            style={styles.filterSelect}
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
      </motion.div>

      {/* Table */}
      {interviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={styles.emptyState}
        >
          <FaCalendarAlt size={60} color="#cbd5e1" />
          <h3 style={styles.emptyTitle}>No Interviews Scheduled</h3>
          <p style={styles.emptyText}>Get started by scheduling your first interview with a shortlisted candidate</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.emptyScheduleBtn}
            onClick={() => setShowScheduleModal(true)}
          >
            <FaPlus /> Schedule Your First Interview
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={styles.tableContainer}
        >
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Candidate</th>
                <th>Position</th>
                <th>Interview Date</th>
                <th>Meeting Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((interview, index) => (
                <motion.tr
                  key={interview._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={styles.tableRow}
                  whileHover={{ backgroundColor: "#fafafa" }}
                >
                  <td>
                    <div style={styles.candidateCell}>
                      <div style={styles.candidateAvatar}>
                        {interview.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.candidateName}>{interview.fullName}</div>
                        <div style={styles.candidateEmail}>
                          <FaEnvelope size={10} /> {interview.email}
                        </div>
                        <div style={styles.candidatePhone}>
                          <FaPhone size={10} /> {interview.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={styles.jobTitle}>{interview.jobId?.title}</div>
                    <div style={styles.jobDept}>{interview.jobId?.department}</div>
                  </td>
                  <td>
                    {interview.interviewDate ? (
                      <>
                        <div style={styles.interviewDate}>
                          <FaCalendarAlt size={12} /> {new Date(interview.interviewDate).toLocaleDateString()}
                        </div>
                        <div style={styles.interviewTime}>
                          <FaClock size={12} /> {new Date(interview.interviewDate).toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not scheduled</span>
                    )}
                  </td>
                  <td>
                    {interview.meetingLink ? (
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.meetingLink}>
                        <FaVideo /> Join Meeting
                        <FaExternalLinkAlt size={10} style={styles.externalIcon} />
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>No link</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      ...styles.statusBadge,
                      background: getStatusBadge(interview.status).bg,
                      color: getStatusBadge(interview.status).color
                    }}>
                      {getStatusBadge(interview.status).icon} {getStatusBadge(interview.status).label}
                    </span>
                  </td>
                  <td>
                    <div style={styles.actionButtons}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={styles.rescheduleBtn}
                        onClick={() => rescheduleInterview(interview._id, interview.interviewDate)}
                        disabled={actionInProgress === interview._id}
                      >
                        {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaEdit />}
                        Reschedule
                      </motion.button>
                      {interview.status !== "completed" && interview.status !== "hired" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={styles.completeBtn}
                          onClick={() => completeInterview(interview._id, interview.fullName)}
                          disabled={actionInProgress === interview._id}
                        >
                          {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaCheck />}
                          Complete
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={styles.cancelBtn}
                        onClick={() => cancelInterview(interview._id, interview.fullName)}
                        disabled={actionInProgress === interview._id}
                      >
                        {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaTrash />}
                        Cancel
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredInterviews.length > itemsPerPage && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FaArrowLeft /> Previous
              </button>
              <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
              <button
                style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <FaArrowRight />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Schedule Interview Modal */}
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
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>Schedule Interview</h2>
                  <p style={styles.modalSubtitle}>Select a candidate and set up interview details</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={styles.modalCloseBtn}
                  onClick={() => setShowScheduleModal(false)}
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Select Candidate *</label>
                  <select
                    value={selectedApplication || ""}
                    onChange={(e) => setSelectedApplication(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Choose a shortlisted candidate...</option>
                    {applications.map(app => (
                      <option key={app._id} value={app._id}>
                        {app.fullName} - {app.jobId?.title}
                      </option>
                    ))}
                  </select>
                  {applications.length === 0 && (
                    <p style={styles.hint}>No shortlisted candidates available. Please shortlist candidates first.</p>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    style={styles.input}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Meeting Link (Zoom/Google Meet)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Interview Notes</label>
                  <textarea
                    rows="4"
                    placeholder="Add any notes or instructions for the candidate..."
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
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
                  style={styles.submitBtn}
                  onClick={scheduleInterview}
                  disabled={submitting || applications.length === 0}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner" /> Scheduling...
                    </>
                  ) : (
                    <>
                      <FaCalendarCheck /> Schedule Interview
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
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }

          .spinner {
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }

          .stat-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }
          .stat-card:nth-child(4) { animation-delay: 0.2s; }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff961a;
          }
        `}
      </style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "20px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  loadingBar: {
    width: "200px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "4px",
  },
  error: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
    fontSize: "16px",
    color: "#ef4444",
    textAlign: "center",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  scheduleBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  statCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "26px",
    fontWeight: "700",
    margin: 0,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fff",
    transition: "all 0.3s ease",
    minWidth: "200px",
  },
  searchIcon: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    background: "transparent",
    color: "#0f172a",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fff",
  },
  filterIcon: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  filterSelect: {
    padding: "12px 4px",
    border: "none",
    outline: "none",
    fontSize: "14px",
    background: "transparent",
    color: "#0f172a",
    cursor: "pointer",
    minWidth: "140px",
  },
  tableContainer: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  tableHeader: {
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.3s ease",
  },
  candidateCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "4px 0",
  },
  candidateAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#fff",
    fontSize: "18px",
    flexShrink: 0,
  },
  candidateName: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "14px",
  },
  candidateEmail: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  candidatePhone: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  jobTitle: {
    fontWeight: "500",
    color: "#0f172a",
    fontSize: "14px",
  },
  jobDept: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  interviewDate: {
    fontSize: "13px",
    color: "#0f172a",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  interviewTime: {
    fontSize: "12px",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  meetingLink: {
    color: "#3b82f6",
    textDecoration: "none",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  externalIcon: {
    marginLeft: "2px",
  },
  statusBadge: {
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  rescheduleBtn: {
    padding: "6px 12px",
    background: "#fef3c7",
    border: "none",
    borderRadius: "8px",
    color: "#d97706",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  completeBtn: {
    padding: "6px 12px",
    background: "#d1fae5",
    border: "none",
    borderRadius: "8px",
    color: "#059669",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  cancelBtn: {
    padding: "6px 12px",
    background: "#fee2e2",
    border: "none",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  pageBtn: {
    padding: "8px 20px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.3s ease",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    marginTop: "20px",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "24px",
  },
  emptyScheduleBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "520px",
    width: "95%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "24px 32px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  modalCloseBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
  modalBody: {
    padding: "32px",
    overflowY: "auto",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.3s ease",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
    color: "#0f172a",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },
  hint: {
    fontSize: "12px",
    color: "#ef4444",
    marginTop: "8px",
  },
  modalFooter: {
    padding: "20px 32px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "12px",
  },
  cancelModalBtn: {
    flex: 1,
    padding: "12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    color: "#475569",
    transition: "all 0.3s ease",
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
  },
};

export default InterviewsManager;