import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { 
  Users, Download, Search, X, CheckCircle, Clock, 
  UserCheck, UserX, Mail, Building, Shield, Filter,
  ChevronRight, TrendingUp, Award, Sparkles, Eye,
  UserPlus, Link2, Phone, MapPin, Calendar, Star,
  CreditCard, Hash, User, GraduationCap, FileText,
  Crown, Zap, BarChart3, Gift, Trophy, Flame
} from "lucide-react";

export default function AdminUserList({ role, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReferral, setFilterReferral] = useState("all");
  const [togglingId, setTogglingId] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const navigate = useNavigate();

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
      const res = await fetch(`http://localhost:5000/api/admin/users/${role}`, {
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
      'Full Name': user.name,
      'Email': user.email,
      'Phone': user.phone || 'N/A',
      'Role': user.role,
      'Status': user.status,
      'University': role === "student" ? (user.university?.name || "N/A") : "N/A",
      'Roll No': user.rollNo || 'N/A',
      'Referral Code': user.referralCode || 'N/A',
      'Referral Count': user.referralCount || 0,
      'Referred By': user.referredBy?.name || 'None',
      'Is VIP': user.isVip ? 'Yes' : 'No',
      'Is Alumni': user.isAlumni ? 'Yes' : 'No',
      'Card Status': user.cardStatus || 'None',
      'Payment Status': user.paymentStatus || 'None',
      'Joined Date': new Date(user.createdAt).toLocaleDateString(),
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
        `http://localhost:5000/api/admin/approve-user/${id}`,
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

  const viewStudentDetails = (userId) => {
    navigate('/dossier', { state: { userId } });
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const verifiedCount = users.filter(u => u.status === "Verified").length;
  const pendingCount = users.filter(u => u.status !== "Verified").length;
  const vipCount = users.filter(u => u.isVip).length;
  const totalReferrals = users.reduce((sum, u) => sum + (u.referralCount || 0), 0);
  const highReferralCount = users.filter(u => (u.referralCount || 0) >= 10).length;

  const getReferralLevel = (count) => {
    if (count >= 10) return { level: '🔥 Elite', color: '#8b5cf6', bg: '#f5f3ff' };
    if (count >= 5) return { level: '⭐ Pro', color: '#f59e0b', bg: '#fffbeb' };
    if (count >= 1) return { level: '🌟 Starter', color: '#3b82f6', bg: '#eff6ff' };
    return { level: '💫 New', color: '#94a3b8', bg: '#f1f5f9' };
  };

  const isTopReferrer = (count) => count >= 10;

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
      {/* Animated Background Decorations */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

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

        {/* Enhanced Stats Summary */}
        <div className="stats-group" style={styles.statsGrid}>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#ecfdf5'}}>
              <Users size={22} color="#10b981" />
            </div>
            <div>
              <div style={styles.statValue}>{filteredAndSortedUsers.length}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#eff6ff'}}>
              <CheckCircle size={22} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.statValue}>{verifiedCount}</div>
              <div style={styles.statLabel}>Verified</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#fef3c7'}}>
              <Clock size={22} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.statValue}>{pendingCount}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#fdf2f8'}}>
              <Crown size={22} color="#ec4899" />
            </div>
            <div>
              <div style={styles.statValue}>{vipCount}</div>
              <div style={styles.statLabel}>VIP Members</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#fefce8'}}>
              <Gift size={22} color="#eab308" />
            </div>
            <div>
              <div style={styles.statValue}>{totalReferrals}</div>
              <div style={styles.statLabel}>Total Referrals</div>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#f5f3ff'}}>
              <Flame size={22} color="#8b5cf6" />
            </div>
            <div>
              <div style={styles.statValue}>{highReferralCount}</div>
              <div style={styles.statLabel}>Top Referrers (10+)</div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="animate-controls" style={styles.controlsBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, email or referral code..."
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
          <div style={styles.filterGroupWrapper}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
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
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Referrals:</span>
              <button
                className={`filter-btn ${filterReferral === "all" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "all" ? styles.activeFilter : {})}}
                onClick={() => setFilterReferral("all")}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterReferral === "high" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "high" ? styles.activeFilter : {})}}
                onClick={() => setFilterReferral("high")}
              >
                <Flame size={12} /> 10+
              </button>
              <button
                className={`filter-btn ${filterReferral === "medium" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "medium" ? styles.activeFilter : {})}}
                onClick={() => setFilterReferral("medium")}
              >
                <TrendingUp size={12} /> 5-9
              </button>
              <button
                className={`filter-btn ${filterReferral === "low" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "low" ? styles.activeFilter : {})}}
                onClick={() => setFilterReferral("low")}
              >
                <UserPlus size={12} /> 1-4
              </button>
              <button
                className={`filter-btn ${filterReferral === "none" ? "active" : ""}`}
                style={{...styles.filterBtn, ...(filterReferral === "none" ? styles.activeFilter : {})}}
                onClick={() => setFilterReferral("none")}
              >
                <X size={12} /> 0
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container" style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th} onClick={() => handleSort('name')} className="sortable">
                  USER {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('email')} className="sortable">
                  CONTACT {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
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
                <th style={{...styles.th, textAlign: 'center'}}>VIP</th>
                <th style={{...styles.th, textAlign: 'center'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length > 0 ? (
                filteredAndSortedUsers.map((u, index) => {
                  const referralLevel = getReferralLevel(u.referralCount);
                  const isTop = isTopReferrer(u.referralCount);
                  
                  return (
                    <React.Fragment key={u._id}>
                      <tr
                        className={`user-row ${isTop ? 'top-referrer' : ''}`}
                        style={{
                          ...styles.tr,
                          animationDelay: `${index * 0.05}s`,
                          cursor: 'pointer',
                          ...(isTop ? styles.topReferrerRow : {}),
                        }}
                        onClick={() => toggleExpand(u._id)}
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
                                {u.role} • {u.isAlumni ? '🎓 Alumni' : '📚 Student'}
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
                                  {referralLevel.level}
                                </span>
                              </div>
                              {isTop && (
                                <div style={styles.flameBadge}>
                                  <Flame size={14} color="#8b5cf6" />
                                  <span>Top Referrer</span>
                                </div>
                              )}
                            </div>
                            {u.referredBy && (
                              <div style={styles.referredBy}>
                                Referred by: <strong>{u.referredBy.name}</strong>
                              </div>
                            )}
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
                          {u.isVip ? (
                            <span style={styles.vipBadge}>
                              <Star size={12} color="#eab308" />
                              VIP
                            </span>
                          ) : (
                            <span style={styles.nonVipBadge}>—</span>
                          )}
                        </td>
                        <td style={{...styles.td, textAlign: 'center'}}>
                          <div style={styles.actionGroup}>
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewStudentDetails(u._id);
                              }}
                              style={styles.viewBtn}
                              title="View Full Dossier"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVerification(u._id);
                              }}
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
                            >
                              {togglingId === u._id ? (
                                <div style={styles.spinnerSmall}></div>
                              ) : u.status === "Verified" ? (
                                <UserX size={14} />
                              ) : (
                                <UserCheck size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row */}
                      {expandedUser === u._id && (
                        <tr>
                          <td colSpan="7" style={styles.expandedRow}>
                            <div style={styles.expandedContent}>
                              <div style={styles.expandedGrid}>
                                {/* Personal Information */}
                                <div style={styles.expandedSection}>
                                  <h4 style={styles.expandedTitle}>
                                    <User size={14} /> Personal Information
                                  </h4>
                                  <div style={styles.expandedDetails}>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Full Name</span>
                                      <span style={styles.detailValue}>{u.name}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Email</span>
                                      <span style={styles.detailValue}>{u.email}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Phone</span>
                                      <span style={styles.detailValue}>{u.phone || 'N/A'}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Address</span>
                                      <span style={styles.detailValue}>{u.address || 'N/A'}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Location</span>
                                      <span style={styles.detailValue}>{u.location || 'N/A'}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Instagram</span>
                                      <span style={styles.detailValue}>{u.instagram || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Academic Information */}
                                {role === "student" && (
                                  <div style={styles.expandedSection}>
                                    <h4 style={styles.expandedTitle}>
                                      <GraduationCap size={14} /> Academic Information
                                    </h4>
                                    <div style={styles.expandedDetails}>
                                      <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>University</span>
                                        <span style={styles.detailValue}>{u.university?.name || 'N/A'}</span>
                                      </div>
                                      <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Roll No</span>
                                        <span style={styles.detailValue}>{u.rollNo || 'N/A'}</span>
                                      </div>
                                      <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Alumni</span>
                                        <span style={styles.detailValue}>{u.isAlumni ? '✅ Yes' : '❌ No'}</span>
                                      </div>
                                      {u.skills && u.skills.length > 0 && (
                                        <div style={styles.detailRow}>
                                          <span style={styles.detailLabel}>Skills</span>
                                          <div style={styles.skillsList}>
                                            {u.skills.map((skill, i) => (
                                              <span key={i} style={styles.skillTagSmall}>{skill}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Referral Information */}
                                <div style={styles.expandedSection}>
                                  <h4 style={styles.expandedTitle}>
                                    <UserPlus size={14} /> Referral Information
                                  </h4>
                                  <div style={styles.expandedDetails}>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Referral Code</span>
                                      <span style={styles.referralCodeDisplay}>
                                        <code style={styles.referralCodeText}>{u.referralCode || 'N/A'}</code>
                                      </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Referral Count</span>
                                      <span style={styles.detailValue}>
                                        <span style={{
                                          ...styles.referralCountBadge,
                                          ...(isTop ? styles.topReferralBadge : {})
                                        }}>
                                          {u.referralCount || 0}
                                          {isTop && ' 🔥'}
                                        </span>
                                      </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Referral Level</span>
                                      <span style={styles.detailValue}>
                                        <span style={{
                                          ...styles.levelBadge,
                                          background: referralLevel.bg,
                                          color: referralLevel.color,
                                        }}>
                                          {referralLevel.level}
                                        </span>
                                      </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Referred By</span>
                                      <span style={styles.detailValue}>{u.referredBy?.name || 'None'}</span>
                                    </div>
                                    {u.referredBy && (
                                      <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Referrer Email</span>
                                        <span style={styles.detailValue}>{u.referredBy.email || 'N/A'}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Membership & Card */}
                                <div style={styles.expandedSection}>
                                  <h4 style={styles.expandedTitle}>
                                    <CreditCard size={14} /> Membership & Card
                                  </h4>
                                  <div style={styles.expandedDetails}>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>VIP Status</span>
                                      <span style={styles.detailValue}>
                                        {u.isVip ? (
                                          <span style={styles.vipBadge}>
                                            <Star size={12} color="#eab308" /> Active
                                          </span>
                                        ) : '❌ Not Active'}
                                      </span>
                                    </div>
                                    {u.isVip && u.vipExpiry && (
                                      <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>VIP Expiry</span>
                                        <span style={styles.detailValue}>
                                          {new Date(u.vipExpiry).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Card Status</span>
                                      <span style={styles.detailValue}>
                                        <span style={{
                                          ...styles.cardStatusBadge,
                                          backgroundColor: {
                                            'Ordered': '#3b82f620',
                                            'Printing': '#eab30820',
                                            'Shipped': '#8b5cf620',
                                            'Delivered': '#22c55e20',
                                            'None': '#94a3b820'
                                          }[u.cardStatus] || '#94a3b820',
                                          color: {
                                            'Ordered': '#3b82f6',
                                            'Printing': '#eab308',
                                            'Shipped': '#8b5cf6',
                                            'Delivered': '#22c55e',
                                            'None': '#94a3b8'
                                          }[u.cardStatus] || '#94a3b8'
                                        }}>
                                          {u.cardStatus || 'None'}
                                        </span>
                                      </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Payment Status</span>
                                      <span style={styles.detailValue}>
                                        <span style={{
                                          ...styles.paymentStatusBadge,
                                          backgroundColor: {
                                            'Verified': '#22c55e20',
                                            'Pending Verification': '#eab30820',
                                            'Rejected': '#ef444420',
                                            'None': '#94a3b820'
                                          }[u.paymentStatus] || '#94a3b820',
                                          color: {
                                            'Verified': '#22c55e',
                                            'Pending Verification': '#eab308',
                                            'Rejected': '#ef4444',
                                            'None': '#94a3b8'
                                          }[u.paymentStatus] || '#94a3b8'
                                        }}>
                                          {u.paymentStatus || 'None'}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bio */}
                                {u.bio && (
                                  <div style={{...styles.expandedSection, gridColumn: 'span 2'}}>
                                    <h4 style={styles.expandedTitle}>
                                      <FileText size={14} /> Bio
                                    </h4>
                                    <p style={styles.bioText}>{u.bio}</p>
                                  </div>
                                )}

                                {/* Education History */}
                                {u.education && u.education.length > 0 && (
                                  <div style={{...styles.expandedSection, gridColumn: 'span 2'}}>
                                    <h4 style={styles.expandedTitle}>
                                      <GraduationCap size={14} /> Education History
                                    </h4>
                                    {u.education.map((edu, i) => (
                                      <div key={i} style={styles.eduItem}>
                                        <div style={styles.eduHeader}>
                                          <strong>{edu.school}</strong>
                                          <span style={styles.eduYear}>
                                            {edu.startYear} — {edu.endYear}
                                          </span>
                                        </div>
                                        <div style={styles.eduDegree}>{edu.degree}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div style={{...styles.expandedSection, gridColumn: 'span 2'}}>
                                  <h4 style={styles.expandedTitle}>
                                    <Calendar size={14} /> Timestamps
                                  </h4>
                                  <div style={styles.expandedDetails}>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Joined</span>
                                      <span style={styles.detailValue}>
                                        {new Date(u.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                      <span style={styles.detailLabel}>Last Updated</span>
                                      <span style={styles.detailValue}>
                                        {new Date(u.updatedAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => viewStudentDetails(u._id)}
                                style={styles.viewFullBtn}
                              >
                                View Full Dossier <ChevronRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={styles.emptyState}>
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
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
        }
        @keyframes flamePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
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
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
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
        .user-row.top-referrer {
          background: linear-gradient(90deg, #faf5ff 0%, #ffffff 100%);
          border-left: 3px solid #8b5cf6;
        }
        .user-row.top-referrer:hover {
          background: linear-gradient(90deg, #f3f0ff 0%, #f8fafc 100%);
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
        }
        .sortable:hover {
          color: #0a0b0f;
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
    marginBottom: "28px",
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
    minWidth: "100px",
    padding: "16px 20px",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: 'blur(10px)',
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    border: "1px solid rgba(255, 255, 255, 0.8)",
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
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
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
    gap: "12px",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px",
    borderRadius: "40px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    padding: "0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterBtn: {
    padding: "6px 14px",
    borderRadius: "32px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "12px",
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
    borderRadius: "20px",
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
  topReferrerRow: {
    background: "linear-gradient(90deg, #faf5ff 0%, #ffffff 100%)",
    borderLeft: "3px solid #8b5cf6",
  },
  td: {
    padding: "16px 20px",
    fontSize: "14px",
    color: "#1e293b",
    verticalAlign: "middle",
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
    top: "-6px",
    right: "-6px",
    fontSize: "14px",
    animation: "crownFloat 2s ease-in-out infinite",
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
    fontSize: "13px",
    marginBottom: "4px",
  },
  phoneCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "12px",
  },
  universityTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#475569",
  },
  rollNoText: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  referralInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  referralCode: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
  },
  referralStats: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  referralBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  referralCountNumber: {
    fontWeight: "800",
    fontSize: "14px",
  },
  referralLevelText: {
    fontSize: "10px",
    opacity: 0.8,
  },
  flameBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f5f3ff",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#8b5cf6",
    animation: "flamePulse 2s ease-in-out infinite",
  },
  referredBy: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
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
  vipBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "linear-gradient(135deg, #fefce8, #fef3c7)",
    color: "#d97706",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },
  nonVipBadge: {
    color: "#cbd5e1",
    fontSize: "16px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  viewBtn: {
    padding: "8px",
    borderRadius: "10px",
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
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
  },
  expandedRow: {
    padding: 0,
  },
  expandedContent: {
    padding: "24px 32px",
    background: "rgba(250, 251, 252, 0.8)",
    backdropFilter: 'blur(10px)',
    borderTop: "1px solid #f0f2f5",
    borderBottom: "1px solid #f0f2f5",
  },
  expandedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "20px",
  },
  expandedSection: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "16px",
    padding: "16px 20px",
    border: "1px solid #f0f2f5",
  },
  expandedTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 12px 0",
    paddingBottom: "10px",
    borderBottom: "1px solid #f0f2f5",
  },
  expandedDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    fontSize: "13px",
    gap: "12px",
  },
  detailLabel: {
    color: "#64748b",
    fontWeight: "500",
    whiteSpace: "nowrap",
    minWidth: "100px",
  },
  detailValue: {
    color: "#1e293b",
    textAlign: "right",
    wordBreak: "break-word",
  },
  referralCodeDisplay: {
    background: "#f1f5f9",
    padding: "2px 10px",
    borderRadius: "6px",
  },
  referralCodeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
  },
  referralCountBadge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #fefce8, #fef3c7)",
    color: "#d97706",
    padding: "2px 12px",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "13px",
  },
  topReferralBadge: {
    background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
    color: "#8b5cf6",
    animation: "glow 2s ease-in-out infinite",
  },
  levelBadge: {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "12px",
  },
  cardStatusBadge: {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  paymentStatusBadge: {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  bioText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.6",
    margin: 0,
  },
  eduItem: {
    padding: "8px 0",
    borderBottom: "1px solid #f0f2f5",
  },
  eduHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    marginBottom: "2px",
    flexWrap: "wrap",
    gap: "8px",
  },
  eduYear: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  eduDegree: {
    fontSize: "12px",
    color: "#64748b",
  },
  viewFullBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
  skillsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  skillTagSmall: {
    padding: "2px 10px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#475569",
    fontWeight: "500",
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