import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Users, Download, Search, X, CheckCircle, Clock, 
  UserCheck, UserX, Mail, Building, Shield, Filter,
  ChevronRight, TrendingUp, Award, Sparkles
} from "lucide-react";

export default function AdminUserList({ role, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/users/${role}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const downloadExcel = () => {
    const dataToExport = users.map((user) => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      University: role === "student" ? (user.university?.name || "N/A") : "N/A",
      Joined_Date: new Date(user.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `${role}_report_${Date.now()}.xlsx`);
  };

  const toggleVerification = async (id) => {
    setTogglingId(id);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/approve-user/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("Error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "verified" && user.status === "Verified") ||
      (filterStatus === "pending" && user.status !== "Verified");
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = users.filter(u => u.status === "Verified").length;
  const pendingCount = users.filter(u => u.status !== "Verified").length;

  if (loading) {
    return (
      <div className="loader-container" style={styles.loadingContainer}>
        <div className="spinner" style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading user records...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.container}>
        {/* Header Section */}
        <div className="animate-header" style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <Users size={14} />
              <span>User Management</span>
            </div>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.subtitle}>
              Manage and monitor all {role} accounts in your platform
            </p>
          </div>
          <button
            className="download-btn"
            onClick={downloadExcel}
            disabled={users.length === 0}
            style={{...styles.downloadBtn, opacity: users.length === 0 ? 0.5 : 1}}
          >
            <Download size={16} />
            Export to Excel
          </button>
        </div>

        {/* Stats Summary */}
        <div className="stats-group" style={styles.statsGrid}>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#ecfdf5'}}>
              <Users size={20} color="#10b981" />
            </div>
            <div>
              <div style={styles.statValue}>{filteredUsers.length}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#eff6ff'}}>
              <CheckCircle size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.statValue}>{verifiedCount}</div>
              <div style={styles.statLabel}>Verified</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#fef3c7'}}>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.statValue}>{pendingCount}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="animate-controls" style={styles.controlsBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={styles.clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
          <div style={styles.filterGroup}>
            <button
              className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
              style={{...styles.filterBtn, ...(filterStatus === "all" ? styles.activeFilter : {})}}
              onClick={() => setFilterStatus("all")}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterStatus === "verified" ? "active" : ""}`}
              style={{...styles.filterBtn, ...(filterStatus === "verified" ? styles.activeFilter : {})}}
              onClick={() => setFilterStatus("verified")}
            >
              <CheckCircle size={12} /> Verified
            </button>
            <button
              className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
              style={{...styles.filterBtn, ...(filterStatus === "pending" ? styles.activeFilter : {})}}
              onClick={() => setFilterStatus("pending")}
            >
              <Clock size={12} /> Pending
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container" style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>USER</th>
                <th style={styles.th}>EMAIL</th>
                {role === "student" && <th style={styles.th}>UNIVERSITY</th>}
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, index) => (
                  <tr
                    key={u._id}
                    className="user-row"
                    style={{
                      ...styles.tr,
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.avatar}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={styles.userName}>{u.name}</span>
                          <div style={styles.userRole}>{u.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.emailCell}>
                        <Mail size={12} color="#94a3b8" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    {role === "student" && (
                      <td style={styles.td}>
                        <span style={styles.universityTag}>
                          <Building size={12} />
                          {u.university?.name || "N/A"}
                        </span>
                      </td>
                    )}
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
                    <td style={styles.td}>
                      <button
                        className="action-btn"
                        onClick={() => toggleVerification(u._id)}
                        disabled={togglingId === u._id}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: u.status === "Verified" ? "#ef444410" : "#10b98110",
                          color: u.status === "Verified" ? "#ef4444" : "#10b981",
                          border: u.status === "Verified"
                            ? "1px solid #ef444430"
                            : "1px solid #10b98130",
                        }}
                      >
                        {togglingId === u._id ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : u.status === "Verified" ? (
                          <>Revoke Access</>
                        ) : (
                          <>Approve User</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <p>No users found</p>
                    <span style={styles.emptySubtext}>
                      {searchTerm ? "Try adjusting your search" : "No users registered yet"}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-header {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .stats-group {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.15s;
        }
        
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        
        .animate-controls {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.2s;
        }
        
        .filter-btn {
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          transform: translateY(-1px);
        }
        .filter-btn.active {
          background: #fff;
          color: #ff961a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .table-container {
          animation: fadeInScale 0.5s ease forwards;
          animation-delay: 0.25s;
        }
        
        .user-row {
          transition: all 0.2s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .user-row:hover {
          background: #f8fafc;
        }
        
        .download-btn {
          transition: all 0.3s ease;
        }
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(8, 99, 79, 0.3);
        }
        
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          transform: translateY(-1px);
        }
        
        .loader-container {
          animation: pulse 1.5s ease infinite;
        }
      `}</style>
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
    background: 'radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  container: {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    border: "1px solid #f0f2f5",
    maxWidth: "1400px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
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
    borderRadius: "14px",
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
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "120px",
    padding: "16px 20px",
    background: "#fafbfc",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    border: "1px solid #f0f2f5",
    transition: "all 0.3s ease",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  controlsBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  searchWrapper: {
    position: "relative",
    width: "320px",
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
    padding: "12px 16px 12px 42px",
    fontSize: "14px",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#fff",
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
  filterGroup: {
    display: "flex",
    gap: "8px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "40px",
  },
  filterBtn: {
    padding: "8px 18px",
    borderRadius: "32px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  activeFilter: {
    background: "#fff",
    color: "#ff961a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "20px",
    border: "1px solid #f0f2f5",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },
  theadRow: {
    borderBottom: "1px solid #f0f2f5",
    background: "#fafbfc",
  },
  th: {
    textAlign: "left",
    padding: "16px 20px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f5f7fa",
    transition: "background 0.2s ease",
  },
  td: {
    padding: "16px 20px",
    fontSize: "14px",
    color: "#1e293b",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #ff961a10 0%, #f3b24510 100%)",
    color: "#ff961a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  userName: {
    fontWeight: "700",
    color: "#1e293b",
    display: "block",
    marginBottom: "2px",
  },
  userRole: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  emailCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#475569",
  },
  universityTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#f1f5f9",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#475569",
  },
  badge: {
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  badgeDotVerified: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    display: "inline-block",
  },
  badgeDotPending: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#f59e0b",
    display: "inline-block",
  },
  actionBtn: {
    padding: "8px 18px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
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
    background: "#ffffff",
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
    animation: "spin 0.8s linear infinite",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid currentColor",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);