import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  FaUsers, 
  FaSearch, 
  FaUniversity, 
  FaTag, 
  FaDownload, 
  FaUserGraduate, 
  FaCalendarAlt,
  FaTimes,
  FaChartLine,
  FaEnvelope,
  FaIdCard,
  FaStore,
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ClaimedUsers = () => {
  const { token } = useContext(AuthContext);
  const [claimedUsers, setClaimedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortField, setSortField] = useState("claimedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterUniversity, setFilterUniversity] = useState("");
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    fetchClaimedUsers();
  }, [token]);

  useEffect(() => {
    let results = claimedUsers.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.rollNo?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.universityName?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    
    if (filterUniversity) {
      results = results.filter(user => user.universityName === filterUniversity);
    }
    
    results = sortUsers(results);
    setFilteredUsers(results);
  }, [searchTerm, claimedUsers, sortField, sortDirection, filterUniversity]);

  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "claimedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const fetchClaimedUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/offers/claimed-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaimedUsers(res.data);
      setFilteredUsers(res.data);
      
      // Extract unique universities
      const uniSet = new Set(res.data.map(u => u.universityName).filter(Boolean));
      setUniversities([...uniSet]);
    } catch (err) {
      console.error("Error fetching claimed users", err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Roll No", "University", "Email", "Offer Title", "Discount", "Date"];
    const rows = filteredUsers.map(u => [
      u.name,
      u.rollNo || "N/A",
      u.universityName || "N/A",
      u.email,
      u.offerTitle,
      `${u.discountPercentage}%`,
      new Date(u.claimedAt).toLocaleDateString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Claimed_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUniversityColor = (uni) => {
    const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444'];
    const index = uni?.length % colors.length;
    return colors[index];
  };

  const getStatusColor = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days <= 7) return { bg: '#d1fae5', color: '#059669', label: 'New' };
    if (days <= 30) return { bg: '#fef3c7', color: '#d97706', label: 'Active' };
    return { bg: '#f1f5f9', color: '#64748b', label: 'Old' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <FaSpinner size={50} color="#f9c349" />
      </motion.div>
      <p style={styles.loadingText}>Loading student records...</p>
      <div style={styles.loadingBar}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity }}
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
          <div style={styles.headerBadge}>
            <FaUsers />
            <span>Lead Management</span>
          </div>
          <h2 style={styles.title}>Claimed Students</h2>
          <p style={styles.subtitle}>Track and manage students who claimed your brand offers</p>
        </div>
        <div style={styles.actionGroup}>
          <div style={styles.searchWrapper}>
            <FaSearch style={styles.searchIcon} />
            <input 
              style={styles.searchInput}
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <FaTimes style={styles.clearIcon} onClick={() => setSearchTerm("")} />}
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={styles.downloadBtn}
            onClick={downloadCSV}
            disabled={filteredUsers.length === 0}
          >
            <FaDownload /> Export CSV
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={styles.statsRow}
      >
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fff7ed'}}>
            <FaUserGraduate color="#ff961a" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Total Leads</span>
            <h3 style={styles.statValue}>{claimedUsers.length}</h3>
            <span style={styles.statTrend}>+12% this month</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#eff6ff'}}>
            <FaUniversity color="#3b82f6" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Universities</span>
            <h3 style={styles.statValue}>{universities.length}</h3>
            <span style={styles.statTrend}>Across {claimedUsers.length} students</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaChartLine color="#10b981" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Active Claims</span>
            <h3 style={styles.statValue}>{filteredUsers.length}</h3>
            <span style={styles.statTrend}>Filtered results</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fef3c7'}}>
            <FaStar color="#f59e0b" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>New This Week</span>
            <h3 style={styles.statValue}>
              {claimedUsers.filter(u => {
                const days = Math.floor((new Date() - new Date(u.claimedAt)) / (1000 * 60 * 60 * 24));
                return days <= 7;
              }).length}
            </h3>
            <span style={styles.statTrend}>Recent claims</span>
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
        <button style={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> Filters {showFilters ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.filterDropdown}
          >
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>University</label>
              <select
                style={styles.filterSelect}
                value={filterUniversity}
                onChange={(e) => setFilterUniversity(e.target.value)}
              >
                <option value="">All Universities</option>
                {universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
            <button style={styles.filterClear} onClick={() => { setFilterUniversity(""); setSearchTerm(""); }}>
              Clear All Filters
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.tableWrapper}
      >
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th} onClick={() => handleSort("name")}>
                Student {sortField === "name" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={styles.th} onClick={() => handleSort("universityName")}>
                University {sortField === "universityName" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={styles.th} onClick={() => handleSort("email")}>
                Contact {sortField === "email" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={styles.th} onClick={() => handleSort("offerTitle")}>
                Offer {sortField === "offerTitle" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={styles.th} onClick={() => handleSort("claimedAt")}>
                Date {sortField === "claimedAt" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.emptyState}
                  >
                    <div style={styles.emptyIcon}>📋</div>
                    <h4 style={styles.emptyTitle}>No matching records found</h4>
                    <p style={styles.emptyText}>Try adjusting your search criteria or filters</p>
                  </motion.div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((item, index) => {
                const status = getStatusColor(item.claimedAt);
                return (
                  <motion.tr 
                    key={item._id || index} 
                    className="table-row"
                    style={styles.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "#f8fafc", x: 4 }}
                  >
                    <td style={styles.td}>
                      <div style={styles.studentCell}>
                        <div style={{...styles.avatar, background: getUniversityColor(item.name)}}>
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.studentName}>{item.name}</div>
                          <div style={styles.studentRoll}>
                            <FaIdCard size={10} style={{marginRight: '4px'}} />
                            Roll: {item.rollNo || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.universityBadge, background: `${getUniversityColor(item.universityName)}15`, color: getUniversityColor(item.universityName)}}>
                        <FaUniversity size={10} style={{marginRight: '6px'}} />
                        {item.universityName?.length > 30 ? item.universityName.substring(0, 27) + '...' : item.universityName}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.contactCell}>
                        <FaEnvelope size={12} color="#94a3b8" />
                        <span>{item.email}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.offerCell}>
                        <div style={styles.offerBadge}>
                          <FaTag size={10} color="#ff961a" />
                          <span style={styles.offerTitle}>{item.offerTitle}</span>
                        </div>
                        <div style={styles.discountBadge}>
                          {item.discountPercentage}% OFF
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.dateCell}>
                        <FaCalendarAlt size={12} color="#94a3b8" />
                        <span>{formatDate(item.claimedAt)}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, background: status.bg, color: status.color}}>
                        {status.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={styles.footer}
      >
        <span style={styles.footerText}>
          Showing {filteredUsers.length} of {claimedUsers.length} leads
          {filterUniversity && ` • Filtered by: ${filterUniversity}`}
          {searchTerm && ` • Search: "${searchTerm}"`}
        </span>
        <button style={styles.viewAllBtn} onClick={() => { setFilterUniversity(""); setSearchTerm(""); }}>
          View All <FaArrowRight size={12} />
        </button>
      </motion.div>

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
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .stat-card {
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          }
          
          .table-row {
            transition: all 0.2s ease;
          }
          
          th {
            cursor: pointer;
            user-select: none;
            transition: background 0.2s ease;
          }
          th:hover {
            background: #e8edf2;
          }
          
          input:focus {
            outline: none;
          }
          
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
    padding: "28px 32px", 
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "85vh", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    borderRadius: "32px",
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
    alignItems: "flex-start", 
    marginBottom: "28px", 
    flexWrap: "wrap", 
    gap: "16px",
    position: "relative",
    zIndex: 1
  },
  headerLeft: {
    flex: 1
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff7ed",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "12px"
  },
  title: { 
    margin: 0, 
    color: "#0f172a", 
    fontSize: "28px", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subtitle: { 
    margin: "6px 0 0 0", 
    color: "#64748b", 
    fontSize: "14px" 
  },
  actionGroup: { 
    display: "flex", 
    gap: "12px", 
    alignItems: "center",
    flexWrap: "wrap"
  },
  searchWrapper: { 
    position: "relative", 
    display: "flex", 
    alignItems: "center" 
  },
  searchIcon: { 
    position: "absolute", 
    left: "14px", 
    color: "#94a3b8",
    fontSize: "14px"
  },
  clearIcon: { 
    position: "absolute", 
    right: "14px", 
    color: "#94a3b8", 
    cursor: "pointer",
    fontSize: "14px",
    transition: "color 0.2s"
  },
  searchInput: { 
    padding: "11px 40px 11px 40px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    width: "260px", 
    outline: "none", 
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    fontWeight: "500",
    color: "#0f172a",
  },
  downloadBtn: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    padding: "11px 22px", 
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    border: "none", 
    borderRadius: "14px", 
    cursor: "pointer", 
    fontWeight: "600", 
    transition: "all 0.3s ease", 
    color: "#fff", 
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  statsRow: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px", 
    marginBottom: "28px",
    position: "relative",
    zIndex: 1
  },
  statCard: { 
    background: "#fff", 
    padding: "18px 22px", 
    borderRadius: "20px", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    display: "flex", 
    alignItems: "center", 
    gap: "14px",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer"
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  statLabel: { 
    display: "block", 
    color: "#64748b", 
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  statValue: { 
    margin: "4px 0 0", 
    fontSize: "24px", 
    color: "#0f172a",
    fontWeight: "800"
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "500"
  },
  filterBar: {
    marginBottom: "20px",
    position: "relative",
    zIndex: 1
  },
  filterToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.3s ease",
  },
  filterDropdown: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    marginTop: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "flex-end"
  },
  filterGroup: {
    flex: 1,
    minWidth: "180px"
  },
  filterLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px"
  },
  filterSelect: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    background: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer"
  },
  filterClear: {
    padding: "10px 20px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    color: "#475569",
    transition: "all 0.3s ease",
  },
  tableWrapper: { 
    background: "#fff", 
    borderRadius: "20px", 
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)", 
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    position: "relative",
    zIndex: 1
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    textAlign: "left" 
  },
  theadRow: {
    background: "#f8fafc"
  },
  th: { 
    padding: "14px 18px", 
    color: "#475569", 
    fontSize: "11px", 
    textTransform: "uppercase", 
    fontWeight: "700", 
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e5e7eb",
    transition: "background 0.2s"
  },
  td: { 
    padding: "14px 18px", 
    borderBottom: "1px solid #f1f5f9", 
    fontSize: "14px", 
    color: "#334155"
  },
  tr: { 
    transition: "all 0.2s ease", 
    cursor: "pointer" 
  },
  emptyCell: {
    padding: "60px 20px",
    textAlign: "center"
  },
  emptyState: {
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5
  },
  emptyTitle: {
    margin: "8px 0 4px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a"
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8"
  },
  studentCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "#fff",
    flexShrink: 0
  },
  studentName: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "2px",
    fontSize: "14px"
  },
  studentRoll: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center"
  },
  universityBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    maxWidth: "200px"
  },
  contactCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569"
  },
  offerCell: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  offerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a"
  },
  offerTitle: {
    fontWeight: "500"
  },
  discountBadge: {
    display: "inline-block",
    background: "#f0fdf4",
    color: "#10b981",
    padding: "2px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    width: "fit-content"
  },
  dateCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#64748b"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600"
  },
  footer: {
    marginTop: "20px",
    padding: "16px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
    gap: "12px"
  },
  footerText: {
    fontSize: "13px",
    color: "#94a3b8"
  },
  viewAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    color: "#ff961a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.3s ease"
  }
};

export default ClaimedUsers;