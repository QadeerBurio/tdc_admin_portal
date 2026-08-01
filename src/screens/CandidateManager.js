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
  FaChartLine,
  FaThumbsUp,
  FaUserCheck,
  FaClock as FaClockIcon,
  FaSort,
  FaBuilding,
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳", label: "Pending" },
      reviewed: { bg: "#dbeafe", color: "#2563eb", icon: "👀", label: "Reviewed" },
      shortlisted: { bg: "#d1fae5", color: "#059669", icon: "⭐", label: "Shortlisted" },
      interview: { bg: "#ede9fe", color: "#7c3aed", icon: "🎯", label: "Interview" },
      rejected: { bg: "#fee2e2", color: "#dc2626", icon: "❌", label: "Rejected" },
      hired: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Hired" }
    };
    return configs[status] || configs.pending;
  };

  const getStatusStats = () => {
    const stats = {};
    candidates.forEach(c => {
      stats[c.status] = (stats[c.status] || 0) + 1;
    });
    return stats;
  };

  const totalStats = {
    total: candidates.length,
    ...getStatusStats()
  };

  const statItems = [
    { key: 'total', icon: <FaUsers />, label: 'Total' },
    { key: 'pending', icon: <FaClockIcon />, label: 'Pending' },
    { key: 'reviewed', icon: <FaEye />, label: 'Reviewed' },
    { key: 'shortlisted', icon: <FaStar />, label: 'Shortlisted' },
    { key: 'interview', icon: <FaUserCheck />, label: 'Interview' },
    { key: 'hired', icon: <FaCheckCircle />, label: 'Hired' },
  ];

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
            <FaUsers size={24} />
          </div>
          <div>
            <h1 style={styles.title}>Candidates</h1>
            <p style={styles.subtitle}>
              {totalStats.total} candidates • {totalStats.pending || 0} pending review
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.exportBtn}
            onClick={exportCandidates}
          >
            <FaDownload size={14} /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.refreshBtn}
            onClick={fetchCandidates}
          >
            <FaSpinner size={14} /> Refresh
          </motion.button>
          {selectedCandidates.length > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={styles.bulkBtn}
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <FaUsers size={14} /> {selectedCandidates.length} Selected
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
        style={styles.statsGrid}
      >
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * (index + 1) }}
            whileHover={{ y: -2 }}
            style={styles.statCard}
          >
            <div style={styles.statIcon}>
              {stat.icon}
            </div>
            <div>
              <div style={styles.statValue}>{totalStats[stat.key] || 0}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && selectedCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.bulkActions}
          >
            <span style={styles.bulkTitle}>Update Selected: </span>
            {['shortlisted', 'interview', 'rejected', 'hired'].map(status => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ ...styles.bulkActionBtn }}
                onClick={() => bulkUpdateStatus(status)}
              >
                {getStatusConfig(status).icon} {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ ...styles.bulkActionBtn, background: "#e5e7eb", color: "#475569" }}
              onClick={() => { setSelectedCandidates([]); setShowBulkActions(false); }}
            >
              <FaTimes size={12} /> Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

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
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button style={styles.clearSearch} onClick={() => setSearch("")}>
              <FaTimes size={12} />
            </button>
          )}
        </div>
        <div style={styles.filterGroup}>
          <FaFilter style={styles.filterIcon} />
          <select
            style={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="reviewed">👀 Reviewed</option>
            <option value="shortlisted">⭐ Shortlisted</option>
            <option value="interview">🎯 Interview</option>
            <option value="rejected">❌ Rejected</option>
            <option value="hired">✅ Hired</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <FaSort style={styles.filterIcon} />
          <select
            style={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
            <option value="experience">By Experience</option>
          </select>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={styles.clearBtn}
          onClick={() => { setSearch(""); setStatusFilter(""); setSortBy("recent"); }}
        >
          <FaTimes size={12} /> Clear
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.tableContainer}
      >
        <div style={styles.tableHeader}>
          <div style={styles.tableTitle}>
            <FaUsers size={16} />
            <span>All Candidates</span>
            <span style={styles.tableCount}>{filteredCandidates.length}</span>
          </div>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHead}>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    style={styles.checkbox}
                  />
                </th>
                <th style={{ minWidth: "240px" }}>Candidate</th>
                <th style={{ minWidth: "170px" }}>Position</th>
                <th style={{ minWidth: "100px" }}>Experience</th>
                <th style={{ minWidth: "110px" }}>Applied</th>
                <th style={{ minWidth: "120px" }}>Status</th>
                <th style={{ minWidth: "190px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((candidate, index) => {
                const statusConfig = getStatusConfig(candidate.status);
                return (
                  <motion.tr
                    key={candidate._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    whileHover={{ backgroundColor: "#fafafa" }}
                    style={styles.tableRow}
                  >
                    <td>
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
                          {candidate.fullName?.charAt(0) || "A"}
                        </div>
                        <div>
                          <div style={styles.candidateName}>{candidate.fullName}</div>
                          <div style={styles.candidateEmail}>
                            <FaEnvelope size={10} /> {candidate.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={styles.jobTitle}>{candidate.jobId?.title || "N/A"}</div>
                      <div style={styles.jobDept}>
                        <FaBuilding size={10} /> {candidate.jobId?.department || ""}
                      </div>
                    </td>
                    <td>
                      <div style={styles.experienceBadge}>
                        <FaBriefcase size={12} /> {candidate.yearsOfExperience || 0}y
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
                        background: statusConfig.bg,
                        color: statusConfig.color,
                      }}>
                        {statusConfig.icon} {statusConfig.label}
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
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={styles.viewBtn}
                          onClick={() => viewCandidateDetails(candidate._id)}
                        >
                          <FaEye size={12} /> View
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCandidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.emptyState}
          >
            <FaUsers size={50} color="#cbd5e1" />
            <p style={styles.emptyText}>No candidates found</p>
            <p style={styles.emptySubtext}>Try adjusting your search or filters</p>
            <button style={styles.emptyBtn} onClick={() => { setSearch(""); setStatusFilter(""); }}>
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Pagination */}
        {filteredCandidates.length > itemsPerPage && (
          <div style={styles.pagination}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaArrowLeft size={12} /> Previous
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
              Next <FaArrowRight size={12} />
            </motion.button>
          </div>
        )}
      </motion.div>

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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {selectedCandidate.fullName?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{selectedCandidate.fullName}</h2>
                    <p style={styles.modalSubtitle}>
                      {selectedCandidate.jobId?.title || "Position"} • {selectedCandidate.jobId?.department || ""}
                    </p>
                    <span style={{
                      ...styles.modalStatusBadge,
                      background: getStatusConfig(selectedCandidate.status).bg,
                      color: getStatusConfig(selectedCandidate.status).color,
                    }}>
                      {getStatusConfig(selectedCandidate.status).icon} {getStatusConfig(selectedCandidate.status).label}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={styles.modalCloseBtn}
                  onClick={() => setShowDetailsModal(false)}
                >
                  <FaTimes size={20} />
                </motion.button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.modalStats}>
                  <div style={styles.modalStat}>
                    <FaBriefcase size={16} />
                    <span>{selectedCandidate.yearsOfExperience || 0} Years Experience</span>
                  </div>
                  <div style={styles.modalStat}>
                    <FaCalendarAlt size={16} />
                    <span>Applied {new Date(selectedCandidate.appliedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.modalStat}>
                    <FaMapMarkerAlt size={16} />
                    <span>{selectedCandidate.address || "Location not specified"}</span>
                  </div>
                  <div style={styles.modalStat}>
                    <FaMoneyBillWave size={16} />
                    <span>{selectedCandidate.expectedSalary || "Salary not specified"}</span>
                  </div>
                </div>

                <div style={styles.modalGrid}>
                  <div style={styles.modalSection}>
                    <h3 style={styles.sectionTitle}>
                      <FaUserCircle size={16} /> Personal Information
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
                        <label>Notice Period</label>
                        <span>{selectedCandidate.noticePeriod || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Work Authorization</label>
                        <span>{selectedCandidate.workAuthorization || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalSection}>
                    <h3 style={styles.sectionTitle}>
                      <FaGraduationCap size={16} /> Education & Skills
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <label>Education</label>
                        <span>{selectedCandidate.education || "N/A"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <label>Skills</label>
                        <div style={styles.skillsContainer}>
                          {selectedCandidate.skills?.length > 0 ? (
                            selectedCandidate.skills.map((skill, i) => (
                              <span key={i} style={styles.skillTag}>{skill}</span>
                            ))
                          ) : (
                            <span style={styles.noSkills}>No skills listed</span>
                          )}
                        </div>
                      </div>
                    </div>
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
                      <FaGlobe size={14} /> Portfolio
                    </a>
                  )}
                  {selectedCandidate.linkedInUrl && (
                    <a href={selectedCandidate.linkedInUrl} target="_blank" style={styles.modalLink}>
                      <FaLinkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {selectedCandidate.githubUrl && (
                    <a href={selectedCandidate.githubUrl} target="_blank" style={styles.modalLink}>
                      <FaGithub size={14} /> GitHub
                    </a>
                  )}
                  {selectedCandidate.resumeUrl && (
                    <a href={selectedCandidate.resumeUrl} target="_blank" style={styles.modalLink}>
                      <FaFilePdf size={14} /> Resume
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
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
          ::-webkit-scrollbar-thumb:hover {
            background: #e8a800;
          }

          input:focus, select:focus {
            border-color: #f9c349 !important;
            outline: none !important;
          }
        `}
      </style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: "24px 32px",
    width: "100%",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  title: {
    fontSize: "24px",
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
  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  exportBtn: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  refreshBtn: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #e5e7eb",
    padding: "8px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  bulkBtn: {
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#fff",
    padding: "14px 18px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s ease",
    cursor: "default",
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f9c349",
    fontSize: "16px",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
  },
  bulkActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 18px",
    background: "#fff",
    borderRadius: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
    border: "1px solid #e5e7eb",
  },
  bulkTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  bulkActionBtn: {
    padding: "5px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#f9c349",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s ease",
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
    minWidth: "200px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    transition: "all 0.2s ease",
  },
  searchIcon: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
    background: "transparent",
    color: "#0f172a",
    padding: "2px 0",
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
    minWidth: "130px",
  },
  filterIcon: {
    color: "#94a3b8",
    fontSize: "14px",
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
    padding: "8px 14px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  tableContainer: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "12px 20px",
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
    minWidth: "850px",
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
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#f9c349",
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
  experienceBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#0f172a",
  },
  dateBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748b",
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  statusSelect: {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    fontSize: "12px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  viewBtn: {
    padding: "4px 10px",
    background: "#f9c349",
    border: "none",
    borderRadius: "6px",
    color: "#0f172a",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#475569",
    margin: 0,
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  emptyBtn: {
    padding: "8px 18px",
    background: "#f9c349",
    border: "none",
    borderRadius: "8px",
    color: "#0f172a",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "4px",
    fontSize: "13px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "14px 20px",
    borderTop: "1px solid #e5e7eb",
  },
  pageBtn: {
    padding: "6px 14px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
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
  },
  modalContent: {
    background: "#fff",
    borderRadius: "16px",
    maxWidth: "680px",
    width: "95%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  modalAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#fff",
    fontSize: "20px",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  modalStatusBadge: {
    padding: "2px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginTop: "4px",
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
    padding: "24px",
    overflowY: "auto",
    maxHeight: "calc(90vh - 140px)",
  },
  modalStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "8px",
    marginBottom: "20px",
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  modalStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#475569",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },
  modalSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "6px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  infoItem: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  infoItem: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "500",
  },
  skillsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "4px",
  },
  skillTag: {
    padding: "2px 8px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500",
  },
  noSkills: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  coverLetter: {
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "14px",
    lineHeight: "1.8",
    color: "#0f172a",
    border: "1px solid #e5e7eb",
    marginTop: "4px",
  },
  modalLinks: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #e5e7eb",
  },
  modalLink: {
    padding: "4px 12px",
    background: "#f1f5f9",
    borderRadius: "6px",
    textDecoration: "none",
    color: "#475569",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },
  modalActions: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #e5e7eb",
  },
  modalActionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  modalActionGroup: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  modalStatusSelect: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
    maxWidth: "200px",
    fontFamily: "'Inter', sans-serif",
  },
};

export default CandidatesManager;