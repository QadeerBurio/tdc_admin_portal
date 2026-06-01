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
  FaArrowRight
} from "react-icons/fa";

const ClaimedUsers = () => {
  const { token } = useContext(AuthContext);
  const [claimedUsers, setClaimedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortField, setSortField] = useState("claimedAt");
  const [sortDirection, setSortDirection] = useState("desc");

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
    
    results = sortUsers(results);
    setFilteredUsers(results);
  }, [searchTerm, claimedUsers, sortField, sortDirection]);

  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "claimedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
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
    try {
      const res = await axios.get("http://localhost:5000/api/offers/claimed-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaimedUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching claimed users", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
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
    const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    const index = uni?.length % colors.length;
    return colors[index];
  };

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration}></div>

      <div style={styles.header}>
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
              placeholder="Search by name, ID, email or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <FaTimes style={styles.clearIcon} onClick={() => setSearchTerm("")} />}
          </div>
          <button className="download-btn" style={styles.downloadBtn} onClick={downloadCSV} disabled={filteredUsers.length === 0}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview Section */}
      <div style={styles.statsRow}>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fff7ed'}}>
            <FaUserGraduate color="#ff961a" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Total Leads</span>
            <h3 style={styles.statValue}>{claimedUsers.length}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#eff6ff'}}>
            <FaUniversity color="#3b82f6" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Universities</span>
            <h3 style={styles.statValue}>{new Set(claimedUsers.map(u => u.universityName)).size}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaChartLine color="#10b981" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Active Claims</span>
            <h3 style={styles.statValue}>{filteredUsers.length}</h3>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th} onClick={() => handleSort("name")}>
                Student Details {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("universityName")}>
                University {sortField === "universityName" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("email")}>
                Contact {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("offerTitle")}>
                Offer {sortField === "offerTitle" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("claimedAt")}>
                Date {sortField === "claimedAt" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={styles.loadingCell}>
                  <div className="loader" style={styles.loader}></div>
                  <span>Loading student records...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📋</div>
                    <p>No matching records found</p>
                    <span>Try adjusting your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((item, index) => (
                <tr 
                  key={item._id || index} 
                  className="table-row"
                  style={styles.tr}
                  onClick={() => setSelectedUser(selectedUser === item ? null : item)}
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
                      <span>{new Date(item.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Showing {filteredUsers.length} of {claimedUsers.length} leads
        </span>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .stat-card {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        
        .table-row {
          transition: all 0.2s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .table-row:nth-child(1) { animation-delay: 0.05s; }
        .table-row:nth-child(2) { animation-delay: 0.1s; }
        .table-row:nth-child(3) { animation-delay: 0.15s; }
        .table-row:nth-child(4) { animation-delay: 0.2s; }
        .table-row:nth-child(5) { animation-delay: 0.25s; }
        
        .table-row:hover {
          background: #f8fafc;
          transform: translateX(4px);
        }
        
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 150, 26, 0.2);
        }
        
        th {
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        th:hover {
          background: #e8edf2;
        }
        
        .table-container {
          animation: fadeInScale 0.5s ease forwards;
        }
        
        .loader {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #ff961a;
          border-radius: 50%;
          animation: pulse 0.8s linear infinite;
        }
        
        input:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { 
    padding: "30px 35px", 
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "85vh", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    borderRadius: "32px",
    overflow: "hidden"
  },
  bgDecoration: {
    position: "absolute",
    top: "-100px",
    right: "-50px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: "32px", 
    flexWrap: "wrap", 
    gap: "20px",
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
    marginBottom: "16px"
  },
  title: { 
    margin: 0, 
    color: "#1e293b", 
    fontSize: "28px", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subtitle: { 
    margin: "8px 0 0 0", 
    color: "#64748b", 
    fontSize: "14px" 
  },
  actionGroup: { 
    display: "flex", 
    gap: "14px", 
    alignItems: "center" 
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
    fontSize: "12px",
    transition: "color 0.2s"
  },
  searchInput: { 
    padding: "12px 40px 12px 40px", 
    borderRadius: "16px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    width: "280px", 
    outline: "none", 
    transition: "all 0.2s ease",
    backgroundColor: "#fff",
    fontWeight: "500",
    "&:focus": { borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }
  },
  downloadBtn: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    padding: "12px 24px", 
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    border: "none", 
    borderRadius: "16px", 
    cursor: "pointer", 
    fontWeight: "600", 
    transition: "all 0.3s ease", 
    color: "#fff", 
    fontSize: "14px"
  },
  statsRow: { 
    display: "flex", 
    gap: "20px", 
    marginBottom: "32px",
    position: "relative",
    zIndex: 1
  },
  statCard: { 
    flex: 1, 
    background: "#fff", 
    padding: "20px 24px", 
    borderRadius: "24px", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    display: "flex", 
    alignItems: "center", 
    gap: "16px",
    border: "1px solid rgba(255,150,26,0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease"
  },
  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
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
    fontSize: "28px", 
    color: "#1e293b",
    fontWeight: "800"
  },
  tableWrapper: { 
    background: "#fff", 
    borderRadius: "24px", 
    boxShadow: "0 8px 30px rgba(0,0,0,0.05)", 
    overflow: "hidden",
    border: "1px solid #f1f5f9",
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
    padding: "16px 20px", 
    color: "#475569", 
    fontSize: "12px", 
    textTransform: "uppercase", 
    fontWeight: "700", 
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0",
    transition: "background 0.2s"
  },
  td: { 
    padding: "16px 20px", 
    borderBottom: "1px solid #f1f5f9", 
    fontSize: "14px", 
    color: "#334155"
  },
  tr: { 
    transition: "all 0.2s ease", 
    cursor: "pointer" 
  },
  loadingCell: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b"
  },
  loader: {
    width: "24px",
    height: "24px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%",
    margin: "0 auto 12px"
  },
  emptyCell: {
    padding: "60px",
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
    color: "#fff"
  },
  studentName: {
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "4px"
  },
  studentRoll: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center"
  },
  universityBadge: {
    display: "inline-block",
    padding: "6px 12px",
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
    gap: "6px"
  },
  offerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#1e293b"
  },
  offerTitle: {
    fontWeight: "500"
  },
  discountBadge: {
    display: "inline-block",
    background: "#f0fdf4",
    color: "#10b981",
    padding: "4px 8px",
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
  footer: {
    marginTop: "20px",
    textAlign: "center",
    padding: "16px",
    position: "relative",
    zIndex: 1
  },
  footerText: {
    fontSize: "13px",
    color: "#94a3b8"
  }
};

export default ClaimedUsers;