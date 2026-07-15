import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaDownload,
  FaEye,
  FaStar,
  FaFilter,
  FaUserCircle,
  FaBriefcase,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClock,
  FaTimes,
  FaChevronDown,
  FaCheckCircle,
  FaSpinner,
  FaUserPlus,
  FaUsers,
  FaArrowLeft,
  FaArrowRight,
  FaGraduationCap,
  FaGlobe,
  FaLinkedin,
  FaGithub,
  FaFilePdf,
  FaHeart,
  FaHeartBroken,
  FaChartLine,
  FaTrophy,
  FaAward,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CandidatesManager = ({ token }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`https://the-deft-crew-production.up.railway.app/api/jobs/application/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCandidates();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedCandidates.length === 0) {
      alert("Please select candidates first");
      return;
    }
    try {
      await axios.patch("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/bulk-status",
        { candidateIds: selectedCandidates, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${selectedCandidates.length} candidates updated to ${status}`);
      setSelectedCandidates([]);
      setShowBulkActions(false);
      fetchCandidates();
    } catch (err) {
      console.error("Error bulk updating:", err);
      alert("Failed to update candidates");
    }
  };

  const exportCandidates = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const csvData = convertToCSV(res.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting:", err);
      alert("Failed to export candidates");
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const viewCandidateDetails = async (id) => {
    try {
      const res = await axios.get(`https://the-deft-crew-production.up.railway.app/api/jobs/candidates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCandidate(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching candidate details:", err);
      alert("Failed to load candidate details");
    }
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c._id));
    }
    setSelectAll(!selectAll);
  };

  const getSortValue = (candidate) => {
    switch (sortBy) {
      case "recent": return new Date(candidate.appliedAt).getTime();
      case "oldest": return -new Date(candidate.appliedAt).getTime();
      case "name": return candidate.fullName;
      case "experience": return candidate.yearsOfExperience;
      default: return new Date(candidate.appliedAt).getTime();
    }
  };

  const filteredCandidates = candidates
    .filter(c =>
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.jobId?.title?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(c => statusFilter ? c.status === statusFilter : true)
    .sort((a, b) => {
      const valA = getSortValue(a);
      const valB = getSortValue(b);
      if (sortBy === "name" || sortBy === "experience") {
        return valA > valB ? 1 : -1;
      }
      return valB - valA;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳", label: "Pending" },
      reviewed: { bg: "#dbeafe", color: "#2563eb", icon: "👀", label: "Reviewed" },
      shortlisted: { bg: "#d1fae5", color: "#059669", icon: "⭐", label: "Shortlisted" },
      interview: { bg: "#ede9fe", color: "#7c3aed", icon: "🎯", label: "Interview" },
      rejected: { bg: "#fee2e2", color: "#dc2626", icon: "❌", label: "Rejected" },
      hired: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Hired" }
    };
    return colors[status] || colors.pending;
  };

  const getStatusStats = () => {
    const stats = {};
    candidates.forEach(c => {
      stats[c.status] = (stats[c.status] || 0) + 1;
    });
    return stats;
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <FaSpinner size={50} color="#f9c349" />
      </motion.div>
      <p style={styles.loadingText}>Loading candidates...</p>
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaUsers />
          </div>
          <div>
            <h1 style={styles.title}>Candidates</h1>
            <p style={styles.subtitle}>Review and manage job applicants</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={styles.exportBtn}
            onClick={exportCandidates}
          >
            <FaDownload /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={styles.refreshBtn}
            onClick={fetchCandidates}
          >
            <FaSpinner /> Refresh
          </motion.button>
          {selectedCandidates.length > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={styles.bulkBtn}
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              Bulk Actions ({selectedCandidates.length})
              <FaChevronDown size={12} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={styles.statsContainer}
      >
        {Object.entries(getStatusStats()).map(([status, count]) => (
          <motion.div
            key={status}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            style={{ ...styles.statCard, ...styles[`stat${status.charAt(0).toUpperCase() + status.slice(1)}`] }}
          >
            <div style={styles.statIcon}>{getStatusBadge(status).icon}</div>
            <div style={styles.statInfo}>
              <div style={styles.statCount}>{count}</div>
              <div style={styles.statLabel}>{getStatusBadge(status).label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && selectedCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            style={styles.bulkActions}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ ...styles.bulkActionBtn, background: "#059669" }}
              onClick={() => bulkUpdateStatus("shortlisted")}
            >
              <FaStar /> Shortlist
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ ...styles.bulkActionBtn, background: "#7c3aed" }}
              onClick={() => bulkUpdateStatus("interview")}
            >
              <FaCalendarAlt /> Interview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ ...styles.bulkActionBtn, background: "#dc2626" }}
              onClick={() => bulkUpdateStatus("rejected")}
            >
              <FaTimes /> Reject
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ ...styles.bulkActionBtn, background: "#059669" }}
              onClick={() => bulkUpdateStatus("hired")}
            >
              <FaCheckCircle /> Hire
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ ...styles.bulkActionBtn, background: "#64748b" }}
              onClick={() => { setSelectedCandidates([]); setShowBulkActions(false); }}
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
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
            placeholder="Search candidates by name, email, or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <FaChartLine style={styles.filterIcon} />
          <select
            style={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="name">By Name</option>
            <option value="experience">By Experience</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.tableContainer}
      >
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ width: "40px", padding: "16px 12px" }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={styles.checkbox}
                />
              </th>
              <th style={{ minWidth: "250px" }}>Candidate</th>
              <th style={{ minWidth: "180px" }}>Position</th>
              <th style={{ minWidth: "100px" }}>Experience</th>
              <th style={{ minWidth: "120px" }}>Applied</th>
              <th style={{ minWidth: "130px" }}>Status</th>
              <th style={{ minWidth: "220px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((candidate, index) => (
              <motion.tr
                key={candidate._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                style={styles.tableRow}
                whileHover={{ backgroundColor: "#fafafa", scale: 1.002 }}
              >
                <td style={{ padding: "12px" }}>
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate._id)}
                    onChange={() => toggleSelectCandidate(candidate._id)}
                    style={styles.checkbox}
                  />
                </td>
                <td>
                  <div style={styles.candidateCell}>
                    <div style={styles.candidateAvatar}>
                      {candidate.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div style={styles.candidateName}>{candidate.fullName}</div>
                      <div style={styles.candidateEmail}>
                        <FaEnvelope size={10} /> {candidate.email}
                      </div>
                      <div style={styles.candidatePhone}>
                        <FaPhone size={10} /> {candidate.phone}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={styles.jobTitle}>{candidate.jobId?.title}</div>
                  <div style={styles.jobDept}>{candidate.jobId?.department}</div>
                </td>
                <td>
                  <div style={styles.experienceBadge}>
                    <FaBriefcase size={12} /> {candidate.yearsOfExperience} yrs
                  </div>
                </td>
                <td>
                  <div style={styles.dateBadge}>
                    <FaCalendarAlt size={12} /> {new Date(candidate.appliedAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <span style={{
                    ...styles.statusBadge,
                    background: getStatusBadge(candidate.status).bg,
                    color: getStatusBadge(candidate.status).color
                  }}>
                    {getStatusBadge(candidate.status).icon} {getStatusBadge(candidate.status).label}
                  </span>
                </td>
                <td>
                  <div style={styles.actionGroup}>
                    <select
                      style={styles.statusSelect}
                      value={candidate.status}
                      onChange={(e) => updateStatus(candidate._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={styles.viewBtn}
                      onClick={() => viewCandidateDetails(candidate._id)}
                    >
                      <FaEye /> View
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <div style={styles.emptyState}>
            <FaUsers size={50} color="#cbd5e1" />
            <p style={styles.emptyText}>No candidates found matching your criteria</p>
            <button style={styles.emptyBtn} onClick={() => { setSearch(""); setStatusFilter(""); }}>
              Clear Filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {filteredCandidates.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={styles.pagination}
        >
          <button
            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FaArrowLeft /> Previous
          </button>
          <div style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next <FaArrowRight />
          </button>
        </motion.div>
      )}

      {/* Candidate Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {selectedCandidate.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{selectedCandidate.fullName}</h2>
                    <p style={styles.modalSubtitle}>
                      {selectedCandidate.jobId?.title} • {selectedCandidate.jobId?.department}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={styles.modalCloseBtn}
                  onClick={() => setShowDetailsModal(false)}
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.modalStats}>
                  <div style={styles.modalStat}>
                    <FaBriefcase />
                    <span>{selectedCandidate.yearsOfExperience} Years Experience</span>
                  </div>
                  <div style={styles.modalStat}>
                    <FaCalendarAlt />
                    <span>Applied {new Date(selectedCandidate.appliedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.modalStat}>
                    <FaMapMarkerAlt />
                    <span>{selectedCandidate.address || "Location not specified"}</span>
                  </div>
                </div>

                <div style={styles.modalGrid}>
                  <div style={styles.modalSection}>
                    <h3 style={styles.sectionTitle}>
                      <FaUserCircle /> Personal Information
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <label>Email</label>
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Phone</label>
                        <span>{selectedCandidate.phone}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Current Company</label>
                        <span>{selectedCandidate.currentCompany || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Current Position</label>
                        <span>{selectedCandidate.currentPosition || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Expected Salary</label>
                        <span>{selectedCandidate.expectedSalary || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Notice Period</label>
                        <span>{selectedCandidate.noticePeriod || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalSection}>
                    <h3 style={styles.sectionTitle}>
                      <FaGraduationCap /> Education & Skills
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <label>Education</label>
                        <span>{selectedCandidate.education || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Work Authorization</label>
                        <span>{selectedCandidate.workAuthorization || "N/A"}</span>
                      </div>
                    </div>
                    {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                      <div style={styles.skillsContainer}>
                        {selectedCandidate.skills.map((skill, i) => (
                          <span key={i} style={styles.skillTag}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedCandidate.coverLetter && (
                  <div style={styles.modalSection}>
                    <h3 style={styles.sectionTitle}>Cover Letter</h3>
                    <div style={styles.coverLetter}>
                      {selectedCandidate.coverLetter}
                    </div>
                  </div>
                )}

                <div style={styles.modalLinks}>
                  {selectedCandidate.portfolioUrl && (
                    <a href={selectedCandidate.portfolioUrl} target="_blank" style={styles.modalLink}>
                      <FaGlobe /> Portfolio
                    </a>
                  )}
                  {selectedCandidate.linkedInUrl && (
                    <a href={selectedCandidate.linkedInUrl} target="_blank" style={styles.modalLink}>
                      <FaLinkedin /> LinkedIn
                    </a>
                  )}
                  {selectedCandidate.githubUrl && (
                    <a href={selectedCandidate.githubUrl} target="_blank" style={styles.modalLink}>
                      <FaGithub /> GitHub
                    </a>
                  )}
                  {selectedCandidate.resumeUrl && (
                    <a href={selectedCandidate.resumeUrl} target="_blank" style={styles.modalLink}>
                      <FaFilePdf /> Resume
                    </a>
                  )}
                </div>

                <div style={styles.modalActions}>
                  <div style={styles.modalActionGroup}>
                    <label>Update Status</label>
                    <select
                      style={styles.modalStatusSelect}
                      value={selectedCandidate.status}
                      onChange={(e) => {
                        updateStatus(selectedCandidate._id, e.target.value);
                        setSelectedCandidate({ ...selectedCandidate, status: e.target.value });
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }

          .stat-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }
          .stat-card:nth-child(4) { animation-delay: 0.2s; }
          .stat-card:nth-child(5) { animation-delay: 0.25s; }
          .stat-card:nth-child(6) { animation-delay: 0.3s; }

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
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  exportBtn: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  refreshBtn: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e5e7eb",
    padding: "10px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  bulkBtn: {
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    padding: "10px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(249, 195, 73, 0.3)",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "28px",
  },
  statCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statPending: { borderLeft: "4px solid #d97706" },
  statReviewed: { borderLeft: "4px solid #2563eb" },
  statShortlisted: { borderLeft: "4px solid #059669" },
  statInterview: { borderLeft: "4px solid #7c3aed" },
  statRejected: { borderLeft: "4px solid #dc2626" },
  statHired: { borderLeft: "4px solid #059669" },
  statIcon: {
    fontSize: "24px",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
  },
  statCount: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  bulkActions: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    background: "#fff",
    borderRadius: "14px",
    marginBottom: "24px",
    flexWrap: "wrap",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
  },
  bulkActionBtn: {
    padding: "8px 18px",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
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
    minWidth: "130px",
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
    minWidth: "900px",
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
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#f9c349",
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
  experienceBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    background: "#f1f5f9",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#0f172a",
  },
  dateBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#64748b",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  statusSelect: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "12px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
  },
  viewBtn: {
    padding: "6px 14px",
    background: "#eff6ff",
    border: "none",
    borderRadius: "8px",
    color: "#2563eb",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  emptyText: {
    fontSize: "16px",
    margin: 0,
  },
  emptyBtn: {
    padding: "10px 24px",
    background: "#f9c349",
    border: "none",
    borderRadius: "10px",
    color: "#0f172a",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderTop: "1px solid #e5e7eb",
    marginTop: "0",
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(8px)",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    padding: "0",
    maxWidth: "750px",
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
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  modalAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#fff",
    fontSize: "24px",
    flexShrink: 0,
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
    marginTop: "2px",
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
    maxHeight: "calc(90vh - 160px)",
  },
  modalStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  modalStat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  modalSection: {
    marginBottom: "0",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  infoItem : {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoItem : {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "500",
  },
  skillsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "12px",
  },
  skillTag: {
    padding: "4px 12px",
    background: "#f1f5f9",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500",
  },
  coverLetter: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.8",
    color: "#0f172a",
    border: "1px solid #e5e7eb",
    marginTop: "8px",
  },
  modalLinks: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  modalLink: {
    padding: "8px 16px",
    background: "#f1f5f9",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#475569",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  modalActions: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  modalActionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  modalActionGroup : {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  modalStatusSelect: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
    maxWidth: "200px",
  },
};

export default CandidatesManager;