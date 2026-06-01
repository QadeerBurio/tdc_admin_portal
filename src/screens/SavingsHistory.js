import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  FaMoneyBillWave, 
  FaUniversity, 
  FaTag, 
  FaDownload, 
   
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaShoppingBag,
  FaTimes
} from "react-icons/fa";

const SavingsHistory = () => {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchHistory();
  }, [token]);

  useEffect(() => {
    let results = [...history];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.rollNo?.toLowerCase().includes(term) ||
        item.university?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term)
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      results = results.filter(item => new Date(item.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      results = results.filter(item => new Date(item.date) <= new Date(dateRange.end));
    }
    
    // Sort
    results.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    setFilteredHistory(results);
  }, [searchTerm, dateRange, sortField, sortDirection, history]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/offers/savings-report", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
      setFilteredHistory(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Roll No", "University", "Brand/Offer", "Bill Amount (PKR)", "Saved Amount (PKR)", "Final Paid (PKR)", "Date"];
    const rows = filteredHistory.map(item => [
      item.name,
      item.rollNo,
      item.university,
      item.brand,
      item.bill.toFixed(2),
      item.saved.toFixed(2),
      (item.bill - item.saved).toFixed(2),
      new Date(item.date).toLocaleDateString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Savings_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
  };

  const totalSaved = history.reduce((acc, curr) => acc + curr.saved, 0);
  const totalTransactions = history.length;
  const averageSaved = totalTransactions > 0 ? totalSaved / totalTransactions : 0;

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration}></div>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerBadge}>
            <FaMoneyBillWave />
            <span>Financial Report</span>
          </div>
          <h2 style={styles.title}>Savings Impact Dashboard</h2>
          <p style={styles.subtitle}>Track student redemptions and total savings generated through your offers</p>
        </div>
        <button className="download-btn" style={styles.downloadBtn} onClick={downloadCSV} disabled={filteredHistory.length === 0}>
          <FaDownload /> Export Report
        </button>
      </div>

      {/* Stats Overview Section */}
      <div style={styles.statsRow}>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaWallet color="#10b981" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Total Student Savings</span>
            <h3 style={styles.statValue}>₨ {totalSaved.toLocaleString()}</h3>
            <span style={{...styles.statTrend, color: '#10b981'}}>
              <FaArrowUp size={10} /> +12% from last month
            </span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#eff6ff'}}>
            <FaShoppingBag color="#3b82f6" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Total Redemptions</span>
            <h3 style={styles.statValue}>{totalTransactions}</h3>
            <span style={{...styles.statTrend, color: '#3b82f6'}}>
              Completed transactions
            </span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fff7ed'}}>
            <FaChartLine color="#ff961a" size={24} />
          </div>
          <div>
            <span style={styles.statLabel}>Average Savings per Student</span>
            <h3 style={styles.statValue}>₨ {averageSaved.toLocaleString()}</h3>
            <span style={{...styles.statTrend, color: '#ff961a'}}>
              Per redemption
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <input 
            style={styles.searchInput}
            placeholder="Search by name, roll no, university or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(searchTerm || dateRange.start || dateRange.end) && (
            <button style={styles.clearBtn} onClick={clearFilters}>
              <FaTimes /> Clear
            </button>
          )}
        </div>
        <div style={styles.dateFilters}>
          <input 
            type="date" 
            style={styles.dateInput}
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            placeholder="Start Date"
          />
          <span style={styles.dateSeparator}>to</span>
          <input 
            type="date" 
            style={styles.dateInput}
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th} onClick={() => handleSort("name")}>
                Student {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("university")}>
                University {sortField === "university" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("brand")}>
                Offer {sortField === "brand" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("bill")}>
                Bill Amount {sortField === "bill" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("saved")}>
                Saved {sortField === "saved" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th style={styles.th} onClick={() => handleSort("date")}>
                Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={styles.loadingCell}>
                  <div className="loader" style={styles.loader}></div>
                  <span>Loading transaction records...</span>
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>💰</div>
                    <p>No transactions found</p>
                    <span>Try adjusting your search or date filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, index) => (
                <tr key={index} className="table-row" style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.studentCell}>
                      <div style={{...styles.avatar, background: `hsl(${item.name?.length * 40 % 360}, 70%, 55%)`}}>
                        {item.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.studentName}>{item.name}</div>
                        <div style={styles.studentRoll}>Roll: {item.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.universityBadge}>
                      <FaUniversity size={10} style={{marginRight: '6px', opacity: 0.7}} />
                      {item.university?.length > 35 ? item.university.substring(0, 32) + '...' : item.university}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.offerCell}>
                      <FaTag size={12} color="#ff961a" />
                      <span style={styles.offerName}>{item.brand}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.billAmount}>₨ {item.bill.toLocaleString()}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.savedBadge}>
                      <FaArrowDown size={10} />
                      ₨ {item.saved.toLocaleString()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.dateCell}>
                      <FaCalendarAlt size={12} color="#94a3b8" />
                      <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      {filteredHistory.length > 0 && (
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <FaTrophy style={{color: '#ff961a'}} />
            <span>Showing {filteredHistory.length} of {history.length} transactions</span>
          </div>
          <div style={styles.footerRight}>
            <span>Total Savings: <strong>₨ {filteredHistory.reduce((acc, curr) => acc + curr.saved, 0).toLocaleString()}</strong></span>
          </div>
        </div>
      )}

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
          margin: 0 auto 12px;
          animation: pulse 0.8s linear infinite;
        }
        
        input:focus {
          outline: none;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
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
    marginBottom: "28px",
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
  statTrend: {
    fontSize: "11px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    marginTop: "6px"
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1
  },
  searchWrapper: {
    display: "flex",
    gap: "12px",
    flex: 2
  },
  searchInput: {
    flex: 1,
    padding: "12px 18px",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit"
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.2s"
  },
  dateFilters: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1
  },
  dateInput: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "13px",
    backgroundColor: "#fff",
    fontFamily: "inherit",
    cursor: "pointer"
  },
  dateSeparator: {
    color: "#94a3b8",
    fontSize: "13px"
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
    color: "#94a3b8"
  },
  universityBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#475569",
    maxWidth: "200px"
  },
  offerCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  offerName: {
    fontWeight: "500",
    color: "#1e293b"
  },
  billAmount: {
    fontWeight: "600",
    color: "#1e293b"
  },
  savedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#f0fdf4",
    color: "#10b981",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700"
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    position: "relative",
    zIndex: 1
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#64748b"
  },
  footerRight: {
    fontSize: "14px",
    color: "#1e293b"
  }
};

export default SavingsHistory;