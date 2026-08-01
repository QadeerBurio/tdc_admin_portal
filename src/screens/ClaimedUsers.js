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
  FaQrcode,
  FaPercent,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaPrint,
  FaShare,
  FaWhatsapp,
  FaEnvelope as FaEmail,
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
  const [filterStatus, setFilterStatus] = useState("");
  const [universities, setUniversities] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    universities: 0,
    newThisWeek: 0,
    avgDiscount: 0
  });

  useEffect(() => {
    fetchClaimedUsers();
  }, [token]);

  useEffect(() => {
    let results = claimedUsers.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.rollNo?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.universityName?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.offerTitle?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    
    if (filterUniversity) {
      results = results.filter(user => user.universityName === filterUniversity);
    }
    
    if (filterStatus) {
      const now = new Date();
      results = results.filter(user => {
        const days = Math.floor((now - new Date(user.claimedAt)) / (1000 * 60 * 60 * 24));
        if (filterStatus === "new") return days <= 7;
        if (filterStatus === "active") return days > 7 && days <= 30;
        if (filterStatus === "old") return days > 30;
        return true;
      });
    }
    
    results = sortUsers(results);
    setFilteredUsers(results);
  }, [searchTerm, claimedUsers, sortField, sortDirection, filterUniversity, filterStatus]);

  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "claimedAt" || sortField === "redemptionsCount") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
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
      
      const usersWithUni = res.data.map(user => ({
        ...user,
        universityName: user.universityName || user.university?.name || "N/A"
      }));
      
      setClaimedUsers(usersWithUni);
      setFilteredUsers(usersWithUni);
      
      const uniSet = new Set(usersWithUni.map(u => u.universityName).filter(Boolean));
      setUniversities([...uniSet]);
      
      const now = new Date();
      const newThisWeek = usersWithUni.filter(u => {
        const days = Math.floor((now - new Date(u.claimedAt)) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }).length;
      
      const avgDiscount = usersWithUni.length > 0 
        ? usersWithUni.reduce((sum, u) => sum + (u.discountPercentage || 0), 0) / usersWithUni.length 
        : 0;
      
      setStats({
        total: usersWithUni.length,
        universities: uniSet.size,
        newThisWeek: newThisWeek,
        avgDiscount: Math.round(avgDiscount)
      });
    } catch (err) {
      console.error("Error fetching claimed users", err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Roll No", "University", "Email", "Phone", "Offer Title", "Discount", "Redeemed Count", "Date Claimed", "Status"];
    const rows = filteredUsers.map(u => {
      const status = getStatusInfo(u.claimedAt);
      return [
        u.name || "N/A",
        u.rollNo || "N/A",
        u.universityName || "N/A",
        u.email || "N/A",
        u.phone || "N/A",
        u.offerTitle || "N/A",
        `${u.discountPercentage || 0}%`,
        u.redemptionsCount || 0,
        new Date(u.claimedAt).toLocaleDateString(),
        status.label
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(v => `"${v}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Claimed_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUniversityColor = (uni) => {
    if (!uni) return '#94a3b8';
    const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];
    const index = uni.length % colors.length;
    return colors[index];
  };

  const getStatusInfo = (date) => {
    if (!date) return { bg: '#f1f5f9', color: '#64748b', label: 'Unknown', icon: '❓' };
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days <= 7) return { bg: '#d1fae5', color: '#059669', label: 'New', icon: '🌟' };
    if (days <= 30) return { bg: '#fef3c7', color: '#d97706', label: 'Active', icon: '⚡' };
    return { bg: '#f1f5f9', color: '#64748b', label: 'Old', icon: '📅' };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setShowActionMenu(null);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const toggleActionMenu = (userId) => {
    setShowActionMenu(showActionMenu === userId ? null : userId);
  };

  const handleAction = (action, user) => {
    setShowActionMenu(null);
    switch(action) {
      case 'view':
        openUserDetails(user);
        break;
      case 'email':
        window.location.href = `mailto:${user.email}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/92${user.phone || ''}`, '_blank');
        break;
      case 'print':
        window.print();
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: `Student: ${user.name}`,
            text: `Check out this student: ${user.name} from ${user.universityName}`,
            url: window.location.href,
          });
        }
        break;
      default:
        break;
    }
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

  const renderUserModal = () => {
    if (!showUserModal || !selectedUser) return null;

    const status = getStatusInfo(selectedUser.claimedAt);
    const uniColor = getUniversityColor(selectedUser.universityName);

    return (
      <div style={styles.modalOverlay} onClick={closeUserModal}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div style={styles.modalHeaderLeft}>
              <div style={{...styles.modalAvatar, background: uniColor}}>
                {getInitials(selectedUser.name)}
              </div>
              <div>
                <h3 style={styles.modalName}>{selectedUser.name || "Unknown"}</h3>
                <p style={styles.modalRoll}>
                  <FaIdCard size={12} style={{marginRight: '6px'}} />
                  Roll No: {selectedUser.rollNo || "N/A"}
                </p>
              </div>
            </div>
            <button style={styles.modalClose} onClick={closeUserModal}>
              <FaTimes />
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.modalGrid}>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>University</label>
                <p style={styles.modalValue}>
                  <FaUniversity size={14} style={{marginRight: '8px', color: uniColor}} />
                  <span style={{fontWeight: '600', color: uniColor}}>
                    {selectedUser.universityName || "N/A"}
                  </span>
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Email</label>
                <p style={styles.modalValue}>
                  <FaEnvelope size={14} style={{marginRight: '8px', color: '#94a3b8'}} />
                  {selectedUser.email || "N/A"}
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Offer</label>
                <p style={styles.modalValue}>
                  <FaTag size={14} style={{marginRight: '8px', color: '#ff961a'}} />
                  {selectedUser.offerTitle || "N/A"}
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Discount</label>
                <p style={styles.modalValue}>
                  <FaPercent size={14} style={{marginRight: '8px', color: '#10b981'}} />
                  <span style={styles.modalDiscount}>{selectedUser.discountPercentage || 0}% OFF</span>
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Redemptions</label>
                <p style={styles.modalValue}>
                  <FaCheckCircle size={14} style={{marginRight: '8px', color: '#8b5cf6'}} />
                  {selectedUser.redemptionsCount || 0} times
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Claimed Date</label>
                <p style={styles.modalValue}>
                  <FaCalendarAlt size={14} style={{marginRight: '8px', color: '#94a3b8'}} />
                  {formatDate(selectedUser.claimedAt)} at {formatTime(selectedUser.claimedAt)}
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Status</label>
                <p style={styles.modalValue}>
                  <span style={{...styles.statusBadge, background: status.bg, color: status.color}}>
                    {status.icon} {status.label}
                  </span>
                </p>
              </div>
              <div style={styles.modalInfoItem}>
                <label style={styles.modalLabel}>Total Saved</label>
                <p style={styles.modalValue}>
                  <FaStar size={14} style={{marginRight: '8px', color: '#f59e0b'}} />
                  Rs. {selectedUser.totalSaved?.toLocaleString() || 0}
                </p>
              </div>
            </div>

          
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
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
            <h3 style={styles.statValue}>{stats.total}</h3>
            <span style={styles.statTrend}>{stats.newThisWeek} new this week</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#eff6ff'}}>
            <FaUniversity color="#3b82f6" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Universities</span>
            <h3 style={styles.statValue}>{stats.universities}</h3>
            <span style={styles.statTrend}>Across {stats.total} students</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaChartLine color="#10b981" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Avg Discount</span>
            <h3 style={styles.statValue}>{stats.avgDiscount}%</h3>
            <span style={styles.statTrend}>Average offer discount</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fef3c7'}}>
            <FaStar color="#f59e0b" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Active Filters</span>
            <h3 style={styles.statValue}>{filteredUsers.length}</h3>
            <span style={styles.statTrend}>Showing results</span>
          </div>
        </div>
      </motion.div>

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
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select
                style={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="new">🌟 New (0-7 days)</option>
                <option value="active">⚡ Active (8-30 days)</option>
                <option value="old">📅 Old (30+ days)</option>
              </select>
            </div>
            <button style={styles.filterClear} onClick={() => { setFilterUniversity(""); setFilterStatus(""); setSearchTerm(""); }}>
              Clear All Filters
            </button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.tableWrapper}
      >
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={{...styles.th, minWidth: '180px'}} onClick={() => handleSort("name")}>
                Student {sortField === "name" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={{...styles.th, minWidth: '140px'}} onClick={() => handleSort("offerTitle")}>
                Offer {sortField === "offerTitle" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={{...styles.th, minWidth: '80px'}} onClick={() => handleSort("discountPercentage")}>
                Discount {sortField === "discountPercentage" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={{...styles.th, minWidth: '80px'}} onClick={() => handleSort("redemptionsCount")}>
                Uses {sortField === "redemptionsCount" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={{...styles.th, minWidth: '120px'}} onClick={() => handleSort("claimedAt")}>
                Date {sortField === "claimedAt" && (sortDirection === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />)}
              </th>
              <th style={{...styles.th, minWidth: '100px'}}>Status</th>
              
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyCell}>
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
                const status = getStatusInfo(item.claimedAt);
                const uniColor = getUniversityColor(item.universityName);
                const isActionOpen = showActionMenu === item._id;
                
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
                        <div style={{...styles.avatar, background: uniColor}}>
                          {getInitials(item.name)}
                        </div>
                        <div>
                          <div style={styles.studentName}>{item.name || "Unknown"}</div>
                          
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.offerCell}>
                        <div style={styles.offerBadge}>
                          <FaTag size={10} color="#ff961a" />
                          <span style={styles.offerTitle}>{item.offerTitle || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.discountBadge}>
                        {item.discountPercentage || 0}% OFF
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.usesBadge}>
                        {item.redemptionsCount || 0} ×
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.dateCell}>
                        <FaCalendarAlt size={12} color="#94a3b8" />
                        <span>{formatDate(item.claimedAt)}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, background: status.bg, color: status.color}}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                   
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={styles.footer}
      >
        <span style={styles.footerText}>
          Showing {filteredUsers.length} of {claimedUsers.length} leads
          {filterUniversity && ` • Filtered by: ${filterUniversity}`}
          {filterStatus && ` • Status: ${filterStatus}`}
          {searchTerm && ` • Search: "${searchTerm}"`}
        </span>
        <button style={styles.viewAllBtn} onClick={() => { setFilterUniversity(""); setFilterStatus(""); setSearchTerm(""); }}>
          View All <FaArrowRight size={12} />
        </button>
      </motion.div>

      {renderUserModal()}

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
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes dropdownIn {
            from { opacity: 0; transform: scale(0.95) translateY(-5px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
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
    zIndex: 1,
    overflowX: 'auto'
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    textAlign: "left",
    minWidth: '800px'
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
    transition: "background 0.2s",
    whiteSpace: 'nowrap'
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
    fontSize: "14px",
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
    fontSize: "12px",
    fontWeight: "700",
    width: "fit-content"
  },
  usesBadge: {
    display: "inline-block",
    background: "#eff6ff",
    color: "#3b82f6",
    padding: "2px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
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
  actionCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    position: "relative"
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    padding: "6px 8px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    hover: {
      background: "#f1f5f9"
    }
  },
  viewBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    color: "#475569",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
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
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    animation: "modalIn 0.3s ease forwards",
    boxShadow: "0 40px 80px -20px rgba(0,0,0,0.3)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 28px",
    borderBottom: "1px solid #e5e7eb"
  },
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  modalAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    flexShrink: 0
  },
  modalName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  modalRoll: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: "4px 0 0",
    display: "flex",
    alignItems: "center"
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  },
  modalBody: {
    padding: "24px 28px"
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  modalInfoItem: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "12px"
  },
  modalLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px"
  },
  modalValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center"
  },
  modalDiscount: {
    color: "#10b981",
    fontWeight: "700"
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  modalActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    hover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
    }
  }
};

export default ClaimedUsers;